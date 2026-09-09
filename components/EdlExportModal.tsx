'use client';

import React, { useState } from 'react';

interface EdlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EdlExportModal({ isOpen, onClose }: EdlExportModalProps) {
  const [format, setFormat] = useState<'edl' | 'ale' | 'fcp'>('edl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const edlText = `TITLE: REEL_04_REVISION_COMMITTED_7F8A92
FCM: NON-DROP FRAME

001  REEL04_SC11_TK01 V     C        01:11:20:00 01:14:02:18 01:00:00:00 01:02:42:18
* FROM CLIP NAME: SC11_MAYA_PERIMETER_GATE.MOV
* COMMENT: IN-CANON BASELINE

002  REEL04_SC12_TK04 V     C        01:14:02:18 01:16:44:02 01:02:42:18 01:05:24:02
* FROM CLIP NAME: SC12_PIERHEAD_DAWN_COMMITTED.MOV
* COMMENT: REVISED SUNRISE COMPOSITE // CANDIDATE A
* REVISION HASH: 7f8a92d4cb0912f8832a

003  REEL04_SC13_TK02 V     C        01:16:44:02 01:18:10:14 01:05:24:02 01:06:50:14
003  REEL04_SC13_TK02 A1A2  C        01:16:44:02 01:18:10:14 01:05:24:02 01:06:50:14
* FROM CLIP NAME: SC13_MAYA_TICKET_BOOTH.MOV
* AUDIO: TK-13-ADR-04 INJECTED AT TC 01:16:51:14

004  REEL04_SC14_TK06 V     C        01:18:10:14 01:19:40:08 01:06:50:14 01:08:20:08
* FROM CLIP NAME: SC14_PIER_RAMP_DESCENTS.MOV
* VFX: DRY PAVEMENT PASS // MOISTURE DELTA ZEROED

005  REEL04_SC18_TK05 A3A4  C        01:26:12:00 01:28:40:00 01:15:00:00 01:17:28:00
* FROM CLIP NAME: SCORE_CUE_3M04_SUNRISE_STRING_CADENCE.WAV
* CUE RE-ANCHOR: FRAME #18,344 COLLISION OFFSET: 0.00ms
`;

  const aleText = `Heading
FIELD_DELIM	TABS
VIDEO_FORMAT	1080
FILM_FORMAT	35mm
FPS	24

Column
Name	Tracks	Start	End	Duration	Reel	Scene	Take	Comments
SC11_TK01	VA1-A2	01:11:20:00	01:14:02:18	00:02:42:18	R4	11	1	LOCKED_BASELINE
SC12_TK04	VA1-A4	01:14:02:18	01:16:44:02	00:02:41:08	R4	12	4	COMMITTED_DAWN_MASTER
SC13_TK02	VA1-A4	01:16:44:02	01:18:10:14	00:01:26:12	R4	13	2	ADR_INJECTED
SC14_TK06	VA1-A2	01:18:10:14	01:19:40:08	00:01:29:18	R4	14	6	RE_GRADED_DRY_PASS
SC18_TK05	VA1-A8	01:26:12:00	01:28:40:00	00:02:28:00	R4	18	5	CUE_3M04_REANCHORED

Data
`;

  const activeContent = format === 'edl' ? edlText : aleText;

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([activeContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `REEL_04_COMMITTED_${format.toUpperCase()}.${format === 'ale' ? 'ale' : 'edl'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111316] border border-[#262a32] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-11 px-4 bg-[#16181d] border-b border-[#262a32] flex items-center justify-between shrink-0 font-['Inter']">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">
              output
            </span>
            <span className="font-bold text-[13px] text-[#e2e2e6] tracking-wide">
              EXPORT CONFORM EDL / ALE TO NLE SYSTEMS
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

        {/* Format Selector Bar */}
        <div className="px-4 py-2 bg-[#16181d]/80 border-b border-[#262a32] flex items-center justify-between font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#9ca3af]">TARGET NLE FORMAT:</span>
            <button
              type="button"
              onClick={() => setFormat('edl')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                format === 'edl'
                  ? 'bg-[#38bdf8] text-[#00283b]'
                  : 'bg-[#262a32] text-[#e2e2e6] hover:bg-[#323742]'
              }`}
            >
              CMX 3600 EDL (Resolve / Avid / Premiere)
            </button>
            <button
              type="button"
              onClick={() => setFormat('ale')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                format === 'ale'
                  ? 'bg-[#38bdf8] text-[#00283b]'
                  : 'bg-[#262a32] text-[#e2e2e6] hover:bg-[#323742]'
              }`}
            >
              Avid Log Exchange (ALE)
            </button>
          </div>
          <span className="text-emerald-400 text-[10px] font-bold">SHA-256 CONFORM OK</span>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto bg-[#0a0c0f] flex-1">
          <pre className="font-['JetBrains_Mono'] text-[11px] text-[#e2e2e6] whitespace-pre leading-relaxed">
            {activeContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="h-11 px-4 bg-[#16181d] border-t border-[#262a32] flex items-center justify-between shrink-0 font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 bg-[#1e2128] hover:bg-[#262a32] text-[#38bdf8] border border-[#38bdf8]/40 rounded flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>DOWNLOAD FILE</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
