'use client';

import React from 'react';

interface MiniActivityRailProps {
  activeTab?: string;
  activeTool?: string;
  onSelectTab?: (tab: string) => void;
  onSelectTool?: (tool: string) => void;
  onOpenScopes?: () => void;
  onOpenArchitecture?: () => void;
}

export default function MiniActivityRail({
  activeTab,
  activeTool,
  onSelectTab,
  onSelectTool,
  onOpenScopes,
  onOpenArchitecture,
}: MiniActivityRailProps) {
  const currentTool = activeTool || activeTab || 'timeline';
  const handleSelect = (tool: string) => {
    onSelectTool?.(tool);
    onSelectTab?.(tool);
  };
  return (
    <aside className="w-11 bg-[#111317] border-r border-[#262a32] flex flex-col items-center py-2.5 shrink-0 gap-2 z-20 select-none">
      <button
        onClick={() => handleSelect('timeline')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
          currentTool === 'timeline' || currentTool === 'continuity'
            ? 'bg-[#1f2229] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
            : 'text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6]'
        }`}
        title="Master Scene Strip & Revision Timeline"
      >
        <span className="material-symbols-outlined text-[18px]">movie</span>
      </button>

      <button
        onClick={() => handleSelect('script')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
          currentTool === 'script'
            ? 'bg-[#1f2229] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
            : 'text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6]'
        }`}
        title="Continuity Script Diff & Supervisor Ledger"
      >
        <span className="material-symbols-outlined text-[18px]">description</span>
      </button>

      <button
        onClick={() => {
          handleSelect('architecture');
          onOpenArchitecture?.();
        }}
        className="w-8 h-8 rounded text-amber-400 hover:bg-[#16181d] hover:text-amber-300 flex items-center justify-center transition-colors"
        title="Authority Architecture & Bounded 3-Hop Ripple Graph"
      >
        <span className="material-symbols-outlined text-[18px]">account_tree</span>
      </button>

      <button
        onClick={() => handleSelect('audio')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
          currentTool === 'audio'
            ? 'bg-[#1f2229] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
            : 'text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6]'
        }`}
        title="Audio Spectral Re-Anchor & Stem Monitor"
      >
        <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
      </button>

      <button
        onClick={() => handleSelect('diagnostics')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
          currentTool === 'diagnostics'
            ? 'bg-[#1f2229] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
            : 'text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6]'
        }`}
        title="Runtime Diagnostics & MCP Subsystem Audit"
      >
        <span className="material-symbols-outlined text-[18px]">analytics</span>
      </button>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => {
            handleSelect('scopes');
            onOpenScopes?.();
          }}
          className="w-8 h-8 rounded text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6] flex items-center justify-center transition-colors"
          title="D65 Reference Scopes"
        >
          <span className="material-symbols-outlined text-[18px]">equalizer</span>
        </button>

        <button
          onClick={() => onSelectTab?.('settings')}
          className="w-8 h-8 rounded text-[#949da8] hover:bg-[#16181d] hover:text-[#e2e2e6] flex items-center justify-center transition-colors"
          title="Workstation System Settings"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>
    </aside>
  );
}
