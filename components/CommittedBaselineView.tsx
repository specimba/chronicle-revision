'use client';

import React, { useState } from 'react';
import { AuditReceipt, ClickHouseHealth, LockedInvariant, SceneItem } from '@/lib/types';

interface CommittedBaselineViewProps {
  onUnlockPipeline: () => void;
  onExportEdl: () => void;
  onViewAuditJson: () => void;
  onOpenArchitecture: () => void;
  commitHash?: string;
  sequenceNum?: number;
  health?: ClickHouseHealth | null;
  scenes?: SceneItem[];
  invariants?: LockedInvariant[];
}

export default function CommittedBaselineView({
  onUnlockPipeline,
  onExportEdl,
  onViewAuditJson,
  onOpenArchitecture,
  commitHash = '7f8a92d4cb0912f8832a',
  sequenceNum = 892,
  health,
  scenes: propScenes,
  invariants,
}: CommittedBaselineViewProps) {
  const [activeScene, setActiveScene] = useState<number>(12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCopiedHash, setIsCopiedHash] = useState<boolean>(false);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText?.(commitHash);
    setIsCopiedHash(true);
    setTimeout(() => setIsCopiedHash(false), 1800);
  };

  const receipts: AuditReceipt[] = [
    {
      id: '#13-ADR',
      title: 'Scene 13: Dialogue Fact Cleared',
      department: 'SCRIPT / STORY',
      description:
        'Spoken contradiction eliminated. Trimmed line 4 ADR wild-track injected at TC 01:16:51:14 with matching room impulse response.',
      asset: 'ADR_L4_v2_MIXED.wav',
      badge: 'SHA-256 MATCH',
      status: 'RESOLVED',
    },
    {
      id: '#14-VFX',
      title: 'Scene 14: Costume State Synchronized via AI Dry-Pass VFX',
      department: 'WARDROBE / VFX',
      description:
        'Overcast dampness & pavement puddle reflections scrubbed across 42 frames via planar re-projection. Moisture continuity zeroed.',
      asset: 'EXR_CMP_S14_DRY_v6',
      badge: '42 FRAMES PASS',
      status: 'RESOLVED',
    },
    {
      id: '#16-CUE',
      title: 'Scene 16: Score Motif Resynchronized to Scene 18',
      department: 'EDITORIAL / SCORE',
      description:
        'Score Cue 3M04 detached from vehicle interior. Anchored downstream to Scene 18 slipway gate without acoustic overlap.',
      asset: 'ANCHOR: S18 TC 01:26:12',
      badge: 'COLLISION FREE',
      status: 'RESOLVED',
    },
    {
      id: '#17-LGC',
      title: 'Scene 17: Character Knowledge Reconciled',
      department: 'DIRECTORIAL',
      description:
        'Script trims prevent Maya from prematurely knowing manifest details prior to unsealing the envelope. Chronology validated.',
      asset: 'INVARIANT #02 CHRONO-LOGIC',
      badge: 'VERIFIED OK',
      status: 'RESOLVED',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0b0d10] overflow-hidden select-none">
      {/* SUBHEADER STATUS BAR */}
      <section className="bg-[#121418] border-b border-[#22252a] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-40 shrink-0 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] font-bold text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REVISION COMMITTED</span>
            <span className="text-[#606d79]">/</span>
            <span className="text-emerald-300">PRODUCTION LOCKED</span>
          </div>
          <div className="h-3 w-px bg-[#262930]" />
          <button
            type="button"
            onClick={handleCopyHash}
            className="font-['JetBrains_Mono'] text-[11px] text-[#9ba6b2] hover:text-[#e2e2e6] transition-colors truncate flex items-center gap-1"
            title="Click to copy canonical hash"
          >
            HASH: <span className="text-sky-300">{commitHash.substring(0, 10)}</span>
            {isCopiedHash ? (
              <span className="text-emerald-400 text-[9px]">COPIED</span>
            ) : (
              <span className="material-symbols-outlined text-[12px] text-[#606d79]">content_copy</span>
            )}
            <span>· SHA256 VALIDATED · PROD-CANONICAL</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#181b21] border border-[#282d36] text-sky-300">
            CANONICAL MASTER BASELINE
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-700/50 text-emerald-300">
            {health?.status === 'CONNECTED'
              ? `CLICKHOUSE DB SYNCED (${health.latencyMs}ms)`
              : `CLICKHOUSE: ${health?.status || 'APPEND-ONLY PROVISIONED'}`}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1f2228] text-[#c4e7ff] font-semibold">
            COMMIT #{sequenceNum}-R4
          </span>
        </div>
      </section>

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 grid grid-cols-12 gap-1.5 p-1.5 bg-[#0b0d10] overflow-y-auto max-h-[calc(100vh-56px-32px-44px)]">
        {/* LEFT COLUMN: Reel 04 Scene Strip (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-1.5">
          <div className="bg-[#14171c] border border-[#22252a] px-3 py-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sky-400 text-[18px]">
                view_timeline
              </span>
              <span className="font-['Inter'] text-[12px] uppercase font-bold tracking-wider text-[#e2e2e6]">
                Reel 04 Scene Strip
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-600/30 px-1.5 py-0.5 rounded font-bold">
              8/8 STABLE
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
            {/* Scene 11 */}
            <div
              onClick={() => setActiveScene(11)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 11 · TAKE 01
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#9ba6b2] bg-[#0c0e11] px-1.5 py-0.5 rounded border border-[#262930]">
                  LOCKED
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Industrial Yard - Maya enters perimeter gate
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:11:20:00</span>
                <span className="text-emerald-400/90">IN-CANON</span>
              </div>
            </div>

            {/* Scene 12 (Committed Master) */}
            <div
              onClick={() => setActiveScene(12)}
              className="bg-[#181c24] border-2 border-sky-400/80 p-2.5 rounded shadow-lg shadow-sky-950/40 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-['JetBrains_Mono'] text-[11px] text-sky-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  SCENE 12 · TAKE 04
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.5 rounded font-bold">
                  COMMITTED MASTER
                </span>
              </div>

              {/* Scene Thumbnail Preview */}
              <div className="relative w-full h-20 rounded overflow-hidden mb-1.5 bg-[#0e1013] border border-sky-500/30">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYK0o038J8wc3L6phCHWb08NryLppjEly1cfWJNopQChqJE8L9urMc0GLc21UGcZeFBgSjkmWFXeA3ZHF5AAbXkO07jhEs2KIfrF-ITDxI2gWK7Uy1r7sguQ21C2ScgVP4T-KaqosOU5sms3Hx7j6Uyin3xGJMCOBNESRResTML0hUNPCt-68lDYsZo1OOWo8g_iPlJMjrdczfPdNynLVe_AU4Vgy2ioopzhejUpsmS9fjDc0Hjolkhg"
                  alt="Scene 12 dawn baseline master preview"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[9px] text-amber-300 border border-amber-500/30 font-semibold">
                  05:42 DAWN · BASELINE
                </div>
              </div>

              <p className="font-['Inter'] text-[11px] text-[#e2e2e6] font-medium line-clamp-1">
                Ext. Ferry Pier - Envelope sealed in hand
              </p>
              <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] mt-1 pt-1 border-t border-[#262b35]">
                <span className="text-sky-300 font-semibold">TC 01:14:02:18</span>
                <span className="text-emerald-400 font-bold">BASELINE CANONICAL</span>
              </div>
            </div>

            {/* Scene 13 */}
            <div
              onClick={() => setActiveScene(13)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 13 · TAKE 02
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-sky-300 bg-sky-950/60 border border-sky-600/30 px-1.5 py-0.5 rounded">
                  STABLE · ADR INJECTED
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Interior Warehouse - Maya reveals envelope intact
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:16:44:02</span>
                <span className="text-emerald-400">LOCKED (+1.4s)</span>
              </div>
            </div>

            {/* Scene 14 */}
            <div
              onClick={() => setActiveScene(14)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 14 · TAKE 06
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-amber-300 bg-amber-950/60 border border-amber-600/30 px-1.5 py-0.5 rounded">
                  STABLE · RE-GRADED
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Exterior Alley - VFX dry pavement composite pass
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:18:10:14</span>
                <span className="text-emerald-400">DELTA REMOVED</span>
              </div>
            </div>

            {/* Scene 15 */}
            <div
              onClick={() => setActiveScene(15)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 15 · TAKE 03
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 bg-emerald-950/60 border border-emerald-600/30 px-1.5 py-0.5 rounded">
                  CLEAN
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Harbor Corridor - Foot pursuit wide master
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:19:40:08</span>
                <span className="text-emerald-400">NO DRIFT</span>
              </div>
            </div>

            {/* Scene 16 */}
            <div
              onClick={() => setActiveScene(16)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 16 · TAKE 01
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-sky-300 bg-sky-950/60 border border-sky-600/30 px-1.5 py-0.5 rounded">
                  STABLE · CUE RESYNCED
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Vehicle interior - Radio silence established
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:21:05:08</span>
                <span className="text-emerald-400">3M04 REMOVED</span>
              </div>
            </div>

            {/* Scene 17 */}
            <div
              onClick={() => setActiveScene(17)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 17 · TAKE 03
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-purple-300 bg-purple-950/60 border border-purple-600/30 px-1.5 py-0.5 rounded">
                  STABLE · SCRIPT RE-ORDER
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Ferry Waiting Room - Knowledge paradox resolved
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:23:40:19</span>
                <span className="text-emerald-400">PARADOX FREE</span>
              </div>
            </div>

            {/* Scene 18 */}
            <div
              onClick={() => setActiveScene(18)}
              className="bg-[#14171c] border border-[#22252a] p-2.5 rounded hover:border-[#38bdf8]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] font-semibold">
                  SCENE 18 · TAKE 05
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 bg-emerald-950/60 border border-emerald-600/30 px-1.5 py-0.5 rounded">
                  STABLE · REVEAL ANCHOR
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-[#9ba6b2] line-clamp-1">
                Slipway Gate - Envelope unsealed, Score Cue 3M04 peak
              </p>
              <div className="flex items-center justify-between text-[#606d79] font-['JetBrains_Mono'] text-[10px] mt-1">
                <span>TC 01:26:12:00</span>
                <span className="text-sky-400 font-medium">SYNCHRONIZED</span>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER STAGE: Master Viewport Player + Script Diff + Audio Stem Conflict Docket (6 cols) */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          {/* Master Player Frame */}
          <div className="bg-[#14171c] border border-[#22252a] rounded overflow-hidden flex flex-col">
            {/* Player Top Header Chrome */}
            <div className="bg-[#181b21] px-3 py-1.5 border-b border-[#22252a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-[11px] text-sky-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  CANONICAL REFERENCE CANVAS
                </span>
                <span className="text-[#606d79] text-[10px]">•</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#9ba6b2]">
                  D65 CALIBRATED · REC.709 DCI-P3
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#0e1013] border border-[#262a32] text-sky-300">
                  A/B: COMMITTED (100%)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 font-semibold">
                  GRADE LOCKED
                </span>
                <button
                  type="button"
                  onClick={onOpenArchitecture}
                  className="text-amber-400 hover:text-amber-300 transition-colors p-0.5 flex items-center gap-0.5 ml-1"
                  title="View Authority Graph"
                >
                  <span className="material-symbols-outlined text-[15px]">account_tree</span>
                </button>
              </div>
            </div>

            {/* Video Viewport Display */}
            <div className="relative w-full aspect-[2.39/1] bg-[#000] flex items-center justify-center overflow-hidden group">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7Ym7350kAaD2RbvVuWUh7C8GhgsxN1b5pIP8hhjdBWiCivXFJfYvIBhRVci9qwne9FzW35e9ZU9jo5B5y5scIXfpjSFLm1HRp4v2r_CKgu6-Z4UyI5SWoUtHu8I9rlyf8CBqznPiDSyhu8ew7MI6LXSqxGSOUynzZ2NDZ4-d112YZ3lrh116rPBdME9YAOZstkrgelYpQy4vhhy7q5sB8nFwrJYIPcAS5gWEOvLkwrXpL_gvghvPHFQ"
                alt="Ultra-wide cinematic final graded shot of Maya at dawn ferry pier"
                referrerPolicy="no-referrer"
              />

              {/* In-Canvas Top Overlay */}
              <div className="absolute inset-x-0 top-0 h-9 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-3 py-1.5 flex items-center justify-between pointer-events-none">
                <span className="font-['JetBrains_Mono'] text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur">
                  REEL 04 // S12-TK04 // MASTER COMPOSITE
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold backdrop-blur">
                  FINAL COMMITTED CUT
                </span>
              </div>

              {/* Center Crosshair Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="w-8 h-8 border border-white/40 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                </div>
              </div>

              {/* In-Canvas Bottom Timecode Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur px-3 py-1.5 flex items-center justify-between border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="font-['JetBrains_Mono'] text-[20px] leading-tight text-sky-400 font-bold tracking-tight">
                    01:14:02:18
                  </div>
                  <div className="hidden sm:flex flex-col text-[9px] font-['JetBrains_Mono'] leading-tight text-[#9ba6b2]">
                    <span>RUN: 00:04:12:06</span>
                    <span>HEAD: 01:00:00:00</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[9px]">
                  <span className="bg-[#181b21] text-[#9ba6b2] px-1.5 py-0.5 rounded border border-[#2b303b]">
                    ACEScc v1.3 Graded
                  </span>
                  <span className="bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-600/40">
                    LUT: P3D65_MASTER_04
                  </span>
                  <span className="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-600/40 font-semibold">
                    5.1 MASTER MIX LOCKED
                  </span>
                </div>
              </div>
            </div>

            {/* Transport Scrubber Track */}
            <div className="bg-[#121418] px-3 py-2 border-t border-[#22252a] flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[#9ba6b2] hover:text-sky-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">skip_previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="text-[#9ba6b2] hover:text-sky-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">skip_next</span>
                  </button>
                  <span className="text-[#9ba6b2] text-[10px] ml-2">
                    EDITORIAL TRIM: SYNCHRONIZED
                  </span>
                </div>

                <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px]">
                  <span className="text-emerald-400 font-semibold">CANONICAL BASELINE ANCHORED</span>
                  <span className="text-[#606d79]">|</span>
                  <span className="text-[#9ba6b2]">FRAMES: 2,418</span>
                </div>
              </div>

              {/* Keyframe Markers Track */}
              <div className="relative w-full h-3 bg-[#0a0c0e] rounded border border-[#22252a] overflow-hidden flex items-center">
                <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-sky-500/20 border-r border-sky-400" />
                <div className="absolute left-[15%] w-1 h-full bg-emerald-400" />
                <div className="absolute left-[28%] w-1 h-full bg-amber-400" />
                <div className="absolute left-[42%] w-1.5 h-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                <div className="absolute left-[70%] w-1 h-full bg-emerald-400" />
                <div className="absolute left-[88%] w-1 h-full bg-sky-400" />
              </div>
            </div>
          </div>

          {/* Synchronized Audio Conflict Docket & Stem Waveform */}
          <div className="bg-[#14171c] border border-[#22252a] p-3 rounded flex flex-col gap-2">
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sky-400 text-[16px]">graphic_eq</span>
                <span className="font-semibold text-[#e2e2e6]">
                  SYNCHRONIZED MASTER AUDIO CONFLICT DOCKET
                </span>
              </div>
              <span className="text-emerald-400 font-['JetBrains_Mono'] text-[10px] bg-emerald-950/60 border border-emerald-600/30 px-1.5 py-0.5 rounded font-semibold">
                ALL TRACKS IN-PHASE (5.1 MIX LOCKED)
              </span>
            </div>

            {/* Stems Visualization */}
            <div className="bg-[#0e1013] p-2 rounded border border-[#22252a] flex flex-col gap-2">
              {/* Stem A1 */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#9ba6b2] mb-1">
                  <span className="text-sky-300 font-medium">
                    A1: DIALOGUE (ADR RESTORED · SCENE 13 LINE 4)
                  </span>
                  <span className="text-emerald-400 font-semibold">0.0 LUFS DELTA · PHASE 100%</span>
                </div>
                <div className="h-4 w-full flex items-center gap-0.5 px-1 bg-[#14171c] rounded overflow-hidden">
                  {[2, 4, 5, 3, 2, 4, 5, 3, 1, 2, 1, 4, 5, 4, 3, 4, 5, 4, 2, 4, 5, 3, 2, 1, 4, 5, 3, 2].map((val, i) => (
                    <div
                      key={i}
                      className="w-1 bg-sky-400 rounded-full"
                      style={{ height: `${val * 3}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Stem A2 */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#9ba6b2] mb-1">
                  <span className="text-amber-300 font-medium">
                    A2: SCORE CUE 3M04 (RE-ANCHORED TO SCENE 18)
                  </span>
                  <span className="text-emerald-400 font-['JetBrains_Mono'] text-[9px]">
                    COLLISION SCRUBBED · HIT TC 01:26:12:00
                  </span>
                </div>
                <div className="h-4 w-full flex items-center gap-0.5 px-1 bg-[#14171c] rounded overflow-hidden">
                  {[1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1].map((val, i) => (
                    <div
                      key={i}
                      className="w-1 bg-amber-400 rounded-full"
                      style={{ height: `${val * 3}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canonical Director Sign-off Script Excerpt */}
          <div className="bg-[#14171c] border border-[#22252a] p-3 rounded flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#22252a]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">
                  verified_user
                </span>
                <span className="font-['Inter'] text-[12px] text-[#e2e2e6] uppercase font-bold tracking-wide">
                  CANONICAL DIRECTOR SIGN-OFF · SCRIPT REV V4.2
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 px-1.5 py-0.5 rounded font-semibold">
                SIGNATURE VERIFIED
              </span>
            </div>

            <div className="bg-[#0e1013] border border-[#22252a] p-2.5 rounded flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-['Newsreader'] text-[13px] text-[#e2e2e6] font-bold uppercase tracking-wider">
                  EXT. ALLEYWAY / WHARF — DAWN
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-sky-400">
                  SCENE 12 · REVISION #DAWN-COMMITTED
                </span>
              </div>
              <p className="font-['Newsreader'] text-[12.5px] leading-relaxed text-[#c5cdd8] italic">
                Maya pauses on the dry timber pier. The harbor fog is thin and golden with first
                light. Her fingers remain securely wrapped around the unopened envelope, wax
                unbroken against the harbor salt air.
              </p>

              <div className="p-2 bg-[#181b21] rounded border-l-2 border-emerald-400 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[13px]">
                    lock_clock
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 font-bold uppercase">
                    INVARIANT CONSTRAINT #01 LOCKED
                  </span>
                </div>
                <p className="font-['Inter'] text-[11px] text-[#e2e2e6]">
                  &quot;The brown envelope must remain sealed in Maya&apos;s hand until she crosses the
                  turnstile in Scene 18. This invariant is physically validated in Take 4 composite.&quot;
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#1f2228] text-[#9ba6b2] font-['JetBrains_Mono'] text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[#e2e2e6] font-medium">DIRECTOR SIGN-OFF: J. AUSTIN</span>
                  <span className="text-[#606d79]">·</span>
                  <span>VFX SUP: T. LINN</span>
                </div>
                <span className="text-sky-300">2024-10-28 06:14:02 UTC</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Continuity Audit Inspector (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-1.5">
          <div className="bg-[#14171c] border border-[#22252a] px-3 py-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">
                task_alt
              </span>
              <span className="font-['Inter'] text-[12px] uppercase font-bold tracking-wider text-[#e2e2e6]">
                Continuity Audit
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
              4/4 RESOLVED
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {receipts.map((r) => (
              <div
                key={r.id}
                className="bg-[#14171c] border border-[#22252a] p-2.5 rounded flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-sky-400 font-semibold">
                    AUDIT RECEIPT {r.id}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.5 rounded font-bold">
                    RESOLVED
                  </span>
                </div>

                <span className="font-['Inter'] font-bold text-[12px] text-[#e2e2e6]">
                  {r.title}
                </span>

                <p className="font-['Inter'] text-[11px] text-[#9ba6b2] leading-snug">
                  {r.description}
                </p>

                <div className="bg-[#0e1013] p-1.5 rounded font-['JetBrains_Mono'] text-[9px] text-[#606d79] flex justify-between border border-[#22252a] mt-0.5">
                  <span className="text-[#9ba6b2] truncate max-w-[170px]">{r.asset}</span>
                  <span className="text-emerald-400 font-semibold">{r.badge}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Dispatch Action Buttons */}
          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={onExportEdl}
              className="w-full bg-[#181b21] hover:bg-[#22252d] border border-sky-500/40 text-sky-300 px-3 py-2 rounded font-['Inter'] font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-sky-400">output</span>
              <span>EXPORT EDL / ALE TO AVID &amp; RESOLVE</span>
            </button>

            <button
              type="button"
              onClick={onViewAuditJson}
              className="w-full bg-[#14171c] hover:bg-[#1a1e24] border border-[#262a32] text-[#9ba6b2] hover:text-[#e2e2e6] px-3 py-1.5 rounded font-['Inter'] text-[11px] flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">receipt_long</span>
              <span>VIEW COMPLETE AUDIT LOG (JSON)</span>
            </button>
          </div>
        </section>
      </div>

      {/* BOTTOM SUMMARY FOOTER */}
      <footer className="h-11 bg-[#0c0e11] border-t border-[#22252a] px-4 flex flex-wrap items-center justify-between text-xs shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              account_balance_wallet
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#9ba6b2]">
              COST DELTA: <span className="text-emerald-400 font-semibold">$4,200</span>
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#262930]" />

          <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] text-[#9ba6b2]">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">schedule</span>
            <span>
              SCHEDULE IMPACT: <span className="text-emerald-400 font-semibold">0 DAYS DELAY</span>
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#262930] hidden md:block" />

          <div className="hidden md:flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] text-[#9ba6b2]">
            <span className="material-symbols-outlined text-[15px] text-sky-400">auto_awesome</span>
            <span>
              NARRATIVE FIDELITY: <span className="text-sky-300 font-semibold">98% ACHIEVED</span>
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#262930] hidden lg:block" />

          <span className="hidden lg:inline text-[11px] text-[#606d79] font-['JetBrains_Mono']">
            LEAD EDITOR &amp; VFX SUP SIGNED OFF
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUnlockPipeline}
            className="bg-[#14171c] hover:bg-[#1c2027] border border-[#2a2f38] text-[#9ba6b2] hover:text-[#e2e2e6] px-2.5 py-1 rounded font-['Inter'] text-[11px] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">lock_open</span>
            <span>UNLOCK PIPELINE (SUPER-ADMIN)</span>
          </button>

          <button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-1 rounded font-['Inter'] font-bold text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>MASTER CUT SYNCED &amp; PUBLISHED</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
