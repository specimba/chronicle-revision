'use client';

import React from 'react';

interface VideoScopesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoScopesModal({ isOpen, onClose }: VideoScopesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111316] border border-[#262a32] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-11 px-4 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-['Inter']">
            <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">
              query_stats
            </span>
            <span className="font-bold text-[13px] text-[#e2e2e6] tracking-wide">
              COLOR &amp; CONTINUITY TELEMETRY SCOPES (D65 / REC.709)
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto font-['JetBrains_Mono'] text-xs">
          {/* Waveform RGB Parade */}
          <div className="bg-[#0a0c0f] border border-[#262a32] rounded p-3 flex flex-col">
            <div className="flex items-center justify-between text-[#9ca3af] text-[10px] mb-2">
              <span className="text-[#38bdf8] font-bold">RGB PARADE (IRE 0 - 100)</span>
              <span>IRE 100 CLIP: 0.0%</span>
            </div>
            <div className="h-40 bg-[#06080a] border border-[#1f2228] rounded flex items-center justify-around px-2 relative overflow-hidden">
              {/* 100 IRE Line */}
              <div className="absolute top-2 inset-x-0 border-b border-dashed border-[#262a32] text-[8px] text-[#4b5563] px-1">
                100 IRE
              </div>
              {/* 50 IRE Line */}
              <div className="absolute top-1/2 inset-x-0 border-b border-dashed border-[#262a32] text-[8px] text-[#4b5563] px-1">
                50 IRE
              </div>
              {/* 0 IRE Line */}
              <div className="absolute bottom-2 inset-x-0 border-b border-dashed border-[#262a32] text-[8px] text-[#4b5563] px-1">
                0 IRE
              </div>

              {/* Red Scope */}
              <div className="flex flex-col items-center">
                <span className="text-rose-400 text-[9px] font-bold mb-1">R</span>
                <svg className="w-20 h-28 text-rose-500" viewBox="0 0 100 100">
                  <path
                    d="M 10 90 Q 25 30 50 45 T 90 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                  <path
                    d="M 10 85 Q 35 40 50 60 T 90 35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                </svg>
              </div>

              {/* Green Scope */}
              <div className="flex flex-col items-center">
                <span className="text-emerald-400 text-[9px] font-bold mb-1">G</span>
                <svg className="w-20 h-28 text-emerald-500" viewBox="0 0 100 100">
                  <path
                    d="M 10 92 Q 30 45 50 50 T 90 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                  <path
                    d="M 10 88 Q 30 60 50 65 T 90 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                </svg>
              </div>

              {/* Blue Scope */}
              <div className="flex flex-col items-center">
                <span className="text-sky-400 text-[9px] font-bold mb-1">B</span>
                <svg className="w-20 h-28 text-sky-500" viewBox="0 0 100 100">
                  <path
                    d="M 10 80 Q 25 60 50 60 T 90 55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                  />
                  <path
                    d="M 10 75 Q 35 70 50 72 T 90 62"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Vectorscope */}
          <div className="bg-[#0a0c0f] border border-[#262a32] rounded p-3 flex flex-col">
            <div className="flex items-center justify-between text-[#9ca3af] text-[10px] mb-2">
              <span className="text-[#38bdf8] font-bold">VECTORSCOPE CHROMA</span>
              <span className="text-amber-400">SKIN-TONE AXIS: 135° PASS</span>
            </div>
            <div className="h-40 bg-[#06080a] border border-[#1f2228] rounded flex items-center justify-center relative">
              <svg className="w-36 h-36" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#262a32" strokeWidth="1" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#1f2228" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="#262a32" strokeWidth="0.8" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="#262a32" strokeWidth="0.8" />
                {/* Skin Tone Indicator Line */}
                <line x1="50" y1="50" x2="18" y2="18" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />
                {/* Chroma cloud */}
                <ellipse cx="44" cy="38" rx="14" ry="10" fill="#38bdf8" fillOpacity="0.3" />
                <ellipse cx="40" cy="35" rx="7" ry="5" fill="#f59e0b" fillOpacity="0.5" />
              </svg>
              <div className="absolute bottom-2 right-2 text-[9px] text-[#4b5563]">
                SAT: 68% // HUE: 28°
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 px-4 bg-[#16181d] border-t border-[#262a32] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded text-xs transition-colors font-['JetBrains_Mono']"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
