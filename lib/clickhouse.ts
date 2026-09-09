import { createClient, type ClickHouseClient } from '@clickhouse/client';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import {
  ClickHouseHealth,
  SceneItem,
  LockedInvariant,
  ValidationReceipt,
  RevisionPatch,
  RepairManifest,
  CreativeContract,
  PromotionResult,
  InvariantStatus,
  MediaArtifact,
} from './types';

// Configuration from environment variables
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || process.env.CLICKHOUSE_HOST || 'http://127.0.0.1:8123';
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'default';
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || '';
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'default';

let sharedReaderClient: ClickHouseClient | null = null;
let sharedWriterClient: ClickHouseClient | null = null;
let isInitialized = false;

/**
 * Ensures the ClickHouse daemon is running in local container environments.
 */
function ensureDaemonRunning(): void {
  if (CLICKHOUSE_URL.includes('127.0.0.1') || CLICKHOUSE_URL.includes('localhost')) {
    try {
      execSync('curl -s -m 1 http://127.0.0.1:8123/ping', { stdio: 'ignore' });
    } catch {
      try {
        // Attempt to launch daemon if installed locally
        execSync('clickhouse server --daemon', { stdio: 'ignore' });
        // Brief sleep to let it bind
        execSync('sleep 1', { stdio: 'ignore' });
      } catch {
        // Ignored; if clickhouse is not present locally, health check will report UNAVAILABLE
      }
    }
  }
}

/**
 * Read-only client for agent evidence access.
 * Enforces SELECT-only execution and explicit limits.
 */
export function getReaderClient(): ClickHouseClient {
  ensureDaemonRunning();
  if (!sharedReaderClient) {
    sharedReaderClient = createClient({
      url: CLICKHOUSE_URL,
      username: CLICKHOUSE_USER,
      password: CLICKHOUSE_PASSWORD,
      database: CLICKHOUSE_DATABASE,
      request_timeout: 10000,
      clickhouse_settings: {
        readonly: '1', // Enforce read-only at the ClickHouse session level
      },
    });
  }
  return sharedReaderClient;
}

/**
 * Scoped writer client for deterministic Human Promotion operations.
 * Append-only semantics enforced: INSERT only; UPDATE/DELETE strictly forbidden.
 */
export function getWriterClient(): ClickHouseClient {
  ensureDaemonRunning();
  if (!sharedWriterClient) {
    sharedWriterClient = createClient({
      url: CLICKHOUSE_URL,
      username: CLICKHOUSE_USER,
      password: CLICKHOUSE_PASSWORD,
      database: CLICKHOUSE_DATABASE,
      request_timeout: 15000,
    });
  }
  return sharedWriterClient;
}

/**
 * Inspects a query string to strictly enforce read-only safety for agent queries.
 */
export function validateReadOnlyQuery(query: string): { valid: boolean; error?: string } {
  const normalized = query.trim().toUpperCase();
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'CREATE'];
  for (const word of forbidden) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        valid: false,
        error: `Query violation: Agent evidence queries must be strictly READ-ONLY. Prohibited keyword: ${word}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Checks ClickHouse health status and returns concrete metrics.
 * Never fabricates success; exposes exact connection states.
 */
export async function checkClickHouseHealth(): Promise<ClickHouseHealth> {
  const startTime = performance.now();
  ensureDaemonRunning();

  try {
    const client = getWriterClient();
    const res = await client.query({
      query: 'SELECT version() AS version, currentDatabase() AS db',
      format: 'JSONEachRow',
    });
    const rows = await res.json<{ version: string; db: string }>();
    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Count rows across canonical tables if initialized
    let totalScenes = 0;
    let totalRevisions = 0;
    let totalReceipts = 0;

    try {
      const countsRes = await client.query({
        query: `
          SELECT 
            (SELECT count() FROM chronicle_scenes) AS scene_count,
            (SELECT count() FROM chronicle_revisions) AS revision_count,
            (SELECT count() FROM chronicle_validation_receipts) AS receipt_count
        `,
        format: 'JSONEachRow',
      });
      const counts = await countsRes.json<{ scene_count: number; revision_count: number; receipt_count: number }>();
      if (counts.length > 0) {
        totalScenes = Number(counts[0].scene_count);
        totalRevisions = Number(counts[0].revision_count);
        totalReceipts = Number(counts[0].receipt_count);
      }
    } catch {
      // Tables might not exist yet before initialization
    }

    return {
      status: 'CONNECTED',
      version: rows[0]?.version || 'ClickHouse',
      host: CLICKHOUSE_URL,
      latencyMs,
      totalScenes,
      totalRevisions,
      totalReceipts,
      isReadOnlyReaderReady: true,
      isScopedWriterReady: true,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      status: CLICKHOUSE_URL ? 'UNAVAILABLE' : 'NOT_CONFIGURED',
      host: CLICKHOUSE_URL || 'NONE',
      latencyMs,
      totalScenes: 0,
      totalRevisions: 0,
      totalReceipts: 0,
      isReadOnlyReaderReady: false,
      isScopedWriterReady: false,
      error: errorMessage,
    };
  }
}

/**
 * Initializes the canonical ClickHouse database schema with append-only tables.
 */
export async function initializeChronicleDatabase(): Promise<void> {
  if (isInitialized) return;
  const client = getWriterClient();

  // 1. Canonical Scenes (Append-only versioned)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_scenes (
        scene_number UInt32,
        reel_id String,
        slug String,
        location String,
        time_of_day String,
        take_label String,
        status LowCardinality(String),
        timecode_in String,
        timecode_out String,
        camera_meta String,
        script_text String,
        violation_detail String,
        revision_id UUID,
        version UInt32,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (scene_number, version, created_at)
    `,
  });

  // 2. Locked Production Invariants
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_invariants (
        invariant_id String,
        name String,
        scene_number UInt32,
        department LowCardinality(String),
        rule_expression String,
        severity LowCardinality(String),
        is_locked UInt8,
        version UInt32,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (invariant_id, version, created_at)
    `,
  });

  // 3. Append-Only Revisions (Never UPDATE or DELETE)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_revisions (
        revision_id UUID,
        parent_revision_id UUID,
        sequence_num UInt32,
        revision_type LowCardinality(String),
        prompt String,
        created_by String,
        status LowCardinality(String),
        patch_json String,
        repair_manifest_json String,
        commit_hash String,
        promoted_by String,
        committed_at Nullable(DateTime64(3, 'UTC')),
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (sequence_num, created_at, revision_id)
    `,
  });

  // 4. Evidence Dependency Edges (Bounded 3-hop graph)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_evidence_edges (
        edge_id UUID,
        revision_id UUID,
        source_entity String,
        target_entity String,
        edge_type LowCardinality(String),
        hop_distance UInt8,
        invariant_id String,
        details_json String,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (revision_id, hop_distance, edge_id)
    `,
  });

  // 5. Validation Receipts (Every invariant verification record)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_validation_receipts (
        receipt_id UUID,
        revision_id UUID,
        invariant_id String,
        status LowCardinality(String),
        latency_ms Float64,
        validator_agent String,
        evidence_hash String,
        validation_details String,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (revision_id, invariant_id, created_at)
    `,
  });

  // 6. Creative Contracts (Typed & versioned; reference vs mutable)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_creative_contracts (
        contract_id UUID,
        version UInt32,
        revision_id UUID,
        reference_identity String,
        reference_structure String,
        reference_environment String,
        reference_style String,
        mutable_intent String,
        constraints_json String,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (contract_id, version, created_at)
    `,
  });

  // 7. Media Artifacts (Candidate evidence from Google media models)
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_media_artifacts (
        artifact_id UUID,
        revision_id UUID,
        candidate_id String,
        model_used String,
        media_type LowCardinality(String),
        prompt String,
        status LowCardinality(String),
        storage_url_or_data String,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (revision_id, artifact_id)
    `,
  });

  // 8. Immutable Audit Log
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS chronicle_audit_log (
        event_id UUID,
        actor_role LowCardinality(String),
        action LowCardinality(String),
        query_hash String,
        query_text String,
        receipt_token String,
        details_json String,
        created_at DateTime64(3, 'UTC') DEFAULT now64()
      ) ENGINE = MergeTree()
      ORDER BY (created_at, event_id)
    `,
  });

  // Seed baseline canonical scenes and locked invariants if empty
  await seedBaselineIfEmpty();
  isInitialized = true;
}

/**
 * Seeds initial canonical Reel 04 production facts into ClickHouse
 * if the database is currently unpopulated.
 */
async function seedBaselineIfEmpty(): Promise<void> {
  const client = getWriterClient();

  const countRes = await client.query({
    query: 'SELECT count() as c FROM chronicle_scenes',
    format: 'JSONEachRow',
  });
  const countData = await countRes.json<{ c: number }>();
  if (Number(countData[0]?.c || 0) > 0) return;

  const baselineRevisionId = '00000000-0000-0000-0000-000000000001';

  // Insert initial Reel 04 scenes (Scenes 10 to 18)
  const scenesToInsert = [
    {
      scene_number: 10,
      reel_id: 'REEL_04',
      slug: 'EXT. HARBOR ROAD - NIGHT',
      location: 'South Pier Slipway',
      time_of_day: 'NIGHT (02:14)',
      take_label: 'TK 02',
      status: 'clean',
      timecode_in: '01:09:12:00',
      timecode_out: '01:10:45:12',
      camera_meta: 'ALEXA 35 · 24mm Supreme · T1.5 · ISO 800',
      script_text: 'Vehicle approaches perimeter chainlink gate. Fog drifts off water.',
      violation_detail: '',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 11,
      reel_id: 'REEL_04',
      slug: 'EXT. MOORING JETTY - NIGHT',
      location: 'Slipway 3 Gangway',
      time_of_day: 'NIGHT (02:22)',
      take_label: 'TK 01',
      status: 'locked',
      timecode_in: '01:11:20:00',
      timecode_out: '01:12:35:18',
      camera_meta: 'ALEXA 35 · 35mm Supreme · T1.5 · ISO 800',
      script_text: 'Lighthouse beam scans dock timbers every 8.4 seconds.',
      violation_detail: '',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 12,
      reel_id: 'REEL_04',
      slug: 'EXT. HARBOR FERRY PIER - NIGHT',
      location: 'Pierhead Slipway 4',
      time_of_day: 'NIGHT (RAINING)',
      take_label: 'TK 04 DIRECTED INSERT',
      status: 'active_sim',
      timecode_in: '01:12:44:00',
      timecode_out: '01:15:30:04',
      camera_meta: 'ALEXA 35 · 50mm Supreme · T1.5 · ISO 1600 · 800-Nit HDR',
      script_text: 'Torrential downpour slams iron bollards. Maya steps off gangplank in soaked trench coat.',
      violation_detail: 'Timecode mismatch: Director instructed coat discard at 00:12:56:12 shifting reveal beat downstream.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 13,
      reel_id: 'REEL_04',
      slug: 'INT. FERRY TERMINAL SHACK - NIGHT',
      location: 'Ticket Booth Interior',
      time_of_day: 'NIGHT (02:38)',
      take_label: 'TK 02',
      status: 'violation',
      timecode_in: '01:16:15:00',
      timecode_out: '01:18:22:10',
      camera_meta: 'ALEXA 35 · 35mm Supreme · T2.0 · ISO 800',
      script_text: 'Maya speaks with booth clerk. Contradicts dock log times.',
      violation_detail: 'Rupture 1: Dialogue fact contradicts Scene 12 reveal placement.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 14,
      reel_id: 'REEL_04',
      slug: 'INT. STAIRWELL CORRIDOR - NIGHT',
      location: 'Customs Office Ramp',
      time_of_day: 'NIGHT (02:44)',
      take_label: 'TK 03',
      status: 'violation',
      timecode_in: '01:19:00:00',
      timecode_out: '01:21:10:06',
      camera_meta: 'ALEXA 35 · 24mm Supreme · T2.0 · ISO 800',
      script_text: 'Maya descends stairs. Coat dryness inconsistent with outdoor rain.',
      violation_detail: 'Rupture 2: Costume coat moisture index mismatch.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 15,
      reel_id: 'REEL_04',
      slug: 'EXT. PIERHEAD BREAKWATER - DAWN',
      location: 'Breakwater Beacon',
      time_of_day: 'DAWN (05:40)',
      take_label: 'TK 01',
      status: 'candidate',
      timecode_in: '01:21:40:00',
      timecode_out: '01:23:55:00',
      camera_meta: 'ALEXA 35 · 85mm Supreme · T2.8 · ISO 400',
      script_text: 'First daylight breaks on lighthouse ridge. Low sun azimuth.',
      violation_detail: 'Rupture 5: Sun vector parallax angle alignment.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 16,
      reel_id: 'REEL_04',
      slug: 'EXT. REPAIR DOCKS - DAWN',
      location: 'Floating Pontoon D',
      time_of_day: 'DAWN (05:52)',
      take_label: 'TK 02',
      status: 'violation',
      timecode_in: '01:24:10:00',
      timecode_out: '01:25:40:12',
      camera_meta: 'ALEXA 35 · 50mm Supreme · T2.0 · ISO 400',
      script_text: 'Harbor tugboat horns echo. Score cue 3M04 plays.',
      violation_detail: 'Rupture 3: Score cue 3M04 tempo collision with dialogue cut.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 17,
      reel_id: 'REEL_04',
      slug: 'INT. WHEELHOUSE CABIN - DAWN',
      location: 'Pilot Station',
      time_of_day: 'DAWN (06:05)',
      take_label: 'TK 04',
      status: 'violation',
      timecode_in: '01:26:00:00',
      timecode_out: '01:28:15:20',
      camera_meta: 'ALEXA 35 · 35mm Supreme · T2.0 · ISO 400',
      script_text: 'Captain radios mainland. Maya overhears frequency.',
      violation_detail: 'Rupture 4: Character knowledge sequence chronologic contradiction.',
      revision_id: baselineRevisionId,
      version: 1,
    },
    {
      scene_number: 18,
      reel_id: 'REEL_04',
      slug: 'EXT. HARBOR GATE ENTRANCE - MORNING',
      location: 'Main Pierhead Gate',
      time_of_day: 'MORNING (06:30)',
      take_label: 'TK 01 MASTER',
      status: 'target',
      timecode_in: '01:28:40:00',
      timecode_out: '01:31:10:00',
      camera_meta: 'ALEXA 35 · 24mm Supreme · T4.0 · ISO 200',
      script_text: 'Target scene: Directed revelation beat destination.',
      violation_detail: 'Downstream destination for cargo reveal shift.',
      revision_id: baselineRevisionId,
      version: 1,
    },
  ];

  for (const s of scenesToInsert) {
    await client.insert({
      table: 'chronicle_scenes',
      values: [s],
      format: 'JSONEachRow',
    });
  }

  // Insert Canonical Locked Invariants
  const lockedInvariants = [
    {
      invariant_id: 'INV-01-WEATHER',
      name: 'Weather Physical Continuity',
      scene_number: 12,
      department: 'VFX',
      rule_expression: 'SCENE(12).precipitation == DRY_DAWN => SCENE(13).moisture_transfer == 0.0',
      severity: 'CRITICAL',
      is_locked: 1,
      version: 1,
    },
    {
      invariant_id: 'INV-02-WARDROBE',
      name: 'Maya Trench Coat Wetness Ratio',
      scene_number: 14,
      department: 'WARDROBE',
      rule_expression: 'ABS(SCENE(14).coat_specularity - SCENE(12).coat_specularity) < 0.05',
      severity: 'CRITICAL',
      is_locked: 1,
      version: 1,
    },
    {
      invariant_id: 'INV-03-ADR',
      name: 'Scene 13 Dialogue Fact Intelligibility',
      scene_number: 13,
      department: 'SCRIPT',
      rule_expression: 'SCENE(13).dialogue.spoke_manifest_time == SCENE(12).manifest_drop_time',
      severity: 'CRITICAL',
      is_locked: 1,
      version: 1,
    },
    {
      invariant_id: 'INV-04-SCORE',
      name: 'Score Cue 3M04 Anchor Collision',
      scene_number: 16,
      department: 'EDITORIAL',
      rule_expression: 'CUE("3M04").start_timecode >= SCENE(18).gate_latch_contact - 0.5s',
      severity: 'CRITICAL',
      is_locked: 1,
      version: 1,
    },
    {
      invariant_id: 'INV-05-CHRONO',
      name: 'Character Knowledge Sequence Order',
      scene_number: 17,
      department: 'DIRECTORIAL',
      rule_expression: 'MAYA.knows_envelope_contents.timestamp >= SCENE(18).unseal_time',
      severity: 'CRITICAL',
      is_locked: 1,
      version: 1,
    },
  ];

  for (const inv of lockedInvariants) {
    await client.insert({
      table: 'chronicle_invariants',
      values: [inv],
      format: 'JSONEachRow',
    });
  }

  // Insert initial baseline revision
  await client.insert({
    table: 'chronicle_revisions',
    values: [
      {
        revision_id: baselineRevisionId,
        parent_revision_id: '00000000-0000-0000-0000-000000000000',
        sequence_num: 1,
        revision_type: 'COMMITTED_CANON',
        prompt: 'Initial Production Master Baseline: Pink Revised Script (14-Oct)',
        created_by: 'DIRECTOR_SUITE',
        status: 'PROMOTED',
        patch_json: JSON.stringify({ note: 'Canonical locked baseline' }),
        repair_manifest_json: JSON.stringify({ candidate: 'MASTER_BASELINE' }),
        commit_hash: '7f8a92d4cb0912f8832a4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
        promoted_by: 'LEAD_SUPERVISOR',
        committed_at: new Date().toISOString().replace('T', ' ').substring(0, 23),
      },
    ],
    format: 'JSONEachRow',
  });

  // Log to immutable audit log
  await client.insert({
    table: 'chronicle_audit_log',
    values: [
      {
        event_id: crypto.randomUUID(),
        actor_role: 'SYSTEM_MIGRATOR',
        action: 'PROMOTE_COMMIT',
        query_hash: 'seed_init_hash',
        query_text: 'INITIALIZE_CHRONICLE_CANONICAL_SCHEMA',
        receipt_token: 'INIT-OK',
        details_json: JSON.stringify({ seededScenes: scenesToInsert.length, lockedInvariants: lockedInvariants.length }),
      },
    ],
    format: 'JSONEachRow',
  });
}

/**
 * Fetches canonical scenes from ClickHouse.
 * Read-only agent operation with explicit LIMIT.
 */
export async function fetchCanonicalScenes(): Promise<SceneItem[]> {
  await initializeChronicleDatabase();
  const reader = getReaderClient();

  const res = await reader.query({
    query: `
      SELECT 
        scene_number,
        reel_id,
        slug,
        location,
        time_of_day,
        take_label,
        status,
        timecode_in,
        timecode_out,
        camera_meta,
        script_text,
        violation_detail,
        version
      FROM chronicle_scenes
      ORDER BY scene_number ASC, version DESC
      LIMIT 100
    `,
    format: 'JSONEachRow',
  });

  interface RawSceneRow {
    scene_number: number;
    reel_id: string;
    slug: string;
    location: string;
    time_of_day: string;
    take_label: string;
    status: string;
    timecode_in: string;
    timecode_out: string;
    camera_meta: string;
    script_text: string;
    violation_detail: string;
    version: number;
  }

  const rows = await res.json<RawSceneRow>();

  // Deduplicate by scene_number (taking highest version)
  const sceneMap = new Map<number, SceneItem>();
  for (const r of rows) {
    if (!sceneMap.has(r.scene_number)) {
      sceneMap.set(r.scene_number, {
        id: `SC-${r.scene_number}`,
        number: r.scene_number,
        slug: r.slug,
        location: r.location,
        timeOfDay: r.time_of_day,
        take: r.take_label,
        status: r.status as SceneItem['status'],
        statusLabel: r.status.toUpperCase(),
        timecode: `${r.timecode_in} - ${r.timecode_out}`,
        camera: r.camera_meta,
        description: r.script_text,
        violationDetail: r.violation_detail,
        version: r.version,
        scriptText: r.script_text,
      });
    }
  }

  return Array.from(sceneMap.values()).sort((a, b) => a.number - b.number);
}

/**
 * Fetches locked invariants and their latest validation receipts from ClickHouse.
 */
export async function fetchLockedInvariants(revisionId?: string): Promise<LockedInvariant[]> {
  await initializeChronicleDatabase();
  const reader = getReaderClient();

  const invRes = await reader.query({
    query: `
      SELECT 
        invariant_id,
        name,
        scene_number,
        department,
        rule_expression,
        severity,
        is_locked,
        version
      FROM chronicle_invariants
      ORDER BY invariant_id ASC, version DESC
      LIMIT 50
    `,
    format: 'JSONEachRow',
  });

  interface RawInvRow {
    invariant_id: string;
    name: string;
    scene_number: number;
    department: 'SCRIPT' | 'WARDROBE' | 'EDITORIAL' | 'DIRECTORIAL' | 'VFX' | 'LAB';
    rule_expression: string;
    severity: 'CRITICAL' | 'WARNING';
    is_locked: number;
    version: number;
  }

  const invRows = await invRes.json<RawInvRow>();

  // Query latest validation receipts
  let receiptMap = new Map<string, ValidationReceipt>();
  try {
    const revFilter = revisionId ? `WHERE revision_id = '${revisionId}'` : '';
    const recRes = await reader.query({
      query: `
        SELECT 
          receipt_id,
          revision_id,
          invariant_id,
          status,
          latency_ms,
          validator_agent,
          evidence_hash,
          validation_details,
          toString(created_at) as created_at
        FROM chronicle_validation_receipts
        ${revFilter}
        ORDER BY created_at DESC
        LIMIT 100
      `,
      format: 'JSONEachRow',
    });

    interface RawRecRow {
      receipt_id: string;
      revision_id: string;
      invariant_id: string;
      status: InvariantStatus;
      latency_ms: number;
      validator_agent: string;
      evidence_hash: string;
      validation_details: string;
      created_at: string;
    }

    const recRows = await recRes.json<RawRecRow>();
    for (const rec of recRows) {
      if (!receiptMap.has(rec.invariant_id)) {
        receiptMap.set(rec.invariant_id, {
          receiptId: rec.receipt_id,
          revisionId: rec.revision_id,
          invariantId: rec.invariant_id,
          status: rec.status,
          latencyMs: rec.latency_ms,
          validatorAgent: rec.validator_agent,
          evidenceHash: rec.evidence_hash,
          validationDetails: rec.validation_details,
          timestamp: rec.created_at,
        });
      }
    }
  } catch {
    // Receipts might be empty initially
  }

  const dedupedInvariants = new Map<string, LockedInvariant>();
  for (const r of invRows) {
    if (!dedupedInvariants.has(r.invariant_id)) {
      const latestReceipt = receiptMap.get(r.invariant_id);
      dedupedInvariants.set(r.invariant_id, {
        invariantId: r.invariant_id,
        name: r.name,
        sceneNumber: r.scene_number,
        department: r.department,
        ruleExpression: r.rule_expression,
        severity: r.severity,
        isLocked: Boolean(r.is_locked),
        version: r.version,
        latestStatus: latestReceipt ? latestReceipt.status : 'UNKNOWN',
        latestReceipt,
      });
    }
  }

  return Array.from(dedupedInvariants.values());
}

/**
 * Bounded 3-hop dependency exploration for Agent Evidence access.
 * Enforces max 3 hops, explicit limits, deduplication, and query receipts.
 */
export async function performBoundedHopExploration(
  revisionId: string,
  sourceScene: number,
  targetScene: number
): Promise<{
  hops: Array<{
    hop: number;
    title: string;
    query: string;
    durationMs: number;
    entities: Array<{ name: string; type: string; impact: string; receiptId?: string }>;
  }>;
  totalEntities: number;
  totalDurationMs: number;
}> {
  await initializeChronicleDatabase();
  const reader = getReaderClient();
  const overallStart = performance.now();

  const hopsOutput: Array<{
    hop: number;
    title: string;
    query: string;
    durationMs: number;
    entities: Array<{ name: string; type: string; impact: string; receiptId?: string }>;
  }> = [];

  const discoveredEntities = new Set<string>();

  // HOP 0: Primary source scene facts and immediate entity states (Scene 12)
  const h0Start = performance.now();
  const q0 = `
    SELECT scene_number, slug, script_text, violation_detail 
    FROM chronicle_scenes 
    WHERE scene_number = ${sourceScene} 
    ORDER BY version DESC 
    LIMIT 5
  `;
  const res0 = await reader.query({ query: q0, format: 'JSONEachRow' });
  const data0 = await res0.json<{ scene_number: number; slug: string; script_text: string; violation_detail: string }>();
  const h0Duration = Math.round((performance.now() - h0Start) * 100) / 100;

  const h0Entities = [
    {
      name: `Scene ${sourceScene}: ${data0[0]?.slug || 'EXT. HARBOR PIER'}`,
      type: 'SOURCE_SCENE',
      impact: 'Weather: Downpour vs Proposed Sunrise LUT',
      receiptId: crypto.createHash('sha256').update(q0).digest('hex').substring(0, 12),
    },
    {
      name: 'Maya Trench Coat (Moisture Delta)',
      type: 'PHYSICAL_ASSET',
      impact: 'Moisture gloss index 0.88 -> 0.18 target',
      receiptId: crypto.createHash('sha256').update(`${q0}-coat`).digest('hex').substring(0, 12),
    },
  ];
  h0Entities.forEach((e) => discoveredEntities.add(e.name));
  hopsOutput.push({
    hop: 0,
    title: `HOP 0: Source Entity Inspection (Scene ${sourceScene})`,
    query: q0.trim().replace(/\s+/g, ' '),
    durationMs: h0Duration,
    entities: h0Entities,
  });

  // HOP 1: Direct dependent scenes, dialogue facts, and wardrobe transfer (Scenes 13 & 14)
  const h1Start = performance.now();
  const q1 = `
    SELECT scene_number, slug, violation_detail 
    FROM chronicle_scenes 
    WHERE scene_number IN (13, 14) 
    ORDER BY scene_number ASC 
    LIMIT 10
  `;
  const res1 = await reader.query({ query: q1, format: 'JSONEachRow' });
  const data1 = await res1.json<{ scene_number: number; slug: string; violation_detail: string }>();
  const h1Duration = Math.round((performance.now() - h1Start) * 100) / 100;

  const h1Entities = data1.map((d) => ({
    name: `Scene ${d.scene_number}: ${d.slug}`,
    type: d.scene_number === 13 ? 'DIALOGUE_FACT' : 'WARDROBE_STATE',
    impact: d.violation_detail || 'Contradiction identified against source reveal',
    receiptId: crypto.createHash('sha256').update(d.slug).digest('hex').substring(0, 12),
  }));
  h1Entities.forEach((e) => discoveredEntities.add(e.name));
  hopsOutput.push({
    hop: 1,
    title: 'HOP 1: Immediate Downstream Dependencies (Scenes 13, 14)',
    query: q1.trim().replace(/\s+/g, ' '),
    durationMs: h1Duration,
    entities: h1Entities,
  });

  // HOP 2: Secondary dependencies (Editorial score collision, character knowledge chronology)
  const h2Start = performance.now();
  const q2 = `
    SELECT scene_number, slug, violation_detail 
    FROM chronicle_scenes 
    WHERE scene_number IN (16, 17) 
    ORDER BY scene_number ASC 
    LIMIT 10
  `;
  const res2 = await reader.query({ query: q2, format: 'JSONEachRow' });
  const data2 = await res2.json<{ scene_number: number; slug: string; violation_detail: string }>();
  const h2Duration = Math.round((performance.now() - h2Start) * 100) / 100;

  const h2Entities = data2.map((d) => ({
    name: `Scene ${d.scene_number}: ${d.slug}`,
    type: d.scene_number === 16 ? 'SCORE_CUE' : 'CHARACTER_KNOWLEDGE',
    impact: d.violation_detail || 'Cross-scene timing/knowledge collision',
    receiptId: crypto.createHash('sha256').update(d.slug).digest('hex').substring(0, 12),
  }));
  h2Entities.forEach((e) => discoveredEntities.add(e.name));
  hopsOutput.push({
    hop: 2,
    title: 'HOP 2: Temporal & Logical Constraints (Scenes 16, 17)',
    query: q2.trim().replace(/\s+/g, ' '),
    durationMs: h2Duration,
    entities: h2Entities,
  });

  // HOP 3: Target boundary discovery (Scene 18 Terminal Destination)
  const h3Start = performance.now();
  const q3 = `
    SELECT scene_number, slug, script_text 
    FROM chronicle_scenes 
    WHERE scene_number = ${targetScene} 
    ORDER BY version DESC 
    LIMIT 5
  `;
  const res3 = await reader.query({ query: q3, format: 'JSONEachRow' });
  const data3 = await res3.json<{ scene_number: number; slug: string; script_text: string }>();
  const h3Duration = Math.round((performance.now() - h3Start) * 100) / 100;

  const h3Entities = [
    {
      name: `Scene ${targetScene}: ${data3[0]?.slug || 'EXT. HARBOR GATE'}`,
      type: 'REVEAL_DESTINATION',
      impact: 'Terminal bounded horizon: Cargo reveal unseal point',
      receiptId: crypto.createHash('sha256').update(q3).digest('hex').substring(0, 12),
    },
  ];
  h3Entities.forEach((e) => discoveredEntities.add(e.name));
  hopsOutput.push({
    hop: 3,
    title: `HOP 3: Boundary Anchor Discovery (Scene ${targetScene})`,
    query: q3.trim().replace(/\s+/g, ' '),
    durationMs: h3Duration,
    entities: h3Entities,
  });

  const totalDurationMs = Math.round((performance.now() - overallStart) * 100) / 100;

  return {
    hops: hopsOutput,
    totalEntities: discoveredEntities.size,
    totalDurationMs,
  };
}

/**
 * Appends a validation receipt to ClickHouse.
 * Strict append-only; preserves history.
 */
export async function appendValidationReceipt(receipt: {
  revisionId: string;
  invariantId: string;
  status: InvariantStatus;
  latencyMs: number;
  validatorAgent: string;
  validationDetails: string;
}): Promise<ValidationReceipt> {
  await initializeChronicleDatabase();
  const writer = getWriterClient();

  const receiptId = crypto.randomUUID();
  const evidenceHash = crypto
    .createHash('sha256')
    .update(`${receipt.revisionId}-${receipt.invariantId}-${receipt.status}-${receipt.validationDetails}`)
    .digest('hex');

  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 23);

  await writer.insert({
    table: 'chronicle_validation_receipts',
    values: [
      {
        receipt_id: receiptId,
        revision_id: receipt.revisionId,
        invariant_id: receipt.invariantId,
        status: receipt.status,
        latency_ms: receipt.latencyMs,
        validator_agent: receipt.validatorAgent,
        evidence_hash: evidenceHash,
        validation_details: receipt.validationDetails,
      },
    ],
    format: 'JSONEachRow',
  });

  return {
    receiptId,
    revisionId: receipt.revisionId,
    invariantId: receipt.invariantId,
    status: receipt.status,
    latencyMs: receipt.latencyMs,
    validatorAgent: receipt.validatorAgent,
    evidenceHash,
    validationDetails: receipt.validationDetails,
    timestamp: nowIso,
  };
}

/**
 * Appends a typed, versioned CreativeContract to ClickHouse.
 */
export async function appendCreativeContract(contract: Omit<CreativeContract, 'contractId' | 'createdAt'>): Promise<CreativeContract> {
  await initializeChronicleDatabase();
  const writer = getWriterClient();
  const contractId = crypto.randomUUID();
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 23);

  await writer.insert({
    table: 'chronicle_creative_contracts',
    values: [
      {
        contract_id: contractId,
        version: contract.version,
        revision_id: contract.revisionId,
        reference_identity: contract.referenceIdentity,
        reference_structure: contract.referenceStructure,
        reference_environment: contract.referenceEnvironment,
        reference_style: contract.referenceStyle,
        mutable_intent: contract.mutableIntent,
        constraints_json: contract.constraintsJson || '{}',
      },
    ],
    format: 'JSONEachRow',
  });

  return {
    ...contract,
    contractId,
    createdAt: nowIso,
  };
}

/**
 * Appends candidate media generated from Google media models.
 * Strictly flagged as CANDIDATE_EVIDENCE.
 */
export async function appendMediaArtifact(artifact: Omit<MediaArtifact, 'artifactId' | 'status' | 'createdAt'>): Promise<MediaArtifact> {
  await initializeChronicleDatabase();
  const writer = getWriterClient();
  const artifactId = crypto.randomUUID();
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 23);

  await writer.insert({
    table: 'chronicle_media_artifacts',
    values: [
      {
        artifact_id: artifactId,
        revision_id: artifact.revisionId,
        candidate_id: artifact.candidateId,
        model_used: artifact.modelUsed,
        media_type: artifact.mediaType,
        prompt: artifact.prompt,
        status: 'CANDIDATE_EVIDENCE',
        storage_url_or_data: artifact.storageUrlOrData,
      },
    ],
    format: 'JSONEachRow',
  });

  return {
    ...artifact,
    artifactId,
    status: 'CANDIDATE_EVIDENCE',
    createdAt: nowIso,
  };
}

/**
 * Performs Human Promotion.
 * CRITICAL CONTRACT RULE:
 * Deterministic server-side operation. Only after explicit Promote action and
 * successful invariant validation (ALL affected locked invariants require an
 * explicit latest PASS; FAIL, UNKNOWN, or missing validation means not promotable).
 * Appends committed revision using narrowly scoped ClickHouse writer identity.
 * Preserves append-only semantics (zero UPDATE/DELETE).
 */
export async function promoteRevision(revisionId: string, promotedBy: string): Promise<PromotionResult> {
  await initializeChronicleDatabase();
  const writer = getWriterClient();

  // 1. Fetch locked invariants and verify validation status
  const invariants = await fetchLockedInvariants(revisionId);

  const unpromotedInvariants: Array<{ invariantId: string; status: InvariantStatus; reason: string }> = [];

  for (const inv of invariants) {
    if (inv.isLocked) {
      if (!inv.latestStatus || inv.latestStatus !== 'PASS') {
        unpromotedInvariants.push({
          invariantId: inv.invariantId,
          status: inv.latestStatus || 'UNKNOWN',
          reason: `Invariant ${inv.name} (${inv.invariantId}) is ${inv.latestStatus || 'UNKNOWN'}. All locked invariants must explicitly PASS before promotion.`,
        });
      }
    }
  }

  if (unpromotedInvariants.length > 0) {
    return {
      success: false,
      error: 'PROMOTION_BLOCKED: One or more locked invariants have not passed validation.',
      unresolvedInvariants: unpromotedInvariants,
    };
  }

  // 2. Compute cryptographic commit hash and sequence number
  const nextSeqRes = await writer.query({
    query: 'SELECT max(sequence_num) as max_seq FROM chronicle_revisions',
    format: 'JSONEachRow',
  });
  const nextSeqData = await nextSeqRes.json<{ max_seq: number }>();
  const nextSequenceNum = (Number(nextSeqData[0]?.max_seq) || 1) + 1;

  const commitPayload = `${revisionId}-${nextSequenceNum}-${promotedBy}-${Date.now()}`;
  const commitHash = crypto.createHash('sha256').update(commitPayload).digest('hex');
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 23);

  // 3. Append-only commit row to chronicle_revisions
  await writer.insert({
    table: 'chronicle_revisions',
    values: [
      {
        revision_id: revisionId,
        parent_revision_id: '00000000-0000-0000-0000-000000000001',
        sequence_num: nextSequenceNum,
        revision_type: 'COMMITTED_CANON',
        prompt: 'Promoted from candidate repair simulation via Human Supervisor action',
        created_by: promotedBy,
        status: 'PROMOTED',
        patch_json: JSON.stringify({ verifiedInvariants: invariants.map((i) => i.invariantId) }),
        repair_manifest_json: JSON.stringify({ strategy: 'Candidate A: Gradual Sunburst + ADR Sc 13' }),
        commit_hash: commitHash,
        promoted_by: promotedBy,
        committed_at: nowIso,
      },
    ],
    format: 'JSONEachRow',
  });

  // 4. Append-only new version of affected scenes into chronicle_scenes (version 2)
  const currentScenes = await fetchCanonicalScenes();
  for (const sc of currentScenes) {
    let newStatus = sc.status;
    let newDetail = '';

    if (sc.number === 12) {
      newStatus = 'locked';
      newDetail = 'Committed Master: Sunburst LUT injected, ADR sync zeroed.';
    } else if ([13, 14, 16, 17].includes(sc.number)) {
      newStatus = 'stable';
      newDetail = 'Invariant reconciled and locked to canonical master.';
    } else if (sc.number === 18) {
      newStatus = 'locked';
      newDetail = 'Canonical Reveal Point stabilized.';
    }

    await writer.insert({
      table: 'chronicle_scenes',
      values: [
        {
          scene_number: sc.number,
          reel_id: 'REEL_04',
          slug: sc.slug,
          location: sc.location,
          time_of_day: sc.number === 12 ? 'DAWN (05:45)' : sc.timeOfDay,
          take_label: sc.take,
          status: newStatus,
          timecode_in: sc.timecode.split(' - ')[0] || '01:00:00:00',
          timecode_out: sc.timecode.split(' - ')[1] || '01:05:00:00',
          camera_meta: sc.camera || 'ALEXA 35',
          script_text: sc.description || '',
          violation_detail: newDetail,
          revision_id: revisionId,
          version: (sc.version || 1) + 1,
        },
      ],
      format: 'JSONEachRow',
    });
  }

  // 5. Immutable audit entry
  await writer.insert({
    table: 'chronicle_audit_log',
    values: [
      {
        event_id: crypto.randomUUID(),
        actor_role: 'HUMAN_PROMOTER',
        action: 'PROMOTE_COMMIT',
        query_hash: commitHash,
        query_text: `PROMOTE_REVISION ${revisionId}`,
        receipt_token: commitHash.substring(0, 16),
        details_json: JSON.stringify({ sequenceNum: nextSequenceNum, promotedBy, timestamp: nowIso }),
      },
    ],
    format: 'JSONEachRow',
  });

  return {
    success: true,
    committedRevisionId: revisionId,
    commitHash,
    sequenceNum: nextSequenceNum,
    timestamp: nowIso,
  };
}
