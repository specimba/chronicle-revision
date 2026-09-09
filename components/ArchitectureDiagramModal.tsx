'use client';

import React, { useState } from 'react';

interface ArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHop?: (hop: number) => void;
}

export default function ArchitectureDiagramModal({
  isOpen,
  onClose,
  onSelectHop,
}: ArchitectureDiagramModalProps) {
  const [activeStep, setActiveStep] = useState<number>(3); // default showing Ripple Analysis

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111316] border border-[#262a32] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
              account_tree
            </span>
            <div>
              <h3 className="font-['Inter'] font-bold text-[13px] text-[#e2e2e6] tracking-wide">
                AUTHORITY ARCHITECTURE &amp; BOUNDED 3-HOP RIPPLE SOLVER
              </h3>
              <p className="font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
                DIRECTOR ➔ GEMINI / ADK ➔ MCP-CLICKHOUSE ➔ 3-HOP BFS ➔ REPAIR MANIFEST
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#262a32] text-[#9ca3af] hover:text-[#e2e2e6] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-['JetBrains_Mono'] text-xs">
          {/* Complete Pipeline Flow Diagram */}
          <div className="bg-[#0c0e11] border border-[#262a32] rounded-md p-4">
            <div className="text-[#38bdf8] text-[11px] font-bold uppercase mb-3 flex items-center justify-between">
              <span>CANONICAL SPECIFICATION FLOW</span>
              <span className="text-[#9ca3af] font-normal text-[10px]">
                Deterministic ClickHouse Ledger Integrity
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-[11px]">
              {/* Step 1 */}
              <div
                onClick={() => setActiveStep(1)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  activeStep === 1
                    ? 'bg-[#1e2128] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-[#16181d] border-[#262a32] hover:border-[#4b5563]'
                }`}
              >
                <div className="text-amber-400 font-bold mb-1">01. DIRECTOR</div>
                <div className="text-[#e2e2e6] text-[10px]">Natural Language Intent</div>
                <div className="text-[#9ca3af] text-[9px] mt-1 italic">&quot;Cut dawn instead of storm&quot;</div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => setActiveStep(2)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  activeStep === 2
                    ? 'bg-[#1e2128] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-[#16181d] border-[#262a32] hover:border-[#4b5563]'
                }`}
              >
                <div className="text-[#38bdf8] font-bold mb-1">02. GEMINI / ADK</div>
                <div className="text-[#e2e2e6] text-[10px]">Parses RevisionPatch</div>
                <div className="text-[#9ca3af] text-[9px] mt-1">Structured Invariants &amp; Deltas</div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => setActiveStep(3)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  activeStep === 3
                    ? 'bg-[#1e2128] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-[#16181d] border-[#262a32] hover:border-[#4b5563]'
                }`}
              >
                <div className="text-purple-400 font-bold mb-1">03. MCP-CLICKHOUSE</div>
                <div className="text-[#e2e2e6] text-[10px]">READ ONLY Ledger</div>
                <div className="text-[#9ca3af] text-[9px] mt-1">Facts + Dependency Graph</div>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => setActiveStep(4)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  activeStep === 4
                    ? 'bg-[#1e2128] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-[#16181d] border-[#262a32] hover:border-[#4b5563]'
                }`}
              >
                <div className="text-rose-400 font-bold mb-1">04. 3-HOP RIPPLE</div>
                <div className="text-[#e2e2e6] text-[10px]">Bounded BFS Solver</div>
                <div className="text-[#9ca3af] text-[9px] mt-1">H0 ➔ H1 ➔ H2 ➔ H3 Stop</div>
              </div>

              {/* Step 5 */}
              <div
                onClick={() => setActiveStep(5)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  activeStep === 5
                    ? 'bg-[#1e2128] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10'
                    : 'bg-[#16181d] border-[#262a32] hover:border-[#4b5563]'
                }`}
              >
                <div className="text-emerald-400 font-bold mb-1">05. HUMAN PROMOTE</div>
                <div className="text-[#e2e2e6] text-[10px]">Deterministic Writer</div>
                <div className="text-[#9ca3af] text-[9px] mt-1">Append-Only ClickHouse INSERT</div>
              </div>
            </div>
          </div>

          {/* Detailed Bounded 3-Hop Traversal Spec */}
          <div className="bg-[#0c0e11] border border-[#262a32] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#e2e2e6] text-[11px] font-bold uppercase">
                BOUNDED 3-HOP BREADTH-FIRST SEARCH (BFS) TRAVERSAL
              </span>
              <span className="text-amber-400 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Rule: No complex graph SQL · ADK bounded client traversal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Hop 0 */}
              <div className="p-3 rounded bg-[#16181d] border border-amber-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-400 font-bold">HOP 0</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">ORIGIN</span>
                </div>
                <div className="text-[#e2e2e6] font-semibold text-[11px]">Changed Production Facts</div>
                <p className="text-[#9ca3af] text-[10px] mt-1">
                  Direct delta in Scene 12: Weather changes from Night Deluge to Sunrise Dawn.
                  Envelope intact.
                </p>
                <div className="mt-2 text-[9px] text-[#4b5563]">1 ENTITY ALTERED</div>
              </div>

              {/* Hop 1 */}
              <div className="p-3 rounded bg-[#16181d] border border-rose-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-rose-400 font-bold">HOP 1</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">DIRECT</span>
                </div>
                <div className="text-[#e2e2e6] font-semibold text-[11px]">Direct Dependents</div>
                <p className="text-[#9ca3af] text-[10px] mt-1">
                  Scene 13 (Maya dialogue fact re ferry anchor) &amp; Scene 14 (Wardrobe trench coat wetness ratio).
                </p>
                <div className="mt-2 text-[9px] text-[#4b5563]">2 ENTITIES RUPTURED</div>
              </div>

              {/* Hop 2 */}
              <div className="p-3 rounded bg-[#16181d] border border-rose-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-rose-400 font-bold">HOP 2</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">SECOND-ORDER</span>
                </div>
                <div className="text-[#e2e2e6] font-semibold text-[11px]">Dependents of Dependents</div>
                <p className="text-[#9ca3af] text-[10px] mt-1">
                  Scene 16 (Score Cue 3M04 collision with vehicle silence) &amp; Scene 17 (Character knowledge order).
                </p>
                <div className="mt-2 text-[9px] text-[#4b5563]">2 ENTITIES RUPTURED</div>
              </div>

              {/* Hop 3 */}
              <div className="p-3 rounded bg-[#16181d] border border-emerald-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-bold">HOP 3</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">BOUNDARY</span>
                </div>
                <div className="text-[#e2e2e6] font-semibold text-[11px]">Final Expansion &amp; Dedupe</div>
                <p className="text-[#9ca3af] text-[10px] mt-1">
                  Scene 18 (Turnstile envelope unseal &amp; cue destination). Traversal terminates deterministically.
                </p>
                <div className="mt-2 text-[9px] text-emerald-400">DEDUPE &amp; STOP (HALTED)</div>
              </div>
            </div>
          </div>

          {/* ASCII Diagram representation from the prompt */}
          <div className="bg-[#08090c] border border-[#262a32] rounded p-3 text-[10.5px] leading-tight text-[#9ca3af] font-mono overflow-x-auto">
            <pre className="text-sky-300 font-mono">
{`                    DIRECTOR
                       │
              requests revision
                       │
                       ▼
               GEMINI / ADK
            parses RevisionPatch
                       │
                       ▼
                mcp-clickhouse
                  READ ONLY
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
 current production facts    dependency graph
          │                         │
          └────────────┬────────────┘
                       ▼
                RIPPLE ANALYSIS
                 bounded 3 hops
                       │
                       ▼
                 RepairManifest
                       │
              human / gate review
                       │
                       ▼
                HUMAN PROMOTION
             (Deterministic Route)
                       │
                       ▼
              APPEND-ONLY INSERT
             (Direct Writer Path)
                       │
                       ▼
              REVISION COMMITTED`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 px-4 bg-[#16181d] border-t border-[#262a32] flex items-center justify-between shrink-0 font-['JetBrains_Mono'] text-[11px]">
          <span className="text-[#9ca3af]">
            CONTINUITY ENGINE: <strong className="text-[#e2e2e6]">CLICKHOUSE CLOUD + GEMINI 3.8 FLASH (GOOGLE ADK)</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded text-xs transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
