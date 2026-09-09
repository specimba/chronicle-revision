'use client';

import React, { useState } from 'react';

interface AuditJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditJsonModal({ isOpen, onClose }: AuditJsonModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const auditData = {
    canonical_commit_hash: '7f8a92d4cb0912f8832a874b3389ac6210f92',
    timestamp: '2024-10-28T06:14:02.812Z',
    reel_id: 'REEL_04',
    director: 'J. Austin',
    vfx_supervisor: 'T. Linn',
    clickhouse_database: 'prod_continuity_ledger',
    clickhouse_table: 'canonical_production_facts',
    revision_patch: {
      patch_id: 'REV-04-DAWN-3.2',
      prompt_intent: 'Scene 12 ferry pier dawn transition instead of night downpour',
      scope: 'REEL_04_SC_12_TO_18',
      invariants_preserved: [
        'INVARIANT_01_ENVELOPE_SEALED_UNTIL_SC18',
        'INVARIANT_02_MAYA_UNAWARE_OF_MANIFEST_PRIOR_TO_SC18',
      ],
      bounded_ripple_bfs: {
        max_depth: 3,
        hop_0: {
          scene: 'SC_12',
          facts_altered: ['weather: sunrise_amber_fog', 'lighting: 4500K_dawn', 'costume: dry_matte_wool'],
        },
        hop_1: {
          scene: 'SC_13',
          dependents: ['dialogue_fact: ferry_held_past_dawn', 'phoneme_match: 99.2%'],
          scene_14: ['costume_moisture_level: dry_timber_specular_clamped'],
        },
        hop_2: {
          scene: 'SC_16',
          dependents: ['score_cue_3m04_detached_from_vehicle'],
          scene_17: ['chronology_knowledge_order_trimmed'],
        },
        hop_3: {
          scene: 'SC_18',
          dependents: ['score_cue_3m04_reanchored_frame_18344', 'envelope_wax_broken'],
          status: 'DEDUPLICATED_AND_HALTED',
        },
      },
    },
    repair_manifest: [
      { id: '#13-ADR', asset: 'ADR_L4_v2_MIXED.wav', sha256: 'a93f7e1b4...pass' },
      { id: '#14-VFX', asset: 'EXR_CMP_S14_DRY_v6', sha256: 'c82b017f8...pass' },
      { id: '#16-CUE', asset: 'SCORE_3M04_S18_ANCHOR.wav', sha256: '44b17e89a...pass' },
      { id: '#17-LGC', asset: 'SCRIPT_REV_V4.2.pdf', sha256: 'd198bb4e1...pass' },
    ],
    telemetry: {
      budget_delta_usd: 4200,
      schedule_slip_days: 0,
      narrative_fidelity_pct: 98.4,
      clickhouse_write_latency_ms: 3.4,
    },
  };

  const jsonString = JSON.stringify(auditData, null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111316] border border-[#262a32] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-11 px-4 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0 font-['Inter']">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">
              receipt_long
            </span>
            <span className="font-bold text-[13px] text-[#e2e2e6] tracking-wide">
              COMPLETE CONTINUITY AUDIT RECEIPT (JSON)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#262a32] text-[#9ca3af] hover:text-[#e2e2e6] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto bg-[#0a0c0f]">
          <pre className="font-['JetBrains_Mono'] text-[11px] text-[#38bdf8] whitespace-pre leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="h-11 px-4 bg-[#16181d] border-t border-[#262a32] flex items-center justify-between shrink-0 font-['JetBrains_Mono'] text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 bg-[#1e2128] hover:bg-[#262a32] text-[#38bdf8] border border-[#38bdf8]/40 rounded flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON TO CLIPBOARD'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
