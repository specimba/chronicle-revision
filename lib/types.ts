export type WorkstationView =
  | 'production'
  | 'simulation'
  | 'committed'
  | 'architecture'
  | 'drive'
  | 'gemini_studio';

export interface SceneItem {
  id: string;
  number: number;
  slug: string;
  location: string;
  timeOfDay: string;
  take: string;
  status: 'locked' | 'candidate' | 'active_sim' | 'violation' | 'target' | 'clean' | 'stable';
  statusLabel: string;
  timecode: string;
  thumbnail?: string;
  description?: string;
  violationDetail?: string;
  camera?: string;
  version?: number;
  scriptText?: string;
}

export interface CandidateRepair {
  id: 'A' | 'B' | 'C' | 'D';
  name: string;
  subtitle: string;
  description: string;
  timeHours: number;
  costEst: string;
  status: string;
  active: boolean;
  departmentChanges?: {
    department: string;
    action: string;
    affectedAsset: string;
  }[];
  mediaArtifactId?: string;
}

export interface RuptureItem {
  id: number;
  title: string;
  department: string;
  description: string;
  metric: string;
  status: 'COMMITTED' | 'SOLVING' | 'PENDING' | 'VIOLATION' | 'PASS' | 'FAIL' | 'UNKNOWN';
  code: string;
  ruleExpression?: string;
  invariantId?: string;
  validationReceipt?: ValidationReceipt;
}

export interface AuditReceipt {
  id: string;
  title: string;
  department: string;
  description: string;
  asset: string;
  badge: string;
  status: 'RESOLVED' | 'PENDING';
  commitHash?: string;
  timestamp?: string;
}

export interface HopStep {
  hop: number;
  title: string;
  query: string;
  durationMs: number;
  entities: {
    name: string;
    type: string;
    impact: string;
    receiptId?: string;
  }[];
}

// -------------------------------------------------------------
// Chronicle Strict Production System Contracts
// -------------------------------------------------------------

export type InvariantStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface LockedInvariant {
  invariantId: string;
  name: string;
  sceneNumber: number;
  department: 'SCRIPT' | 'WARDROBE' | 'EDITORIAL' | 'DIRECTORIAL' | 'VFX' | 'LAB';
  ruleExpression: string;
  severity: 'CRITICAL' | 'WARNING';
  isLocked: boolean;
  version: number;
  latestStatus?: InvariantStatus;
  latestReceipt?: ValidationReceipt;
}

export interface ValidationReceipt {
  receiptId: string;
  revisionId: string;
  invariantId: string;
  status: InvariantStatus;
  latencyMs: number;
  validatorAgent: string;
  evidenceHash: string;
  validationDetails: string;
  timestamp: string;
}

export interface CreativeContract {
  contractId: string;
  version: number;
  revisionId: string;
  // Immutable / reference constraints
  referenceIdentity: string;
  referenceStructure: string;
  referenceEnvironment: string;
  referenceStyle: string;
  // Requested mutable modifications
  mutableIntent: string;
  constraintsJson?: string;
  createdAt: string;
}

export interface RevisionPatch {
  patchId: string;
  sourceScene: number;
  targetScene: number;
  summary: string;
  directorPrompt: string;
  affectedDepartments: string[];
  rupturesIdentified: number;
  continuityModifications: {
    target: string;
    currentFact: string;
    proposedFact: string;
    department: string;
  }[];
}

export interface RepairManifest {
  manifestId: string;
  revisionId: string;
  recommendedCandidate: 'A' | 'B' | 'C' | 'D';
  candidates: CandidateRepair[];
  invariantsImpacted: string[];
  estimatedTotalHours: number;
}

export type ClickHouseHealthStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'QUERY_FAILED';

export interface ClickHouseHealth {
  status: ClickHouseHealthStatus;
  version?: string;
  host: string;
  database?: string;
  latencyMs: number;
  totalScenes: number;
  totalRevisions: number;
  totalReceipts: number;
  isReadOnlyReaderReady: boolean;
  isScopedWriterReady: boolean;
  error?: string;
}

export interface MediaArtifact {
  artifactId: string;
  revisionId: string;
  candidateId: string;
  modelUsed: string;
  mediaType: 'IMAGE' | 'VIDEO_PREVIEW' | 'AUDIO_CUE';
  prompt: string;
  status: 'CANDIDATE_EVIDENCE';
  storageUrlOrData: string;
  createdAt: string;
}

export interface PromotionResult {
  success: boolean;
  committedRevisionId?: string;
  commitHash?: string;
  sequenceNum?: number;
  timestamp?: string;
  error?: string;
  unresolvedInvariants?: {
    invariantId: string;
    status: InvariantStatus;
    reason: string;
  }[];
}

export interface ActiveRevisionState {
  revisionId: string;
  runtimeState?: ChronicleRuntimeState;
  modelUsed?: string;
  modelLatencyMs?: number;
  revisionPatch?: RevisionPatch;
  creativeContract?: CreativeContract;
  repairManifest?: RepairManifest;
  invariantEvaluations?: Array<{
    invariantId: string;
    status: 'PASS' | 'FAIL' | 'UNKNOWN';
    validationDetails: string;
  }>;
  boundedHops?: unknown;
  invariants?: LockedInvariant[];
  mcpReceipts?: Array<{
    toolName: string;
    queryHash?: string;
    durationMs: number;
    status: string;
    timestamp: string;
  }>;
  clickhouseSynced?: boolean;
  timestamp?: string;
}

export type ChronicleRuntimeState =
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE'
  | 'CONNECTING'
  | 'QUERYING'
  | 'QUERY_FAILED'
  | 'CONNECTED'
  | 'VALIDATION_UNKNOWN'
  | 'VALIDATION_FAILED'
  | 'READY_TO_PROMOTE'
  | 'COMMITTED';

export type McpServerStatus = 'NOT_CONFIGURED' | 'CONNECTED' | 'UNAVAILABLE' | 'QUERY_FAILED';

export interface McpDiagnostics {
  status: McpServerStatus;
  serverUrlHostOnly: string;
  implementation: 'official mcp-clickhouse';
  protocolConnection: 'StreamableHTTP' | 'NONE';
  toolsDiscovered: string[];
  lastQueryStatus: 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'QUERY_FAILED' | 'NOT_CONFIGURED';
  lastQueryHash?: string;
  error?: string;
}

export interface RuntimeDiagnostics {
  webApp: {
    status: 'HEALTHY' | 'DEGRADED';
    timestamp: string;
  };
  gemini: {
    status: 'CONFIGURED' | 'NOT_CONFIGURED';
    model: string;
    error?: string;
  };
  googleAdk: {
    status: 'READY' | 'UNAVAILABLE';
    implementation: '@google/adk';
    version: string;
  };
  mcp: McpDiagnostics;
  clickhouse: ClickHouseHealth;
  writer: {
    status: 'READY' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
    host: string;
    userConfigured: boolean;
    appendOnlyGuaranteed: boolean;
    error?: string;
  };
  timestamp: string;
}

