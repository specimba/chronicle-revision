'use client';

import React from 'react';
import { WorkstationView, ClickHouseHealth } from '@/lib/types';

interface StudioHeaderProps {
  currentView?: WorkstationView;
  activeView?: WorkstationView;
  onSelectView: (view: WorkstationView) => void;
  onOpenArchitecture: () => void;
  onOpenDiagnostics?: () => void;
  isCommitted?: boolean;
  health?: ClickHouseHealth | null;
  geminiStatus?: { status: string; model: string } | null;
}

export default function StudioHeader({
  currentView,
  activeView,
  onSelectView,
  onOpenArchitecture,
  onOpenDiagnostics,
  isCommitted: isCommittedProp,
  health,
  geminiStatus,
}: StudioHeaderProps) {
  const effectiveView = activeView || currentView || 'production';
  const isCommitted = isCommittedProp !== undefined ? isCommittedProp : effectiveView === 'committed';
  return (
    <header className="h-12 shrink-0 bg-[#111317] border-b border-[#262a32] px-3 flex items-center justify-between z-50 select-none">
      {/* Left Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectView('production')}>
          <div
            className={`w-2.5 h-2.5 rounded-sm ${
              isCommitted
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : 'bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]'
            }`}
          />
          <span className="font-['Inter'] text-[13px] tracking-wider text-[#e2e2e6] uppercase font-bold whitespace-nowrap">
            CHRONICLE <span className="text-[#5a6472]">{'//'}</span>{' '}
            {isCommitted ? 'REVISION GRAPH' : 'REVISION'}
          </span>
        </div>

        <div className="h-4 w-px bg-[#262a32] hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] text-[#949da8]">
          <span className="text-[#38bdf8] font-semibold">REEL 04</span>
          <span>·</span>
          <span className="text-[#e2e2e6]">SEQ 03</span>
          <span>·</span>
          <span className="text-[#949da8] truncate max-w-[150px]">THE FERRY REACH</span>
        </div>

        <div className="h-4 w-px bg-[#262a32] hidden lg:block" />

        <div className="hidden lg:flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] bg-[#16181d] px-2 py-0.5 rounded border border-[#262a32] text-[#949da8]">
          <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">alt_route</span>
          <span className={isCommitted ? 'text-emerald-400' : 'text-[#38bdf8]'}>
            {isCommitted ? 'main/cut-v3.4-s12-dawn-integrated' : 'main/cut-v3.4-baseline'}
          </span>
        </div>

        {isCommitted && (
          <div className="hidden xl:flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 font-semibold">
            <span className="material-symbols-outlined text-[12px] text-emerald-400">task_alt</span>
            <span>4/4 INVARIANTS SATISFIED · 0 VIOLATIONS</span>
          </div>
        )}
      </div>

      {/* Center Nav Tabs */}
      <nav className="flex items-center h-full gap-0.5">
        <button
          onClick={() => onSelectView('production')}
          className={`h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] uppercase tracking-wider transition-colors ${
            effectiveView === 'production'
              ? 'bg-[#1f2229] text-[#38bdf8] border-b-2 border-[#38bdf8]'
              : 'text-[#949da8] hover:text-[#e2e2e6]'
          }`}
        >
          PRODUCTION STATE
        </button>

        <button
          onClick={() => onSelectView('simulation')}
          className={`h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] uppercase tracking-wider transition-colors ${
            effectiveView === 'simulation'
              ? 'bg-[#1f2229] text-[#38bdf8] border-b-2 border-[#38bdf8]'
              : 'text-[#949da8] hover:text-[#e2e2e6]'
          }`}
        >
          ACTIVE SIMULATION
          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] rounded font-['JetBrains_Mono']">
            SIM
          </span>
        </button>

        <button
          onClick={() => onSelectView('committed')}
          className={`h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] uppercase tracking-wider transition-colors ${
            effectiveView === 'committed'
              ? 'bg-[#1f2229] text-emerald-400 border-b-2 border-emerald-400'
              : 'text-[#949da8] hover:text-[#e2e2e6]'
          }`}
        >
          COMMITTED BASELINE
          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 rounded font-['JetBrains_Mono'] font-bold">
            CANON
          </span>
        </button>

        <button
          id="nav-google-drive"
          onClick={() => onSelectView('drive')}
          className={`h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] uppercase tracking-wider transition-colors ${
            effectiveView === 'drive'
              ? 'bg-[#1f2229] text-blue-400 border-b-2 border-blue-400'
              : 'text-[#949da8] hover:text-[#e2e2e6]'
          }`}
        >
          GOOGLE DRIVE
          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-blue-950/80 text-blue-400 border border-blue-600/40 rounded font-['JetBrains_Mono'] font-bold">
            PICKER
          </span>
        </button>

        <button
          id="nav-gemini-studio"
          onClick={() => onSelectView('gemini_studio')}
          className={`h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] uppercase tracking-wider transition-colors ${
            effectiveView === 'gemini_studio'
              ? 'bg-[#1f2229] text-amber-400 border-b-2 border-amber-400'
              : 'text-[#949da8] hover:text-[#e2e2e6]'
          }`}
        >
          GEMINI STUDIO
          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-amber-950/80 text-amber-400 border border-amber-600/40 rounded font-['JetBrains_Mono'] font-bold">
            AI LAB
          </span>
        </button>

        <button
          onClick={() => onSelectView('production')}
          className="h-full px-3.5 flex items-center font-['Inter'] font-semibold text-[11.5px] text-[#949da8] hover:text-[#e2e2e6] transition-colors tracking-wider uppercase"
        >
          CONTINUITY LEDGER
        </button>

        {/* Bounded 3-Hop Authority Architecture Quick Button */}
        <button
          onClick={onOpenArchitecture}
          className="h-7 px-2 ml-1 hidden md:flex items-center gap-1.5 rounded bg-[#1f2229] hover:bg-[#282c35] text-amber-400 border border-amber-500/40 text-[10.5px] font-['JetBrains_Mono'] transition-colors"
          title="Inspect Bounded 3-Hop MCP Ripple Architecture"
        >
          <span className="material-symbols-outlined text-[13px]">account_tree</span>
          <span>3-HOP RIPPLE</span>
        </button>

        {/* Runtime Diagnostics Surface Quick Button */}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="h-7 px-2 ml-1 hidden lg:flex items-center gap-1.5 rounded bg-[#161a22] hover:bg-[#222733] text-sky-400 border border-sky-500/40 text-[10.5px] font-['JetBrains_Mono'] transition-colors"
            title="Inspect Truthful Runtime Diagnostics (MCP / ClickHouse / ADK)"
          >
            <span className="material-symbols-outlined text-[13px]">analytics</span>
            <span>DIAGNOSTICS</span>
          </button>
        )}
      </nav>

      {/* Right Telemetry & Status */}
      <div className="flex items-center gap-2.5">
        {/* Real ClickHouse Status Pill */}
        {health && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className={`hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded border font-['JetBrains_Mono'] text-[10px] cursor-pointer hover:brightness-110 transition-all ${
              health.status === 'CONNECTED'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
            title={`ClickHouse Host: ${health.host} (${health.latencyMs}ms latency) - Click for Diagnostics`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-bold">CH: {health.status}</span>
            {health.status === 'CONNECTED' && (
              <span className="text-emerald-400/80">{health.latencyMs}ms</span>
            )}
          </button>
        )}

        {/* Real Gemini Status Pill */}
        {geminiStatus && (
          <div
            className={`hidden 2xl:flex items-center gap-1.5 px-2 py-0.5 rounded border font-['JetBrains_Mono'] text-[10px] ${
              geminiStatus.status === 'CONFIGURED'
                ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                : 'bg-[#181a20] border-[#323843] text-[#9ca3af]'
            }`}
          >
            <span className="text-sky-400 font-semibold">{geminiStatus.model}</span>
            <span className="text-[#606d79]">·</span>
            <span className={geminiStatus.status === 'CONFIGURED' ? 'text-sky-300' : 'text-amber-400'}>
              {geminiStatus.status}
            </span>
          </div>
        )}

        <div className="hidden md:flex items-center bg-[#0a0c0e] px-2.5 py-1 rounded border border-[#262a32] gap-2 font-['JetBrains_Mono'] text-[11px]">
          <span className="text-[#38bdf8] font-semibold tracking-tight">
            {isCommitted ? '01:14:02:18' : '03:14:22:00'}
          </span>
          <span className="text-[#4b5563]">|</span>
          <span className="text-[#949da8]">23.976 FPS</span>
          <span className="text-[#4b5563]">|</span>
          <span className="text-amber-400">ACEScc Rec.709</span>
        </div>

        {isCommitted ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 font-['JetBrains_Mono'] text-[10px] text-emerald-300 font-bold">
            <span className="material-symbols-outlined text-[12px] text-emerald-400">lock</span>
            <span>PROD LOCKED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#16181d] border border-[#262a32] font-['JetBrains_Mono'] text-[10px] text-amber-400 font-bold">
            <span className="material-symbols-outlined text-[12px]">lock</span>
            <span>LOCKED</span>
          </div>
        )}

        <div className="w-7 h-7 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] font-semibold text-xs">
          {isCommitted ? 'JA' : 'DR'}
        </div>
      </div>
    </header>
  );
}
