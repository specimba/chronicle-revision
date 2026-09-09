'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CandidateRepair, LockedInvariant, ClickHouseHealth, CreativeContract, RevisionPatch, RepairManifest } from '@/lib/types';

interface ActiveSimulationViewProps {
  onPromoteRepair: (promotedBy?: string) => Promise<{ success: boolean; error?: string } | void> | void;
  onAbortSimulation: () => void;
  onOpenScopes: () => void;
  activeRevision?: {
    revisionId: string;
    revisionPatch?: RevisionPatch;
    creativeContract?: CreativeContract;
    repairManifest?: RepairManifest;
    invariantEvaluations?: Array<{
      invariantId: string;
      status: 'PASS' | 'FAIL' | 'UNKNOWN';
      validationDetails: string;
    }>;
    boundedHops?: unknown;
  } | null;
  invariants?: LockedInvariant[];
  health?: ClickHouseHealth | null;
  isPromoting?: boolean;
  promotionError?: string | null;
}

export default function ActiveSimulationView({
  onPromoteRepair,
  onAbortSimulation,
  onOpenScopes,
  activeRevision,
  invariants: propInvariants,
  health,
  isPromoting: externalIsPromoting,
  promotionError,
}: ActiveSimulationViewProps) {
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [viewportMode, setViewportMode] = useState<'wipe' | 'diff' | 'flicker'>('wipe');
  const [flickerState, setFlickerState] = useState<boolean>(false);
  const [activeCandidate, setActiveCandidate] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [isPromotingInternal, setIsPromotingInternal] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [convergencePercent, setConvergencePercent] = useState<number>(82);
  const [activeIteration, setActiveIteration] = useState<number>(418);
  const [sunVectorSolved, setSunVectorSolved] = useState<boolean>(false);
  const [mediaGenerating, setMediaGenerating] = useState<string | null>(null);
  const [mediaResult, setMediaResult] = useState<{ type: string; model: string; note: string } | null>(null);

  const isPromoting = externalIsPromoting || isPromotingInternal;

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Flicker mode interval
  useEffect(() => {
    if (viewportMode !== 'flicker') return;
    const interval = setInterval(() => {
      setFlickerState((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, [viewportMode]);

  // Simulated convergence resolution tick
  useEffect(() => {
    const timer = setTimeout(() => {
      setConvergencePercent(96);
      setActiveIteration(439);
      setSunVectorSolved(true);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  // Wipe drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateWipePos(e.clientX);
  };

  const updateWipePos = (clientX: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((clampedX / rect.width) * 100);
    setSplitPercent(percent);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateWipePos(e.clientX);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Promote action handler
  const handleConfirmPromote = async () => {
    setIsPromotingInternal(true);
    try {
      await onPromoteRepair('DIRECTOR_AND_LEAD_SUPERVISOR');
    } finally {
      setIsPromotingInternal(false);
    }
  };

  // Real candidate generation via /api/chronicle/media
  const handleGenerateCandidateMedia = async (kind: 'image' | 'video' | 'audio') => {
    setMediaGenerating(kind);
    setMediaResult(null);
    try {
      const res = await fetch('/api/chronicle/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: kind,
          prompt:
            kind === 'image'
              ? 'Photorealistic film still, Maya on wet harbor slipway at dawn, morning light catching wool trench coat, 35mm anamorphic'
              : kind === 'video'
              ? 'Cinematic camera pan across harbor pier head as dawn light breaks through storm clouds'
              : 'Subtle dawn sunrise orchestral brass swell and quiet harbor wind ambience',
          sceneNumber: 12,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMediaResult({
          type: data.receipt.mediaType,
          model: data.receipt.modelUsed,
          note: data.receipt.statusNote,
        });
      } else {
        setMediaResult({
          type: kind,
          model: 'FAILED',
          note: data.error || 'Media generation failed or was rejected.',
        });
      }
    } catch (err: any) {
      setMediaResult({
        type: kind,
        model: 'ERROR',
        note: err.message || 'Media network call failed.',
      });
    } finally {
      setMediaGenerating(null);
    }
  };

  // Dynamic candidates from repair manifest if available
  const defaultCandidates: CandidateRepair[] = [
    {
      id: 'A',
      name: 'Gradual Sunburst + ADR Sc 13',
      subtitle: 'Candidate A',
      description:
        'Optical matte rain erase, ACEScc dawn LUT injection, ADR speech patch with 0ms cue collision.',
      timeHours: 3.5,
      costEst: '$1.2K',
      status: 'ACTIVE IN SIM',
      active: activeCandidate === 'A',
    },
    {
      id: 'B',
      name: 'Dry Coat Swap + CGI Moisture Wipe',
      subtitle: 'Candidate B',
      description:
        'Neural fabric re-texture on Maya trench coat. Retains night ambient audio; drops ADR change.',
      timeHours: 18.0,
      costEst: '$4.8K',
      status: 'CANDIDATE',
      active: activeCandidate === 'B',
    },
    {
      id: 'C',
      name: 'Unit B Pickups + Full Cue Shift',
      subtitle: 'Candidate C',
      description:
        'Dispatch 2-person splinter unit to location during real sunrise. High realism, heavy delay.',
      timeHours: 48.0,
      costEst: '$16.5K',
      status: 'CANDIDATE',
      active: activeCandidate === 'C',
    },
    {
      id: 'D',
      name: 'Surveillance Cut-in Bridge',
      subtitle: 'Candidate D',
      description:
        'Insert 1.8s degraded CCTV shot of harbor clock tower to mask cut and bypass grading work.',
      timeHours: 6.0,
      costEst: '$800',
      status: 'CANDIDATE',
      active: activeCandidate === 'D',
    },
  ];

  const manifestCandidates = activeRevision?.repairManifest?.candidates;
  const candidates: CandidateRepair[] = (manifestCandidates && manifestCandidates.length > 0)
    ? manifestCandidates.map((c) => ({
        ...c,
        active: activeCandidate === c.id,
      }))
    : defaultCandidates;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0c0e11] overflow-hidden select-none">
      {/* SECONDARY SUB-BAR: ACTIVE SIMULATION HUD */}
      <section className="h-8 bg-[#16181d] px-3 flex items-center justify-between shrink-0 border-b border-[#262a32] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
            <span className="font-['Inter'] text-[11px] font-bold text-[#38bdf8] tracking-wider uppercase">
              ACTIVE SIMULATION
            </span>
          </div>
          <span className="text-[#262a32]">/</span>
          <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px]">
            <span className="text-[#e2e2e6] font-semibold">REEL 04 · SCENE 12 ➔ 15 BRIDGE</span>
            <span className="text-[#4b5563]">|</span>
            <span className="text-[#9ca3af]">BRANCH:</span>
            <span className="bg-[#1e2128] px-1.5 py-0.5 rounded text-[#38bdf8] font-semibold border border-[#38bdf8]/30">
              CANDIDATE-{activeCandidate} {'//'} SUNBURST-ADR-PATCH
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
          <div className="hidden sm:flex items-center gap-2 bg-[#1e2128] px-2 py-0.5 rounded border border-[#262a32] text-[#9ca3af]">
            <span>
              WIPE ANGLE: <strong className="text-[#e2e2e6]">90.0°</strong>
            </span>
            <span className="text-[#4b5563]">|</span>
            <span>
              DIFF DENSITY: <strong className="text-amber-400">38.4%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-['JetBrains_Mono'] font-semibold">
            <span className="material-symbols-outlined text-[12px]">filter_vintage</span>
            <span>ACEScc DAWN-LUT #04A</span>
          </div>

          <button
            type="button"
            onClick={onOpenScopes}
            className="px-2 py-0.5 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded text-[11px] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">query_stats</span>
            <span>SCOPES: D65</span>
          </button>
        </div>
      </section>

      {/* BODY WORKSPACE: 3 COLUMNS */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0c0e11]">
        {/* COLUMN 1: SCENE SEQUENCE & CONTINUITY SCRIPT DIFF (320px) */}
        <section className="w-80 bg-[#111316] border-r border-[#262a32] flex flex-col shrink-0 min-h-0 overflow-hidden">
          {/* Reel 04 Scene Strip */}
          <div className="h-8 px-3 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 font-['Inter'] text-[11px] font-bold text-[#e2e2e6] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">view_timeline</span>
              <span>REEL 04 SCENE SEQUENCE</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">SCENES 10 - 18</span>
          </div>

          <div className="p-2 border-b border-[#262a32] bg-[#0c0e11]/80 overflow-y-auto max-h-44 shrink-0 space-y-1">
            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/60 border border-[#262a32]/60 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-[#9ca3af]">SC 10</span>
                <span className="text-[#e2e2e6] font-medium">Pier Approach</span>
              </div>
              <span className="px-1.5 py-0.2 bg-[#262a32] text-[#9ca3af] rounded text-[9px] font-['JetBrains_Mono']">
                CLEAN
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/60 border border-[#262a32]/60 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-[#9ca3af]">SC 11</span>
                <span className="text-[#e2e2e6] font-medium">Lighthouse Flash</span>
              </div>
              <span className="px-1.5 py-0.2 bg-[#262a32] text-amber-400 rounded text-[9px] font-['JetBrains_Mono'] font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">lock</span> LOCKED
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/50 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-[#38bdf8] font-bold">SC 12</span>
                <span className="text-[#38bdf8] font-bold">Pierhead Stand (SIM)</span>
              </div>
              <span className="px-1.5 py-0.2 bg-[#38bdf8] text-[#00283b] rounded text-[9px] font-['JetBrains_Mono'] font-bold animate-pulse">
                ACTIVE SIM
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/40 border border-rose-500/30 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-rose-400 font-medium">SC 13</span>
                <span className="text-[#9ca3af] truncate max-w-[120px]">Maya Ticket Booth</span>
              </div>
              <span className="px-1.5 py-0.2 bg-rose-500/15 text-rose-400 rounded text-[9px] font-['JetBrains_Mono']">
                VIOLATION: DIALOGUE FACT
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/40 border border-rose-500/30 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-rose-400 font-medium">SC 14</span>
                <span className="text-[#9ca3af] truncate max-w-[120px]">Pier Ramp Descents</span>
              </div>
              <span className="px-1.5 py-0.2 bg-rose-500/15 text-rose-400 rounded text-[9px] font-['JetBrains_Mono']">
                VIOLATION: COSTUME STATE
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/40 border border-rose-500/30 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-rose-400 font-medium">SC 16</span>
                <span className="text-[#9ca3af] truncate max-w-[120px]">Ferry Dock Slip</span>
              </div>
              <span className="px-1.5 py-0.2 bg-rose-500/15 text-rose-400 rounded text-[9px] font-['JetBrains_Mono']">
                VIOLATION: MOTIF TIMING
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/40 border border-rose-500/30 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-rose-400 font-medium">SC 17</span>
                <span className="text-[#9ca3af] truncate max-w-[120px]">Wheelhouse Radio</span>
              </div>
              <span className="px-1.5 py-0.2 bg-rose-500/15 text-rose-400 rounded text-[9px] font-['JetBrains_Mono']">
                VIOLATION: KNOWLEDGE
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#16181d]/60 border border-amber-500/40 text-[11px]">
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
                <span className="text-amber-400 font-bold">SC 18</span>
                <span className="text-[#e2e2e6] font-medium">Harbor Morning Gate</span>
              </div>
              <span className="px-1.5 py-0.2 bg-amber-500/15 text-amber-400 rounded text-[9px] font-['JetBrains_Mono'] font-bold">
                TARGET: REVEAL POINT
              </span>
            </div>
          </div>

          {/* Script Supervisor Diff Header */}
          <div className="h-8 px-3 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 font-['Inter'] text-[11px] font-bold text-[#e2e2e6] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-amber-400">menu_book</span>
              <span>CONTINUITY SCRIPT DIFF</span>
            </div>
            <span className="text-[#38bdf8] font-['JetBrains_Mono'] text-[10px] font-bold">
              P. 42 ➔ P. 42-A
            </span>
          </div>

          {/* Script Diff Content */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 bg-[#0c0e11] font-['Newsreader'] text-[13px] leading-relaxed">
            {/* Original Goldenrod Version */}
            <div className="bg-[#16181d] border border-[#262a32] rounded p-2.5 relative">
              <div className="flex items-center justify-between border-b border-[#262a32] pb-1 mb-1.5 font-['JetBrains_Mono'] text-[10px]">
                <span className="text-amber-400 font-semibold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  GOLDENROD BASELINE [TAKE 04]
                </span>
                <span className="text-[#4b5563]">REEL 04 - SC 12</span>
              </div>
              <p className="font-bold text-[12px] text-[#e2e2e6] tracking-wide uppercase font-['Inter']">
                EXT. PIERHEAD - NIGHT - CONTINUOUS
              </p>
              <p className="text-[#9ca3af] text-[12.5px] mt-1 italic">
                Torrential rain hammers the cedar timber planks. Maya&apos;s heavy crimson trench coat
                is drenched dark black-red, dripping salt spray under cold sodium lamps.
              </p>
              <div className="mt-2 text-center">
                <span className="font-['Inter'] font-bold text-[11px] tracking-widest text-[#e2e2e6] uppercase">
                  MAYA
                </span>
                <p className="text-[11px] text-[#4b5563] italic">(shouting over gale winds)</p>
                <div className="bg-red-950/40 border border-red-500/30 text-rose-300 p-1.5 rounded mt-0.5 line-through font-['JetBrains_Mono'] text-[11px]">
                  &quot;The ferry slipped anchor at midnight! We lost the harbor log!&quot;
                </div>
              </div>
            </div>

            {/* Revised Cherry Version */}
            <div className="bg-[#16181d] border border-[#38bdf8]/40 rounded p-2.5 shadow-sm relative">
              <div className="flex items-center justify-between border-b border-[#38bdf8]/30 pb-1 mb-1.5 font-['JetBrains_Mono'] text-[10px]">
                <span className="text-[#38bdf8] font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                  CHERRY PATCH V3.2 [PROPOSED]
                </span>
                <span className="bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded font-semibold text-[9px]">
                  ADR PATCH
                </span>
              </div>
              <p className="font-bold text-[12px] text-[#38bdf8] tracking-wide uppercase font-['Inter']">
                EXT. PIERHEAD - DAWN BREAK - SUNRISE
              </p>
              <p className="text-[#e2e2e6] text-[12.5px] mt-1">
                Offshore squall clears into a quiet amber sunrise. Maya&apos;s lapel is dry matte
                wool, wind catching gentle warm light over dry cedar planks.
              </p>
              <div className="mt-2 text-center">
                <span className="font-['Inter'] font-bold text-[11px] tracking-widest text-[#38bdf8] uppercase">
                  MAYA
                </span>
                <p className="text-[11px] text-[#9ca3af] italic">(intimate, calm tone)</p>
                <div className="bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#e2e2e6] p-1.5 rounded mt-0.5 font-['JetBrains_Mono'] text-[11.5px] text-[#38bdf8]">
                  &quot;The ferry held past dawn. It&apos;s waiting beyond the sandbar.&quot;
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-[#262a32] flex items-center justify-between font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
                <span>
                  CUE: <strong className="text-[#e2e2e6]">#TK-13-ADR-04</strong>
                </span>
                <span className="text-amber-400 font-semibold">PHONEME MATCH: 99.2%</span>
              </div>
            </div>
          </div>

          {/* Script Diff Footer */}
          <div className="h-7 px-3 bg-[#16181d] border-t border-[#262a32] flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#9ca3af] shrink-0">
            <span className="text-amber-400">ORIGINAL CUE: 00:12:44:00</span>
            <span className="text-[#38bdf8]">DELTA: 0.00s SLIP</span>
          </div>
        </section>

        {/* COLUMN 2: CENTER DOMINANT VIEWPORT (45-55% SCREEN AREA) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0c0e11] overflow-hidden border-r border-[#262a32]">
          {/* Viewport Toolbar */}
          <div className="h-8 px-3 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
              <span className="bg-[#262a32] px-1.5 py-0.5 rounded text-[#e2e2e6] font-bold">
                VIEWPORT A/B
              </span>
              <span className="text-[#4b5563]">|</span>
              <span className="text-[#9ca3af]">REC.709 SIM / DCI-P3 REF</span>
              <span className="text-[#4b5563]">|</span>
              <span className="text-amber-400 font-semibold text-[10px]">
                SPLIT {splitPercent}%
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewportMode('wipe')}
                className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                  viewportMode === 'wipe'
                    ? 'bg-[#1e2128] text-[#38bdf8] border border-[#38bdf8]/40'
                    : 'text-[#9ca3af] hover:bg-[#1e2128]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">splitscreen</span> WIPE
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('diff')}
                className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] flex items-center gap-1 transition-colors ${
                  viewportMode === 'diff'
                    ? 'bg-[#1e2128] text-[#38bdf8] border border-[#38bdf8]/40'
                    : 'text-[#9ca3af] hover:bg-[#1e2128]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">difference</span> DIFF
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('flicker')}
                className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] flex items-center gap-1 transition-colors ${
                  viewportMode === 'flicker'
                    ? 'bg-[#1e2128] text-[#38bdf8] border border-[#38bdf8]/40'
                    : 'text-[#9ca3af] hover:bg-[#1e2128]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">flaky</span> FLICKER
              </button>

              <div className="h-3 w-px bg-[#262a32] mx-1" />

              <button
                type="button"
                onClick={onOpenScopes}
                className="text-[#9ca3af] hover:text-[#e2e2e6] p-1"
                title="Open Video Scopes"
              >
                <span className="material-symbols-outlined text-[15px]">fullscreen</span>
              </button>
            </div>
          </div>

          {/* MAIN MEDIA CANVAS WITH INTERACTIVE DRAGGABLE WIPE */}
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative flex-1 bg-[#0a0c0f] flex items-center justify-center overflow-hidden p-2 select-none"
          >
            {/* 16:9 Cinema Aspect Container */}
            <div className="relative w-full h-full max-w-5xl max-h-[520px] rounded-sm overflow-hidden border border-[#262a32] shadow-2xl bg-[#08090c]">
              {/* LAYER A (LEFT: NIGHT DELUGE STORM) */}
              <div
                className={`absolute inset-0 overflow-hidden ${
                  viewportMode === 'flicker' && flickerState ? 'hidden' : 'block'
                }`}
              >
                <svg
                  className="w-full h-full object-cover"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                  viewBox="0 0 960 540"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#05080f" />
                      <stop offset="60%" stopColor="#09131e" />
                      <stop offset="100%" stopColor="#0c1b26" />
                    </linearGradient>
                    <radialGradient id="sodium-lamp" cx="220" cy="140" r="280" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                      <stop offset="50%" stopColor="#d97706" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="ocean-night" x1="0" y1="300" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#08151f" />
                      <stop offset="100%" stopColor="#03080e" />
                    </linearGradient>
                    <linearGradient id="pier-timber" x1="0" y1="360" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#141a21" />
                      <stop offset="100%" stopColor="#0a0d11" />
                    </linearGradient>
                    <linearGradient id="maya-coat-wet" x1="0" y1="200" x2="0" y2="480" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#5f0f18" />
                      <stop offset="50%" stopColor="#3b080e" />
                      <stop offset="100%" stopColor="#1e0306" />
                    </linearGradient>
                  </defs>

                  {/* Sky & Atmosphere */}
                  <rect width="960" height="540" fill="url(#night-sky)" />
                  <rect y="290" width="960" height="250" fill="url(#ocean-night)" />
                  {/* Ferry Silhouette */}
                  <path d="M 60 275 L 140 275 L 160 290 L 40 290 Z" fill="#050b12" />
                  <rect x="80" y="260" width="40" height="15" fill="#04090e" />
                  <circle cx="115" cy="268" r="2" fill="#ef4444" opacity="0.8" />
                  {/* Pier Wood Deck */}
                  <polygon points="0,380 960,350 960,540 0,540" fill="url(#pier-timber)" />
                  <line x1="0" y1="410" x2="960" y2="385" stroke="#1f2937" strokeWidth="1.5" />
                  <line x1="0" y1="445" x2="960" y2="425" stroke="#1f2937" strokeWidth="2" />
                  <line x1="0" y1="490" x2="960" y2="470" stroke="#111827" strokeWidth="2.5" />
                  <ellipse cx="260" cy="460" rx="140" ry="18" fill="#38bdf8" opacity="0.08" />
                  <ellipse cx="290" cy="455" rx="80" ry="8" fill="#f59e0b" opacity="0.12" />
                  {/* Lamp post */}
                  <rect x="180" y="100" width="10" height="290" fill="#0e1318" />
                  <circle cx="185" cy="115" r="14" fill="#fbbf24" opacity="0.9" />
                  <circle cx="185" cy="115" r="280" fill="url(#sodium-lamp)" />
                  {/* Rain streaks */}
                  <g stroke="#7dd3fc" strokeWidth="1.2" strokeOpacity="0.25">
                    <line x1="50" y1="20" x2="20" y2="160" />
                    <line x1="140" y1="0" x2="110" y2="180" />
                    <line x1="220" y1="40" x2="190" y2="240" />
                    <line x1="310" y1="10" x2="280" y2="220" />
                    <line x1="420" y1="30" x2="390" y2="280" />
                    <line x1="90" y1="210" x2="60" y2="390" />
                    <line x1="210" y1="260" x2="180" y2="460" />
                    <line x1="330" y1="240" x2="300" y2="470" />
                    <line x1="170" y1="120" x2="140" y2="300" strokeWidth="1.8" strokeOpacity="0.45" />
                  </g>
                  {/* Maya Character */}
                  <g transform="translate(190, 140)">
                    <path
                      d="M 120 70 Q 145 70 155 95 Q 170 140 175 220 L 190 320 L 95 320 L 105 220 Q 110 140 120 70 Z"
                      fill="#38bdf8"
                      opacity="0.12"
                    />
                    <path
                      d="M 122 75 C 105 85 92 115 88 155 L 75 245 L 85 320 L 190 320 L 180 230 L 165 145 C 160 110 145 85 122 75 Z"
                      fill="url(#maya-coat-wet)"
                    />
                    <path d="M 122 75 L 110 125 L 126 185 L 142 125 Z" fill="#420b12" />
                    <path d="M 110 125 L 90 135 L 94 175 L 124 185 Z" fill="#2d060b" />
                    <path d="M 142 125 L 162 135 L 158 175 L 126 185 Z" fill="#2d060b" />
                    <circle cx="126" cy="48" r="18" fill="#e5b89a" />
                    <path
                      d="M 112 36 C 112 24 140 24 142 36 C 144 48 140 60 138 68 C 128 66 118 64 114 56 Z"
                      fill="#181311"
                    />
                  </g>
                </svg>

                {/* Label Overlay Source A */}
                <div className="absolute top-3 left-3 bg-[#0c0e11]/90 border border-[#262a32] px-2 py-1 rounded backdrop-blur font-['JetBrains_Mono'] text-[10px] text-[#e2e2e6] shadow-md">
                  <span className="text-rose-400 font-bold">SOURCE A:</span> NIGHT DELUGE · TK 04 (ORIGINAL)
                </div>
                <div className="absolute bottom-3 left-3 bg-[#0c0e11]/90 border border-[#262a32] px-2 py-1 rounded backdrop-blur font-['JetBrains_Mono'] text-[10px] text-[#9ca3af] shadow-md">
                  <span className="text-[#38bdf8] font-semibold">ISO 1600</span> · T1.5 · SODIUM 2200K · WET WARDROBE
                </div>
              </div>

              {/* LAYER B (RIGHT: QUIET DAWN SUNRISE SIMULATION) */}
              <div
                className={`absolute inset-0 overflow-hidden ${
                  viewportMode === 'flicker' && !flickerState ? 'hidden' : 'block'
                }`}
                style={{
                  clipPath:
                    viewportMode === 'diff'
                      ? 'none'
                      : `polygon(${splitPercent}% 0, 100% 0, 100% 100%, ${splitPercent}% 100%)`,
                  opacity: viewportMode === 'diff' ? 0.75 : 1,
                  filter: viewportMode === 'diff' ? 'invert(0.4) saturate(2)' : 'none',
                }}
              >
                <svg
                  className="w-full h-full object-cover"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                  viewBox="0 0 960 540"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="dawn-sky" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1e2235" />
                      <stop offset="40%" stopColor="#4c3846" />
                      <stop offset="65%" stopColor="#c26d47" />
                      <stop offset="85%" stopColor="#e89e5c" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                    <radialGradient id="sunburst-glow" cx="720" cy="270" r="360" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                      <stop offset="25%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#ec4899" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="ocean-dawn" x1="0" y1="290" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#bf7045" />
                      <stop offset="35%" stopColor="#5a423f" />
                      <stop offset="100%" stopColor="#1f232b" />
                    </linearGradient>
                    <linearGradient id="pier-dry" x1="0" y1="360" x2="0" y2="540" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#42352b" />
                      <stop offset="50%" stopColor="#2c2420" />
                      <stop offset="100%" stopColor="#191717" />
                    </linearGradient>
                    <linearGradient id="maya-coat-dry" x1="0" y1="200" x2="0" y2="480" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="60%" stopColor="#7f1d1d" />
                      <stop offset="100%" stopColor="#450a0a" />
                    </linearGradient>
                  </defs>

                  {/* Warm Dawn Sky */}
                  <rect width="960" height="540" fill="url(#dawn-sky)" />
                  <circle cx="720" cy="270" r="360" fill="url(#sunburst-glow)" />
                  <circle cx="720" cy="270" r="28" fill="#fffbeb" opacity="0.95" />
                  {/* Sun Rays */}
                  <polygon points="720,270 0,180 0,220" fill="#fde047" opacity="0.12" />
                  <polygon points="720,270 0,310 0,380" fill="#fed7aa" opacity="0.18" />
                  <polygon points="720,270 120,540 380,540" fill="#fef08a" opacity="0.15" />
                  {/* Calm Sea Horizon */}
                  <rect y="290" width="960" height="250" fill="url(#ocean-dawn)" />
                  <polygon points="720,290 660,370 780,370" fill="#fef08a" opacity="0.35" />
                  {/* Calm Ferry in Morning Fog */}
                  <path d="M 60 278 L 140 278 L 160 290 L 40 290 Z" fill="#2b232c" opacity="0.8" />
                  <rect x="80" y="265" width="40" height="13" fill="#231d24" opacity="0.8" />
                  <circle cx="115" cy="272" r="2" fill="#38bdf8" opacity="0.7" />
                  {/* Dry Timber Pier Deck */}
                  <polygon points="0,380 960,350 960,540 0,540" fill="url(#pier-dry)" />
                  <line x1="0" y1="410" x2="960" y2="385" stroke="#524338" strokeWidth="1.5" />
                  <line x1="0" y1="445" x2="960" y2="425" stroke="#3d322b" strokeWidth="2" />
                  <line x1="0" y1="490" x2="960" y2="470" stroke="#2a221d" strokeWidth="2.5" />
                  {/* Weathered Post */}
                  <rect x="180" y="100" width="10" height="290" fill="#3a2f26" />
                  <line x1="190" y1="100" x2="190" y2="390" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.8" />
                  {/* Maya in Dry Wool Coat with Morning Rim Light */}
                  <g transform="translate(190, 140)">
                    <path
                      d="M 122 75 C 145 85 160 110 165 145 L 180 230 L 190 320 L 165 320 L 160 230 C 155 160 145 100 122 75 Z"
                      fill="#fef08a"
                      opacity="0.25"
                    />
                    <path
                      d="M 122 75 C 105 85 92 115 88 155 L 75 245 L 85 320 L 190 320 L 180 230 L 165 145 C 160 110 145 85 122 75 Z"
                      fill="url(#maya-coat-dry)"
                    />
                    <path d="M 122 75 L 110 125 L 126 185 L 142 125 Z" fill="#b91c1c" />
                    <path d="M 110 125 L 90 135 L 94 175 L 124 185 Z" fill="#881337" />
                    <path d="M 142 125 L 162 135 L 158 175 L 126 185 Z" fill="#dc2626" />
                    <circle cx="126" cy="48" r="18" fill="#f2c8ad" />
                    <path
                      d="M 112 36 C 112 20 144 20 145 36 C 148 48 152 64 148 72 C 132 68 116 66 112 56 Z"
                      fill="#35241b"
                    />
                    <circle cx="138" cy="46" r="1.5" fill="#fef08a" />
                  </g>
                </svg>

                {/* Label Overlay Simulation B */}
                <div className="absolute top-3 right-3 bg-[#0c0e11]/90 border border-[#38bdf8]/40 px-2 py-1 rounded backdrop-blur font-['JetBrains_Mono'] text-[10px] text-[#38bdf8] shadow-md">
                  <span className="text-[#38bdf8] font-bold">SIMULATION B:</span> QUIET DAWN · CANDIDATE {activeCandidate}
                </div>
                <div className="absolute bottom-3 right-3 bg-[#0c0e11]/90 border border-[#262a32] px-2 py-1 rounded backdrop-blur font-['JetBrains_Mono'] text-[10px] text-[#9ca3af] shadow-md text-right">
                  <span className="text-amber-400 font-semibold">ACEScc DAWN-LUT #04A</span> · DRY MATTE FINISH · SUN AZIMUTH 15.5°
                </div>
              </div>

              {/* DRAGGABLE WIPE DIVIDER */}
              {viewportMode === 'wipe' && (
                <div
                  onPointerDown={handlePointerDown}
                  className="absolute top-0 bottom-0 w-1 bg-[#38bdf8] cursor-ew-resize flex items-center justify-center pointer-events-auto shadow-[0_0_12px_#38bdf8] z-30"
                  style={{ left: `${splitPercent}%` }}
                >
                  <div className="w-6 h-12 bg-[#1e2128] border border-[#38bdf8] text-[#38bdf8] rounded flex flex-col items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-grab active:cursor-grabbing">
                    <span className="material-symbols-outlined text-[15px]">drag_indicator</span>
                  </div>
                </div>
              )}

              {/* FLOATING TIMECODE HUD */}
              <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none z-20">
                <div className="bg-[#0c0e11]/90 border border-[#262a32] px-3 py-0.5 rounded shadow-lg flex items-center gap-3 font-['JetBrains_Mono'] text-[15px] leading-none text-[#e2e2e6] backdrop-blur">
                  <span className="text-[#38bdf8] font-bold">00:12:44:08</span>
                  <span className="text-[#4b5563] text-[11px]">FRAME #18,344</span>
                  <span className="text-amber-400 text-[10px] font-bold bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/30">
                    SIMULATING
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AUDIO RE-ANCHORING & TIMELINE SCRUBBER (Height: 110px) */}
          <div className="h-28 bg-[#111316] border-t border-[#262a32] px-3 py-1.5 flex flex-col justify-between shrink-0">
            {/* Audio Monitor Info Bar */}
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[15px]">
                  graphic_eq
                </span>
                <span className="text-[#e2e2e6] font-semibold">
                  SCORE CUE 3M04 RE-ANCHOR MONITOR
                </span>
                <span className="text-[#4b5563]">➔ SCENE 18 ENTRY</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#262a32] px-1.5 py-0.5 rounded text-amber-400 text-[10px] font-bold">
                  COLLISION OFFSET: 0.00ms
                </span>
                <span className="text-[#9ca3af] font-medium">TEMPO: 72 BPM</span>
                <span className="text-[#4b5563]">|</span>
                <span className="text-[#38bdf8] font-semibold">HARMONIC PHASE: 0.0°</span>
              </div>
            </div>

            {/* Precision Waveform Canvas */}
            <div className="h-12 w-full bg-[#0c0e11] border border-[#262a32] rounded relative overflow-hidden flex items-center">
              <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-[#1e2128]/60 border-r border-[#262a32] flex items-center px-2">
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#4b5563] uppercase tracking-wider font-semibold">
                  3M03 Ferry Depart (Fading Out)
                </span>
              </div>
              <div className="absolute left-[42%] top-0 bottom-0 w-[58%] bg-[#38bdf8]/10 flex items-center px-2">
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#38bdf8] uppercase tracking-wider font-bold">
                  3M04 Sunrise String Cadence [Re-Anchored to Frame #18,344]
                </span>
              </div>

              {/* Dense Audio Waveform SVG */}
              <svg
                className="w-full h-10 text-[#38bdf8] z-10"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 1000 40"
              >
                <path
                  d="M0,20 L15,14 L30,26 L45,12 L60,28 L75,15 L90,25 L105,10 L120,30 L135,16 L150,24 L165,8 L180,32 L195,18 L210,22 L225,12 L240,28 L255,14 L270,26 L285,16 L300,24 L315,18 L330,22 L345,19 L360,21 L380,20 L420,20 L430,7 L440,33 L450,4 L460,36 L470,2 L480,38 L490,6 L500,34 L515,10 L530,30 L545,8 L560,32 L575,12 L590,28 L605,10 L620,30 L635,14 L650,26 L665,8 L680,32 L695,11 L710,29 L725,13 L740,27 L755,15 L770,25 L785,9 L800,31 L820,14 L840,26 L860,12 L880,28 L900,16 L920,24 L950,18 L980,22 L1000,20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M420,20 Q440,12 460,28 T500,10 T540,30 T580,12 T620,28 T660,14 T700,26 T740,16 T780,24 T820,18 T860,22 L1000,20"
                  stroke="#fabc4d"
                  strokeOpacity="0.6"
                  strokeWidth="1"
                />
              </svg>

              {/* Scrubber Playhead */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400 z-20 shadow-[0_0_8px_#fabc4d]">
                <div className="w-2.5 h-2 -ml-1 bg-amber-400 rounded-b" />
              </div>
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#9ca3af]">
              <span>
                IN: <strong className="text-[#e2e2e6]">00:12:30:00</strong>
              </span>
              <div className="flex items-center gap-2 text-[#e2e2e6]">
                <button
                  type="button"
                  className="hover:text-[#38bdf8] p-0.5"
                  title="Previous Keyframe"
                >
                  <span className="material-symbols-outlined text-[15px]">skip_previous</span>
                </button>
                <button
                  type="button"
                  className="hover:text-[#38bdf8] p-0.5"
                  title="Rewind"
                >
                  <span className="material-symbols-outlined text-[15px]">fast_rewind</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-5 h-5 rounded-full bg-[#38bdf8] text-[#00283b] flex items-center justify-center shadow hover:scale-105 transition-transform font-bold"
                  title="Play / Pause Audio Scrub"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isPlayingAudio ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <button
                  type="button"
                  className="hover:text-[#38bdf8] p-0.5"
                  title="Fast Forward"
                >
                  <span className="material-symbols-outlined text-[15px]">fast_forward</span>
                </button>
                <button
                  type="button"
                  className="hover:text-[#38bdf8] p-0.5"
                  title="Next Keyframe"
                >
                  <span className="material-symbols-outlined text-[15px]">skip_next</span>
                </button>
              </div>
              <span>
                OUT: <strong className="text-[#e2e2e6]">00:13:02:12</strong>
              </span>
            </div>
          </div>
        </main>

        {/* COLUMN 3: SIMULATION INSPECTOR & VALIDATOR (320px) */}
        <section className="w-80 bg-[#111316] flex flex-col shrink-0 min-h-0 overflow-hidden">
          {/* Inspector Header */}
          <div className="h-8 px-3 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 font-['Inter'] text-[11px] font-bold text-[#e2e2e6] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">flaky</span>
              <span>SIMULATION VALIDATOR</span>
            </div>
            <span className="bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8] px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold">
              REAL-TIME
            </span>
          </div>

          {/* Convergence Progress Card */}
          <div className="p-3 bg-[#16181d]/60 border-b border-[#262a32] shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
              <span className="text-[#9ca3af] font-semibold">GLOBAL SOLVER STATE</span>
              <span className="text-amber-400 font-['JetBrains_Mono'] text-[10px] font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                {propInvariants ? `${propInvariants.filter(i => i.latestStatus === 'PASS').length} / ${propInvariants.length} INVARIANTS PASS` : (sunVectorSolved ? '5 / 5 CONSTRAINTS PASS' : '4 / 5 CONSTRAINTS PASS')}
              </span>
            </div>
            <p className="font-bold text-[12px] text-[#e2e2e6]">
              REEL 04 CONTINUITY REPAIR CONVERGENCE
            </p>
            <div className="w-full bg-[#0c0e11] h-2 rounded overflow-hidden border border-[#262a32]">
              <div
                className="bg-gradient-to-r from-[#0284c7] to-[#38bdf8] h-full rounded transition-all duration-700"
                style={{ width: `${convergencePercent}%` }}
              />
            </div>
            <div className="flex justify-between font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
              <span>ITERATION: #{activeIteration}</span>
              <span className="text-[#38bdf8] font-bold">CONVERGENCE {convergencePercent}%</span>
            </div>
          </div>

          {/* Real Rupture Resolution Matrix & Invariants */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-[#0c0e11] text-[11px]">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#9ca3af] uppercase tracking-wider font-semibold">
                RUPTURE RESOLUTION MATRIX ({propInvariants?.length || 5})
              </span>
              <span className="text-[9px] font-['JetBrains_Mono'] text-[#38bdf8]">
                CLICKHOUSE EVIDENCE
              </span>
            </div>

            {propInvariants && propInvariants.length > 0 ? (
              propInvariants.map((inv) => {
                const isPass = inv.latestStatus === 'PASS';
                const isFail = inv.latestStatus === 'FAIL';
                return (
                  <div
                    key={inv.invariantId}
                    className={`p-2 rounded bg-[#16181d] border space-y-1 ${
                      isPass
                        ? 'border-emerald-500/30'
                        : isFail
                        ? 'border-rose-500/40'
                        : 'border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[#e2e2e6]">
                      <span className="truncate max-w-[180px]">{inv.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isFail
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {inv.latestStatus}
                      </span>
                    </div>
                    <p className="text-[#9ca3af] text-[10.5px] leading-tight line-clamp-2">
                      {inv.ruleExpression}
                    </p>
                    {inv.latestReceipt?.validationDetails && (
                      <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[9.5px] text-[#38bdf8]">
                        <span className="material-symbols-outlined text-[11px]">fact_check</span>
                        <span className="truncate">{inv.latestReceipt.validationDetails}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                {/* Truthful unverified default invariants */}
                <div className="p-2 rounded bg-[#16181d] border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#e2e2e6]">
                    <span>1. Weather Continuity</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold">
                      VALIDATION_UNKNOWN
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-[11px] leading-tight">
                    Downpour erased via optical neural matte. Awaiting live database validation receipt.
                  </p>
                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-amber-400">
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    <span>Status: Unverified (Missing receipt)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#16181d] border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#e2e2e6]">
                    <span>2. Wardrobe Wetness Ratio</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold">
                      VALIDATION_UNKNOWN
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-[11px] leading-tight">
                    Maya wool coat gloss index reduced from 0.88 to 0.18 daylight matte texture.
                  </p>
                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-amber-400">
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    <span>Status: Unverified (Missing receipt)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#16181d] border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#e2e2e6]">
                    <span>3. ADR Dialogue Intelligibility</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold">
                      VALIDATION_UNKNOWN
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-[11px] leading-tight">
                    TK-13-ADR-04 lip-sync calibrated via phoneme warp mesh to actor jawline motion.
                  </p>
                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-amber-400">
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    <span>Status: Unverified (Missing receipt)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#16181d] border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#e2e2e6]">
                    <span>4. Score Cue 3M04 Collision</span>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold">
                      VALIDATION_UNKNOWN
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-[11px] leading-tight">
                    Sunrise string cadence re-anchored to frame #18,344 pier gate latch contact.
                  </p>
                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-amber-400">
                    <span className="material-symbols-outlined text-[12px]">help</span>
                    <span>Status: Unverified (Missing receipt)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#16181d] border border-emerald-500/30 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between font-semibold text-[#38bdf8]">
                    <span>5. Sun Vector Parallax</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold ${
                        sunVectorSolved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-[#38bdf8]/20 text-[#38bdf8] animate-pulse'
                      }`}
                    >
                      {sunVectorSolved ? 'PASS' : 'SOLVING...'}
                    </span>
                  </div>
                  <p className="text-[#e2e2e6] text-[11px] leading-tight">
                    Sunburst angle (14.2° E) vs Scene 15 wide drone shot azimuth (16.8° E).
                  </p>
                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-emerald-400">
                    <span
                      className={`material-symbols-outlined text-[12px] ${
                        sunVectorSolved ? 'text-emerald-400' : 'text-amber-400 animate-spin'
                      }`}
                    >
                      {sunVectorSolved ? 'check_circle' : 'sync'}
                    </span>
                    <span>
                      {sunVectorSolved
                        ? 'Raytracer falloff: 0.0° Parallax zeroed'
                        : 'Raytracer falloff: 2.6° variance resolving'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Candidate Evidence Generator Action Box */}
            <div className="mt-2 p-2 bg-[#15181e] border border-[#2a2f38] rounded space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-['JetBrains_Mono'] text-sky-400 uppercase font-bold">
                  GENERATE CANDIDATE EVIDENCE
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#949da8]">
                  EVIDENCE ONLY
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleGenerateCandidateMedia('image')}
                  disabled={mediaGenerating !== null}
                  className="p-1 rounded bg-[#1f232b] hover:bg-[#282d38] border border-[#333a46] text-[#e2e5eb] text-[9px] font-['JetBrains_Mono'] flex flex-col items-center justify-center transition-colors disabled:opacity-40"
                  title="Uses gemini-3.1-flash-image"
                >
                  <span className="material-symbols-outlined text-[14px] text-sky-400">image</span>
                  <span>{mediaGenerating === 'image' ? '...' : 'STILL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateCandidateMedia('video')}
                  disabled={mediaGenerating !== null}
                  className="p-1 rounded bg-[#1f232b] hover:bg-[#282d38] border border-[#333a46] text-[#e2e5eb] text-[9px] font-['JetBrains_Mono'] flex flex-col items-center justify-center transition-colors disabled:opacity-40"
                  title="Uses veo-3.1-lite-generate-preview"
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-400">videocam</span>
                  <span>{mediaGenerating === 'video' ? '...' : 'VEO MOTION'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateCandidateMedia('audio')}
                  disabled={mediaGenerating !== null}
                  className="p-1 rounded bg-[#1f232b] hover:bg-[#282d38] border border-[#333a46] text-[#e2e5eb] text-[9px] font-['JetBrains_Mono'] flex flex-col items-center justify-center transition-colors disabled:opacity-40"
                  title="Uses lyria-3-clip-preview"
                >
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">audiotrack</span>
                  <span>{mediaGenerating === 'audio' ? '...' : 'LYRIA CUE'}</span>
                </button>
              </div>

              {mediaResult && (
                <div className="bg-[#0e1014] border border-[#2b303b] p-1.5 rounded text-[9.5px] font-['JetBrains_Mono'] text-[#9ca3af] space-y-0.5">
                  <div className="flex items-center justify-between text-sky-300">
                    <span className="font-bold uppercase">{mediaResult.type} RECEIPT</span>
                    <span className="text-[8.5px] text-[#6b7280]">{mediaResult.model}</span>
                  </div>
                  <p className="text-[#cbd5e1] line-clamp-2">{mediaResult.note}</p>
                  <span className="inline-block text-[8px] text-amber-400/90 font-semibold">
                    * CANDIDATE EVIDENCE ONLY — NOT COMMITTED TO TIMELINE
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Promotion Error Notice */}
          {promotionError && (
            <div className="px-3 py-1.5 bg-rose-950/60 border-t border-rose-500/40 text-rose-300 font-['JetBrains_Mono'] text-[10px] flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[13px] text-rose-400">error</span>
              <span className="truncate">{promotionError}</span>
            </div>
          )}

          {/* Inspector Action Buttons & Invariant Gate */}
          <div className="p-2.5 bg-[#16181d] border-t border-[#262a32] shrink-0 space-y-1.5">
            {(() => {
              const activeInvariants = propInvariants || [];
              const allPassed =
                activeInvariants.length > 0
                  ? activeInvariants.every((i) => i.latestStatus === 'PASS') && sunVectorSolved
                  : false;

              return (
                <>
                  <button
                    type="button"
                    id="btn-confirm-promote-repair"
                    onClick={handleConfirmPromote}
                    disabled={isPromoting || !allPassed}
                    className={`w-full py-2 px-3 font-semibold text-[11px] rounded flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      !allPassed
                        ? 'bg-[#22262f] border border-amber-500/40 text-amber-300 cursor-not-allowed'
                        : isPromoting
                        ? 'bg-[#38bdf8] text-[#00283b]'
                        : 'bg-amber-400 hover:bg-amber-300 text-black'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isPromoting ? 'animate-spin' : ''
                      }`}
                    >
                      {isPromoting ? 'refresh' : !allPassed ? 'lock' : 'verified'}
                    </span>
                    <span>
                      {isPromoting
                        ? 'COMMITTING REPAIR TO CLICKHOUSE DB...'
                        : !allPassed
                        ? 'INVARIANT GATE LOCKED (ALL INVARIANTS REQUIRE PASS)'
                        : 'CONFIRM & PROMOTE REPAIR TO TIMELINE'}
                    </span>
                  </button>

                  {!allPassed && (
                    <p className="text-[9.5px] font-['JetBrains_Mono'] text-amber-400/80 text-center leading-tight">
                      Authority rule: Missing or failing invariant evidence cannot be promoted.
                    </p>
                  )}
                </>
              );
            })()}

            <button
              type="button"
              onClick={onAbortSimulation}
              className="w-full py-1 px-3 bg-[#262a32] hover:bg-[#323742] text-[#9ca3af] hover:text-rose-400 text-[11px] rounded flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>ABORT SIMULATION</span>
            </button>
          </div>
        </section>
      </div>

      {/* BOTTOM DOCKED DRAWER: CANDIDATE REPAIR CONTACT SHEET (144px) */}
      <footer className="h-36 bg-[#111316] border-t border-[#262a32] shrink-0 flex flex-col overflow-hidden z-20 shadow-2xl">
        {/* Dock Header */}
        <div className="h-7 px-3 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-['Inter'] text-[11px] font-bold text-[#e2e2e6] uppercase">
              <span className="material-symbols-outlined text-[#38bdf8] text-[15px]">layers</span>
              <span>DOCKED REPAIR CONTACT SHEET</span>
            </div>
            <span className="text-[#4b5563]">|</span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
              4 STRATEGIES EVALUATED FOR REEL 04 CONTINUITY RUPTURE
            </span>
          </div>

          <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
            <span>HOTKEYS: [1] [2] [3] [4]</span>
            <button
              type="button"
              className="text-[#9ca3af] hover:text-[#e2e2e6]"
              title="Expand Dock"
            >
              <span className="material-symbols-outlined text-[15px]">expand_less</span>
            </button>
          </div>
        </div>

        {/* 4 Candidate Cards Grid */}
        <div className="flex-1 p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 overflow-x-auto min-h-0 bg-[#0c0e11]">
          {candidates.map((c) => {
            const isCurrent = activeCandidate === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveCandidate(c.id)}
                className={`rounded p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#16181d] border-2 border-[#38bdf8] shadow-md'
                    : 'bg-[#111316] border border-[#262a32] hover:border-[#4b5563] hover:bg-[#16181d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-[11px] flex items-center gap-1 ${
                      isCurrent ? 'text-[#38bdf8]' : 'text-[#9ca3af]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCurrent ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    CANDIDATE {c.id}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-['JetBrains_Mono'] text-[9px] font-bold ${
                      isCurrent
                        ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                        : 'bg-[#262a32] text-[#9ca3af]'
                    }`}
                  >
                    {isCurrent ? 'ACTIVE IN SIM' : 'CANDIDATE'}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-[11.5px] text-[#e2e2e6] truncate">{c.name}</p>
                  <p className="font-['JetBrains_Mono'] text-[10px] text-[#9ca3af] line-clamp-2 mt-0.5 leading-tight">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#262a32]">
                  <span className="text-[#9ca3af]">
                    TIME: <strong className="text-[#e2e2e6]">{c.timeHours} HRS</strong>
                  </span>
                  <span className={isCurrent ? 'text-[#38bdf8] font-bold' : 'text-[#9ca3af] font-bold'}>
                    EST: {c.costEst}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
