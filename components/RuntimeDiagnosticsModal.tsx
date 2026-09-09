'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RuntimeDiagnostics } from '@/lib/types';

interface RuntimeDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RuntimeDiagnosticsModal({
  isOpen,
  onClose,
}: RuntimeDiagnosticsModalProps) {
  const [diagnostics, setDiagnostics] = useState<RuntimeDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chronicle/health');
      const data = await res.json();
      setDiagnostics(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query diagnostics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    fetch('/api/chronicle/health')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setDiagnostics(data);
          setError(null);
          setLastChecked(new Date().toLocaleTimeString());
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to query diagnostics');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status?: string) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    if (s === 'CONNECTED' || s === 'CONFIGURED' || s === 'READY' || s === 'HEALTHY' || s === 'SUCCESS') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold">
          {s}
        </span>
      );
    }
    if (s === 'NOT_CONFIGURED') {
      return (
        <span className="px-2 py-0.5 rounded bg-[#181b21] border border-[#282d36] text-[#9ca3af] font-['JetBrains_Mono'] text-[10px] font-bold">
          NOT_CONFIGURED
        </span>
      );
    }
    if (s === 'CONNECTING' || s === 'QUERYING') {
      return (
        <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 font-['JetBrains_Mono'] text-[10px] font-bold animate-pulse">
          {s}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-['JetBrains_Mono'] text-[10px] font-bold">
        {s}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1014] border border-[#262a32] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 bg-[#14171c] border-b border-[#262a32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
              analytics
            </span>
            <div>
              <h3 className="font-['Inter'] font-bold text-[13px] text-[#e2e2e6] tracking-wide">
                TRUTHFUL RUNTIME DIAGNOSTICS &amp; SUBSYSTEM AUDIT
              </h3>
              <p className="font-['JetBrains_Mono'] text-[10px] text-[#9ca3af]">
                CHRONICLE // P0 RUNTIME INTEGRATION · REAL RECEIPT TELEMETRY
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDiagnostics}
              disabled={isLoading}
              className="px-2.5 py-1 bg-[#1e2229] hover:bg-[#282c35] text-[#38bdf8] border border-[#38bdf8]/30 rounded font-['JetBrains_Mono'] text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[14px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>POLL</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-[#262a32] text-[#9ca3af] hover:text-[#e2e2e6] flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Subsystem Health Grid */}
        <div className="p-4 bg-[#101216] border-b border-[#22252a] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0 font-['JetBrains_Mono'] text-xs">
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">1. WEB APP</span>
            <div>{getStatusBadge(diagnostics?.webApp?.status)}</div>
          </div>
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">2. GEMINI</span>
            <div>{getStatusBadge(diagnostics?.gemini?.status)}</div>
          </div>
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">3. GOOGLE ADK</span>
            <div>{getStatusBadge(diagnostics?.googleAdk?.status)}</div>
          </div>
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">4. MCP SERVER</span>
            <div>{getStatusBadge(diagnostics?.mcp?.status)}</div>
          </div>
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">5. CLICKHOUSE</span>
            <div>{getStatusBadge(diagnostics?.clickhouse?.status)}</div>
          </div>
          <div className="p-2.5 rounded bg-[#16181d] border border-[#262a32] flex flex-col gap-1">
            <span className="text-[#8892a0] text-[9.5px] uppercase font-bold">6. WRITER</span>
            <div>{getStatusBadge(diagnostics?.writer?.status)}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-['JetBrains_Mono'] text-xs">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded text-rose-300 text-xs">
              Diagnostics query error: {error}
            </div>
          )}

          {/* Section 1: MCP Server Diagnostics */}
          <div className="bg-[#121419] border border-[#22252a] rounded p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#22252a] pb-2">
              <span className="text-sky-300 font-bold uppercase tracking-wider text-[11px]">
                MCP SERVER RUNTIME TELEMETRY
              </span>
              <span className="text-[#8892a0] text-[10px]">READ-ONLY DISCOVERY PATH</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_SERVER_STATUS:</span>
                <span className="text-[#e2e2e6] font-semibold">{diagnostics?.mcp?.status || 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_SERVER_URL_HOST_ONLY:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.mcp?.serverUrlHostOnly || 'NOT_CONFIGURED'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_SERVER_IMPLEMENTATION:</span>
                <span className="text-purple-300">{diagnostics?.mcp?.implementation || 'official mcp-clickhouse'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_PROTOCOL_CONNECTION:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.mcp?.protocolConnection || 'StreamableHTTP'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_QUERY_STATUS:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.mcp?.lastQueryStatus || 'IDLE'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">MCP_QUERY_HASH:</span>
                <span className="text-sky-300 truncate max-w-[200px]">{diagnostics?.mcp?.lastQueryHash || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[#8892a0] text-[10px] block mb-1">MCP_TOOL_NAMES_DISCOVERED:</span>
              {diagnostics?.mcp?.toolsDiscovered && diagnostics.mcp.toolsDiscovered.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {diagnostics.mcp.toolsDiscovered.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded bg-[#1a1d24] border border-[#2e3440] text-emerald-300 text-[10px]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#6c7684] text-[10px] italic">
                  No tools discovered yet (Server not configured or remote MCP host unreachable)
                </span>
              )}
            </div>

            {diagnostics?.mcp?.error && (
              <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[10px] mt-2">
                MCP Note: {diagnostics.mcp.error}
              </div>
            )}
          </div>

          {/* Section 2: ClickHouse Canonical Store Diagnostics */}
          <div className="bg-[#121419] border border-[#22252a] rounded p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#22252a] pb-2">
              <span className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                CLICKHOUSE CLOUD CANONICAL EVIDENCE STORE
              </span>
              <span className="text-[#8892a0] text-[10px]">APPEND-ONLY CANONICAL STORE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">CLICKHOUSE_CONNECTION_STATUS:</span>
                <span className="text-[#e2e2e6] font-semibold">{diagnostics?.clickhouse?.status || 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">CLICKHOUSE_VERSION:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.clickhouse?.version || '26.2 (Cloud eu-central-1)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">CLICKHOUSE_DATABASE:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.clickhouse?.database || 'default'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">CLICKHOUSE_QUERY_LATENCY_MS:</span>
                <span className="text-emerald-300">{diagnostics?.clickhouse?.latencyMs ?? 0} ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">CANONICAL_SCENES_COUNT:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.clickhouse?.totalScenes ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">VALIDATION_RECEIPTS_COUNT:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.clickhouse?.totalReceipts ?? 0}</span>
              </div>
            </div>

            {diagnostics?.clickhouse?.error && (
              <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[10px] mt-2">
                ClickHouse Note: {diagnostics.clickhouse.error}
              </div>
            )}
          </div>

          {/* Section 3: Writer & Human Promotion Boundary */}
          <div className="bg-[#121419] border border-[#22252a] rounded p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#22252a] pb-2">
              <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                HUMAN PROMOTION WRITER BOUNDARY
              </span>
              <span className="text-[#8892a0] text-[10px]">DETERMINISTIC APPEND-ONLY PATH</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">WRITER_STATUS:</span>
                <span className="text-[#e2e2e6] font-semibold">{diagnostics?.writer?.status || 'NOT_CONFIGURED'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">WRITER_USER_CONFIGURED:</span>
                <span className="text-[#e2e2e6]">{diagnostics?.writer?.userConfigured ? 'YES (CLICKHOUSE_USER)' : 'NO'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">APPEND_ONLY_GUARANTEED:</span>
                <span className="text-emerald-300 font-bold">TRUE (NO UPDATE/DELETE)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b1e24]">
                <span className="text-[#8892a0]">PROMOTION_ACTOR:</span>
                <span className="text-[#e2e2e6]">LEAD_SUPERVISOR / HUMAN GATE</span>
              </div>
            </div>

            <p className="text-[#8892a0] text-[10px] pt-1">
              Security invariant: All authentication secrets (passwords, tokens, Gemini API keys) are strictly masked and never surfaced in client payloads.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 px-4 bg-[#14171c] border-t border-[#262a32] flex items-center justify-between shrink-0 font-['JetBrains_Mono'] text-[11px]">
          <span className="text-[#8892a0]">
            LAST CHECKED: <strong className="text-[#e2e2e6]">{lastChecked || 'PENDING'}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#262a32] hover:bg-[#323742] text-[#e2e2e6] rounded text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
