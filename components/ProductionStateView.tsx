'use client';

import React, { useState } from 'react';
import { SceneItem, ClickHouseHealth, LockedInvariant } from '@/lib/types';

interface ProductionStateViewProps {
  onOpenRepairDock?: () => void;
  onOpenTacticalRepair?: (dept: string) => void;
  onSelectScene?: (sceneNum: number) => void;
  onLaunchSimulation?: (directorPrompt?: string) => void;
  onOpenArchitecture?: () => void;
  onOpenScopes?: () => void;
  scenes?: SceneItem[];
  health?: ClickHouseHealth | null;
  invariants?: LockedInvariant[];
  isOrchestrating?: boolean;
  orchestrationError?: string | null;
}

export default function ProductionStateView({
  onOpenRepairDock,
  onOpenTacticalRepair,
  onSelectScene,
  onLaunchSimulation,
  onOpenArchitecture,
  onOpenScopes,
  scenes: propScenes,
  health,
  invariants,
  isOrchestrating,
  orchestrationError,
}: ProductionStateViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [abSplit, setAbSplit] = useState(false);
  const [selectedScene, setSelectedScene] = useState<number>(12);
  const [currentFrame, setCurrentFrame] = useState(18344);
  const [directorPrompt, setDirectorPrompt] = useState<string>(
    'Shift the revelation beat from Scene 12 to Scene 18; transition Scene 12 from night deluge rain into quiet dawn sunrise.'
  );

  const fallbackScenes = [
    { num: 10, title: 'EXT. FERRY TERMINAL - DUSK', status: 'LOCKED', badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/30', tc: '00:09:12:04', cam: 'TK 02 / ARRI RAW' },
    { num: 11, title: 'INT. CATAMARAN CABIN - CONT.', status: 'LOCKED', badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/30', tc: '00:10:48:19', cam: 'TK 05 / RED HELIUM' },
    { num: 12, title: 'EXT. PIER HEAD - NIGHT RAIN', status: 'CANDIDATE', badgeClass: 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30', tc: '00:12:44:08', cam: 'TAKE 04 (ACTIVE)' },
    { num: 13, title: 'INT. HARBOR TOWER - LATER', status: 'VIOLATION', badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', tc: '00:14:10:02', cam: 'TK 01 / ARRI RAW' },
    { num: 14, title: 'INT. CORRIDOR STAIRWELL - NIGHT', status: 'VIOLATION', badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', tc: '00:16:02:15', cam: 'TK 03 / ARRI RAW' },
    { num: 15, title: 'EXT. DRY DOCK GATES - CONT.', status: 'LOCKED', badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/30', tc: '00:17:40:22', cam: 'TK 02 / ARRI RAW' },
    { num: 16, title: 'INT. PUMP HOUSE VAULT - NIGHT', status: 'VIOLATION', badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', tc: '00:19:15:10', cam: 'TK 06 / ARRI RAW' },
    { num: 17, title: 'INT. GENERATOR ROOM - CONT.', status: 'VIOLATION', badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', tc: '00:21:04:00', cam: 'TK 01 / ARRI RAW' },
    { num: 18, title: 'EXT. SLIPWAY FOUR - DAWN', status: 'TARGET', badgeClass: 'bg-[#282c35] text-[#e2e5eb] border border-[#323843]', tc: '--:--:--:--', cam: 'UNSHOT / SLATE 18-A' },
  ];

  // Map prop scenes if provided, else fallback
  const scenes = (propScenes && propScenes.length > 0)
    ? propScenes.map((s) => {
        const num = s.number;
        const title = s.slug || s.description || `SCENE ${num}`;
        const upperStatus = s.status ? s.status.toUpperCase() : 'LOCKED';
        return {
          num,
          title,
          status: upperStatus,
          badgeClass:
            upperStatus === 'LOCKED'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : upperStatus === 'VIOLATION'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : upperStatus === 'TARGET'
              ? 'bg-[#282c35] text-[#e2e5eb] border border-[#323843]'
              : 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30',
          tc: s.timecode || '00:00:00:00',
          cam: s.camera || 'ARRI RAW',
        };
      })
    : fallbackScenes;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c0e] overflow-hidden select-none">
      {/* Sub-bar banner: Truthful status */}
      <section className="h-7 shrink-0 bg-[#111317] border-b border-[#282c35] px-3 flex items-center justify-between font-['JetBrains_Mono'] text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[#38bdf8] uppercase font-semibold tracking-tight">
              REVISION WORKSPACE
            </span>
          </div>
          <span className="text-[#323843]">/</span>
          <span className="text-[#949da8] truncate">
            {health?.status === 'CONNECTED'
              ? `CLICKHOUSE CANONICAL: CONNECTED (${health.latencyMs}ms)`
              : `CLICKHOUSE: ${health?.status || 'QUERYING'} (NO FABRICATION)`}
          </span>
          <span className="text-[#323843]">/</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-semibold">
              {invariants ? `${invariants.length} LOCKED INVARIANTS` : '5 LOCKED INVARIANTS'}
            </span>
            <span className="material-symbols-outlined text-[13px] text-amber-400">shield</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#949da8]">
          <span className="hidden sm:inline text-[10px] text-[#5a6472]">
            GRAPH DEPT: SCRIPT / PROD / SOUND
          </span>
          <span className="bg-[#171a20] px-1.5 py-0.5 rounded border border-[#323843]/60 text-[10px] text-[#e2e5eb]">
            SNAPSHOT REF: #04-SC12-V8
          </span>
        </div>
      </section>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-1.5 p-1.5 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Reel 04 Scene Strip */}
        <aside className="lg:col-span-2 flex flex-col min-h-0 bg-[#111317] rounded border border-[#282c35] overflow-hidden">
          <div className="p-2 border-b border-[#282c35] bg-[#171a20]/60 flex items-center justify-between shrink-0">
            <div>
              <span className="font-['Inter'] text-[12px] font-bold text-[#e2e5eb] block uppercase tracking-wider">
                REEL 04 STRIP
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#949da8] block">
                SC.10 – SC.18
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] font-bold bg-[#282c35] text-[#e2e5eb] px-1.5 py-0.5 rounded border border-[#323843]">
              9 SCENES
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
            {scenes.map((sc) => {
              const isSelected = selectedScene === sc.num;
              return (
                <div
                  key={sc.num}
                  onClick={() => {
                    setSelectedScene(sc.num);
                    onSelectScene?.(sc.num);
                  }}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    sc.num === 12
                      ? 'bg-[#1f2229] border-l-2 border-l-[#38bdf8] border-y border-r border-[#282c35] shadow-sm'
                      : isSelected
                      ? 'bg-[#171a20] border-[#38bdf8]'
                      : 'bg-[#171a20] border-[#323843]/30 hover:border-[#323843]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-['JetBrains_Mono'] text-[11px] font-bold ${
                        sc.num === 12 ? 'text-[#38bdf8]' : 'text-[#e2e5eb]'
                      }`}
                    >
                      SCENE {sc.num}
                    </span>
                    <span className={`font-['JetBrains_Mono'] text-[9px] font-bold px-1 py-0.2 rounded ${sc.badgeClass}`}>
                      {sc.status}
                    </span>
                  </div>
                  <p className="font-['Inter'] text-[10.5px] text-[#949da8] truncate font-medium">
                    {sc.title}
                  </p>
                  <div className="flex items-center justify-between mt-1 font-['JetBrains_Mono'] text-[10px]">
                    <span className={sc.num === 12 ? 'text-[#7dd3fc]' : 'text-[#5a6472]'}>
                      {sc.cam}
                    </span>
                    <span className={sc.num === 12 ? 'text-[#38bdf8] font-semibold' : 'text-[#5a6472]'}>
                      {sc.tc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Reference Monitor & Supervisor Ledger Feed */}
        <section className="lg:col-span-7 flex flex-col min-h-0 gap-1.5 overflow-y-auto pr-0.5">
          {/* Reference Monitor Card */}
          <div className="bg-[#111317] rounded border border-[#282c35] flex flex-col shrink-0 overflow-hidden">
            {/* Monitor Header */}
            <div className="h-8 bg-[#171a20] px-3 flex items-center justify-between border-b border-[#282c35]">
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
                <span className="font-semibold text-[#38bdf8]">MON-A: REF D65</span>
                <span className="text-[#5a6472]">|</span>
                <span className="text-[#949da8]">ACEScc / AP1 / REC.709</span>
                <span className="text-[#5a6472]">|</span>
                <span className="text-[#949da8]">EXPOSURE: T2.8 1/48 800EI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAbSplit(!abSplit)}
                  className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] flex items-center gap-1 transition-colors border ${
                    abSplit
                      ? 'bg-[#38bdf8] text-[#082f49] border-[#38bdf8] font-bold'
                      : 'bg-[#282c35] hover:bg-[#323742] text-[#e2e5eb] border-[#323843]/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">splitscreen</span>
                  <span>A/B SPLIT</span>
                </button>
                <div className="flex items-center bg-[#0a0c0e] px-1.5 py-0.5 rounded border border-[#323843]/60">
                  <span className="font-['JetBrains_Mono'] text-[9px] text-[#949da8]">
                    LMT 04_KODAK_5219
                  </span>
                </div>
              </div>
            </div>

            {/* Cinematic Still Frame */}
            <div className="relative w-full aspect-[2.39/1] bg-[#050608] flex items-center justify-center overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn_CR2dJqBBam4R0j-L-jf7POJKaSaganKYQw2utD51R02bHUk4Otg9WubHFYxPJH5PiWKU3Z7N8tgwRQb3CuUyjw6-wY-nrd_AvOuwKQRravGSv1hY3Qv9wDJFNJ3KzgLhb0THf-vdOpP0UXP_Wklb02iH9kXIl7f03wOfOBQyE7wH3WiyvbiGQ4nQCTl0hR0uTzVi6UqyA4Pc0W-k7hX1Mc1RW6JB_uBugkFkNzKgqKeQ8weLgD7kQ"
                alt="Scene 12 Take 4 - Maya standing on rain-drenched pier in red coat under harbor lights"
                className="w-full h-full object-cover object-center filter contrast-[1.04] brightness-95"
                referrerPolicy="no-referrer"
              />

              {/* Safe Title Frame Guide */}
              <div className="absolute inset-0 pointer-events-none border border-white/5" />
              <div className="absolute inset-x-8 inset-y-4 pointer-events-none border border-dashed border-white/15 flex items-start justify-end p-1">
                <span className="font-['JetBrains_Mono'] text-[9px] text-amber-300/80 bg-black/60 px-1 py-0.5 rounded">
                  SAFE TITLE 90%
                </span>
              </div>

              {/* Frame Overlays */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                <div className="flex items-start justify-between">
                  <div className="bg-[#0c0e12]/85 backdrop-blur-sm border border-[#323843]/60 px-2 py-1 rounded flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-['JetBrains_Mono'] text-[10.5px] text-[#e2e5eb] font-semibold">
                        REEL 04 · SCENE 12 · TAKE 04
                      </span>
                      <span className="text-[#5a6472]">·</span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#38bdf8]">
                        ARRI RAW LF
                      </span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-[9px] text-red-400 font-bold mt-0.5">
                      CONTINUITY DEVIATION DETECTED
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#0c0e12]/85 border border-[#323843]/60 px-2 py-1 rounded font-['JetBrains_Mono'] text-[10px] text-[#949da8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>GENLOCK 23.976</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="bg-[#0a0c10]/90 border border-[#323843]/70 px-3 py-1.5 rounded shadow-lg backdrop-blur-sm">
                    <span className="font-['JetBrains_Mono'] text-[24px] md:text-[30px] text-white tracking-tight leading-none block font-bold">
                      00:12:44:08
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10.5px] text-[#38bdf8] font-medium block mt-1">
                      TC IN: 00:12:30:14 // TC OUT: 00:13:02:00
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#0a0c10]/90 border border-red-500/40 px-2.5 py-1.5 rounded backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-['JetBrains_Mono'] text-[10px] text-red-300 font-bold">
                      REVISION FLAGGED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Scrubber Controls */}
            <div className="bg-[#171a20] p-2 flex flex-col gap-1 border-t border-[#282c35]">
              <div className="w-full bg-[#0a0c0e] h-2.5 rounded relative cursor-pointer group border border-[#323843]/50">
                <div className="absolute left-0 top-0 bottom-0 bg-[#282c35] w-full rounded" />
                <div className="absolute left-0 top-0 bottom-0 bg-[#38bdf8]/30 w-[42%] rounded" />
                <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-[#38bdf8]/70" />
                <div className="absolute left-[78%] top-0 bottom-0 w-0.5 bg-[#38bdf8]/70" />
                <div className="absolute left-[42%] top-0 bottom-0 w-0.5 bg-red-400 z-10 shadow-[0_0_6px_rgba(248,113,113,0.8)]" />
                <div className="absolute left-[42%] -top-1 w-2 h-4.5 -ml-1 bg-[#38bdf8] rounded-sm shadow-sm border border-white/60" />
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentFrame((f) => Math.max(18000, f - 24))}
                    className="w-6 h-6 rounded bg-[#1f2229] hover:bg-[#323742] flex items-center justify-center text-[#e2e5eb] transition-colors border border-[#323843]/40"
                    title="Jump Previous Cut"
                  >
                    <span className="material-symbols-outlined text-[14px]">skip_previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentFrame((f) => f - 1)}
                    className="w-6 h-6 rounded bg-[#1f2229] hover:bg-[#323742] flex items-center justify-center text-[#e2e5eb] transition-colors border border-[#323843]/40"
                    title="Step Back 1 Frame"
                  >
                    <span className="material-symbols-outlined text-[14px]">fast_rewind</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-7 h-7 rounded bg-[#38bdf8] hover:bg-[#0284c7] text-[#082f49] flex items-center justify-center transition-colors shadow-sm font-bold"
                    title="Play / Pause"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentFrame((f) => f + 1)}
                    className="w-6 h-6 rounded bg-[#1f2229] hover:bg-[#323742] flex items-center justify-center text-[#e2e5eb] transition-colors border border-[#323843]/40"
                    title="Step Forward 1 Frame"
                  >
                    <span className="material-symbols-outlined text-[14px]">fast_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentFrame((f) => f + 24)}
                    className="w-6 h-6 rounded bg-[#1f2229] hover:bg-[#323742] flex items-center justify-center text-[#e2e5eb] transition-colors border border-[#323843]/40"
                    title="Jump Next Cut"
                  >
                    <span className="material-symbols-outlined text-[14px]">skip_next</span>
                  </button>
                  <span className="font-['JetBrains_Mono'] text-[10.5px] text-[#949da8] ml-2">
                    FRAME: {currentFrame.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1 font-['JetBrains_Mono'] text-[9px] text-[#5a6472]">
                    <span>CH1</span>
                    <div className="w-12 h-1.5 bg-[#0a0c0e] rounded overflow-hidden border border-[#323843]/50">
                      <div className="bg-[#38bdf8] h-full w-[65%]" />
                    </div>
                    <span>CH2</span>
                    <div className="w-12 h-1.5 bg-[#0a0c0e] rounded overflow-hidden border border-[#323843]/50">
                      <div className="bg-[#38bdf8] h-full w-[58%]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[9px]">
                    <span className="text-[#949da8] bg-[#282c35] px-1.5 py-0.5 rounded border border-[#323843]">
                      23.976 fps
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                      SYNC REF OK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continuity Supervisor Ledger Feed */}
          <div className="bg-[#15181e] rounded border border-[#282c35] p-3 flex flex-col gap-2 shrink-0 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#282c35]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#38bdf8] text-[16px]">edit_note</span>
                <span className="font-['Inter'] text-[11px] text-[#e2e5eb] uppercase tracking-wider font-bold">
                  CONTINUITY SUPERVISOR LEDGER FEED
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#949da8]">
                SOURCE: SCRIPT DATED 14-OCTOBER // PINK REVISED
              </span>
            </div>

            <div className="bg-[#0d0f13] p-3 rounded border border-[#323843]/40 font-['Newsreader'] text-[#e2e5eb] flex flex-col gap-2 leading-relaxed">
              <div className="font-['Newsreader'] font-bold text-[14px] text-[#e2e5eb] flex items-center justify-between border-b border-[#282c35]/80 pb-1">
                <span className="tracking-wide">
                  SCENE 12. EXT. HARBOR FERRY PIER - NIGHT (RAINING)
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                  CONTINUITY CRITICAL
                </span>
              </div>

              <p className="text-[#949da8] text-[13px] leading-relaxed">
                Rain slams horizontal across the rusted iron mooring bollards. The water gathers in
                oily slicks under the sodium lamps.{' '}
                <span className="text-[#e2e5eb] font-semibold">MAYA (30s)</span> steps off the
                gangplank. Her wool trench coat is already black with water across the shoulders.
              </p>

              <div className="flex flex-col items-center my-0.5">
                <span className="font-['Inter'] font-bold text-[#7dd3fc] uppercase tracking-widest text-[10.5px]">
                  MAYA
                </span>
                <p className="font-['Newsreader'] italic text-center max-w-md text-[#e2e5eb] text-[13px] mt-0.5">
                  &quot;If we drop the cargo at Slipway Four before morning, they won&apos;t check the
                  manifests. We have forty minutes.&quot;
                </p>
              </div>

              {/* Timecode Mismatch Alert Callout */}
              <div className="bg-[#1a1c21] border-l-2 border-red-400 border-y border-r border-[#323843]/60 p-2.5 rounded flex items-start gap-2.5 mt-1">
                <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5">
                  flag
                </span>
                <div className="text-[12.5px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-['Inter'] font-bold text-[11px] text-red-400 uppercase tracking-wider">
                      SUPERVISOR NOTE (TAKE 4 DIRECTED INSERT):
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                      TIMECODE MISMATCH
                    </span>
                  </div>
                  <p className="text-[#e2e5eb] text-[11.5px] leading-relaxed">
                    Director instructed Maya to remove her wet coat and drop it onto the bollard at{' '}
                    <span className="font-['JetBrains_Mono'] text-[#38bdf8] font-bold">
                      00:12:56:12
                    </span>
                    . This action changes Maya&apos;s physical state for all subsequent interiors
                    (Scene 13 and 14). If the reveal is shifted downstream to Scene 18, all
                    intermediate coat references become invalid.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Director Revision Input Workbench */}
          <div className="bg-[#15181e] rounded border border-[#282c35] p-3 flex flex-col gap-2 shrink-0 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#282c35]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-400 text-[16px]">psychology</span>
                <span className="font-['Inter'] text-[11px] text-[#e2e5eb] uppercase tracking-wider font-bold">
                  DIRECTOR REVISION ORCHESTRATION
                </span>
              </div>
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px]">
                <span className="text-sky-400 font-semibold">gemini-3.8-flash</span>
                <span className="text-[#5a6472]">·</span>
                <span className="text-[#949da8]">MCP READ-ONLY</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="director-prompt-input" className="font-['Inter'] text-[10.5px] font-semibold text-[#949da8] uppercase tracking-wider">
                Natural Language Intent (ADK RevisionPatch Parser)
              </label>
              <textarea
                id="director-prompt-input"
                rows={2}
                value={directorPrompt}
                onChange={(e) => setDirectorPrompt(e.target.value)}
                placeholder="Enter revision prompt (e.g. Shift revelation beat from Scene 12 to Scene 18; transition Scene 12 to dawn sunrise)..."
                className="w-full bg-[#0d0f13] border border-[#323843] rounded p-2 text-[11.5px] font-['JetBrains_Mono'] text-[#e2e5eb] focus:outline-none focus:border-[#38bdf8] transition-colors resize-none leading-relaxed"
              />

              {orchestrationError && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded p-2 text-rose-300 text-[10.5px] font-['JetBrains_Mono'] flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-rose-400 shrink-0">error</span>
                  <span>{orchestrationError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDirectorPrompt(
                        'Shift the revelation beat from Scene 12 to Scene 18; transition Scene 12 from night deluge rain into quiet dawn sunrise.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-[#1f2229] hover:bg-[#282c35] text-[#949da8] hover:text-[#e2e5eb] text-[9.5px] font-['JetBrains_Mono'] border border-[#323843]/50 transition-colors"
                  >
                    Preset: Dawn Sunrise
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDirectorPrompt(
                        'Preserve Scene 12 night storm but inject dry wardrobe coat swap into Scene 14 with optical water erase.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-[#1f2229] hover:bg-[#282c35] text-[#949da8] hover:text-[#e2e2e6] text-[9.5px] font-['JetBrains_Mono'] border border-[#323843]/50 transition-colors"
                  >
                    Preset: Dry Coat Swap
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-orchestrate-revision"
                  onClick={() => onLaunchSimulation?.(directorPrompt)}
                  disabled={isOrchestrating}
                  className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-['Inter'] font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      isOrchestrating ? 'animate-spin' : ''
                    }`}
                  >
                    {isOrchestrating ? 'refresh' : 'auto_awesome'}
                  </span>
                  <span>
                    {isOrchestrating
                      ? 'ORCHESTRATING (GEMINI 3.8 FLASH)...'
                      : 'ORCHESTRATE REVISION WITH GEMINI-3.8-FLASH'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Continuity Ledger & Tactical Repair Dock */}
        <aside className="lg:col-span-3 flex flex-col min-h-0 bg-[#111317] rounded border border-[#282c35] overflow-hidden">
          <div className="p-2 border-b border-[#282c35] bg-[#171a20]/60 flex items-center justify-between shrink-0">
            <div>
              <span className="font-['Inter'] text-[12px] font-bold text-[#e2e5eb] uppercase tracking-wider block">
                CONTINUITY LEDGER
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#949da8] block">
                DOWNSTREAM CASCADE AUDIT
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-red-300 bg-red-500/15 border border-red-500/40 px-1.5 py-0.5 rounded font-bold">
              5 RUPTURES
            </span>
          </div>

          <div className="p-2 bg-[#0a0c0e]/80 border-b border-[#282c35] shrink-0">
            <p className="font-['Inter'] text-[11px] text-[#949da8] leading-snug">
              Moving revelation beat from Scene 12 to Scene 18 triggers the following cascade
              failures across narrative &amp; post pipelines:
            </p>
          </div>

          {/* 5 Downstream Rupture Cards */}
          <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5">
            {/* Rupture 1 */}
            <div className="bg-[#171a20] p-2 rounded border border-red-500/30 hover:border-red-500/60 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-red-400">
                  SCENE 13 · SCRIPT
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                  VIOLATION
                </span>
              </div>
              <p className="font-['Inter'] font-semibold text-[11.5px] text-[#e2e5eb]">
                Dialogue Fact Invalid
              </p>
              <p className="font-['Inter'] text-[10.5px] text-[#949da8] mt-0.5 leading-snug">
                Reese references &quot;your soaked coat&quot; at{' '}
                <span className="font-['JetBrains_Mono'] text-[#38bdf8]">00:14:22:00</span>. Maya
                arrived without the coat under new Scene 18 timing.
              </p>
              <div className="mt-1.5 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#282c35]">
                <span className="text-[#5a6472]">DEPT: SCRIPT / STORY</span>
                <span className="text-red-400 font-semibold">LINE 44 ERR</span>
              </div>
            </div>

            {/* Rupture 2 */}
            <div className="bg-[#171a20] p-2 rounded border border-red-500/30 hover:border-red-500/60 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-red-400">
                  SCENE 14 · WARDROBE
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                  VIOLATION
                </span>
              </div>
              <p className="font-['Inter'] font-semibold text-[11.5px] text-[#e2e5eb]">
                Costume State Invalid
              </p>
              <p className="font-['Inter'] text-[10.5px] text-[#949da8] mt-0.5 leading-snug">
                Costume continuity slate logs Maya at 100% water saturation. Post-shift state dictates
                completely dry base layer.
              </p>
              <div className="mt-1.5 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#282c35]">
                <span className="text-[#5a6472]">DEPT: WARDROBE / PROD</span>
                <span className="text-red-400 font-semibold">LOOK 02-B MISMATCH</span>
              </div>
            </div>

            {/* Rupture 3 */}
            <div className="bg-[#171a20] p-2 rounded border border-red-500/30 hover:border-red-500/60 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-red-400">
                  SCENE 16 · SOUNDTRACK
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                  VIOLATION
                </span>
              </div>
              <p className="font-['Inter'] font-semibold text-[11.5px] text-[#e2e5eb]">
                Music Motif Enters Too Early
              </p>
              <p className="font-['Inter'] text-[10.5px] text-[#949da8] mt-0.5 leading-snug">
                Cue{' '}
                <span className="font-['JetBrains_Mono'] text-[#38bdf8] font-semibold">3M04</span>{' '}
                triggers Maya&apos;s motif 6 minutes before audience revelation is established.
              </p>
              <div className="mt-1.5 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#282c35]">
                <span className="text-[#5a6472]">DEPT: EDITORIAL / SCORE</span>
                <span className="text-red-400 font-semibold">BAR 112 CONFLICT</span>
              </div>
            </div>

            {/* Rupture 4 */}
            <div className="bg-[#171a20] p-2 rounded border border-red-500/30 hover:border-red-500/60 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-red-400">
                  SCENE 17 · NARRATIVE
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                  VIOLATION
                </span>
              </div>
              <p className="font-['Inter'] font-semibold text-[11.5px] text-[#e2e5eb]">
                Character Knowledge Invalid
              </p>
              <p className="font-['Inter'] text-[10.5px] text-[#949da8] mt-0.5 leading-snug">
                Detective Vance acts on manifest discovery prior to its chronological discovery point
                in revised cut sequence.
              </p>
              <div className="mt-1.5 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#282c35]">
                <span className="text-[#5a6472]">DEPT: DIRECTORIAL</span>
                <span className="text-red-400 font-semibold">BEAT #8 LOGIC</span>
              </div>
            </div>

            {/* Rupture 5 */}
            <div className="bg-[#171a20] p-2 rounded border border-red-500/30 hover:border-red-500/60 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-red-400">
                  TAKE 4 · ASSET NEGATIVE
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-red-300 bg-red-500/15 border border-red-500/30 px-1 py-0.2 rounded font-bold">
                  VIOLATION
                </span>
              </div>
              <p className="font-['Inter'] font-semibold text-[11.5px] text-[#e2e5eb]">
                Previously-Shot Negative Invalidated
              </p>
              <p className="font-['Inter'] text-[10.5px] text-[#949da8] mt-0.5 leading-snug">
                Master roll A04_R02_04 contains hard burned prop elements incompatible with downstream
                Scene 18 staging.
              </p>
              <div className="mt-1.5 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] pt-1 border-t border-[#282c35]">
                <span className="text-[#5a6472]">DEPT: LAB / RESHOOT</span>
                <span className="text-red-400 font-semibold">ROLL A04_R02</span>
              </div>
            </div>
          </div>

          {/* Tactical Repair Dock Action Buttons */}
          <div className="p-2 bg-[#171a20] border-t border-[#282c35] flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[10.5px] text-[#e2e5eb] font-semibold uppercase">
                TACTICAL REPAIR DOCK
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                5 ACTIONS PENDING
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onOpenTacticalRepair?.('story')}
                className="bg-[#1f2229] hover:bg-[#282c35] text-[#e2e5eb] p-1.5 rounded border border-[#323843]/60 flex items-center justify-start gap-1.5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#38bdf8] text-[14px]">menu_book</span>
                <span className="font-['Inter'] text-[10.5px] font-medium">REPAIR STORY</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTacticalRepair?.('wardrobe')}
                className="bg-[#1f2229] hover:bg-[#282c35] text-[#e2e5eb] p-1.5 rounded border border-[#323843]/60 flex items-center justify-start gap-1.5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#38bdf8] text-[14px]">checkroom</span>
                <span className="font-['Inter'] text-[10.5px] font-medium">REPAIR WARDROBE</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTacticalRepair?.('visual')}
                className="bg-[#1f2229] hover:bg-[#282c35] text-[#e2e5eb] p-1.5 rounded border border-[#323843]/60 flex items-center justify-start gap-1.5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#38bdf8] text-[14px]">videocam</span>
                <span className="font-['Inter'] text-[10.5px] font-medium">REPAIR VISUAL</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTacticalRepair?.('score')}
                className="bg-[#1f2229] hover:bg-[#282c35] text-[#e2e5eb] p-1.5 rounded border border-[#323843]/60 flex items-center justify-start gap-1.5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#38bdf8] text-[14px]">audiotrack</span>
                <span className="font-['Inter'] text-[10.5px] font-medium">REPAIR SCORE</span>
              </button>
            </div>

            {/* Launch into Active Simulation & Repair Dock */}
            <button
              type="button"
              onClick={() => {
                if (onLaunchSimulation) {
                  onLaunchSimulation(directorPrompt);
                } else {
                  onOpenRepairDock?.();
                }
              }}
              className="w-full bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] font-['Inter'] font-bold text-[11px] py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-colors border border-[#38bdf8]/50 uppercase tracking-wider shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">build_circle</span>
              <span>LAUNCH ACTIVE SIMULATION &amp; REPAIR DOCK</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
