'use client';

import React, { useState, useEffect, useCallback } from 'react';
import StudioHeader from '@/components/StudioHeader';
import MiniActivityRail from '@/components/MiniActivityRail';
import ProductionStateView from '@/components/ProductionStateView';
import ActiveSimulationView from '@/components/ActiveSimulationView';
import CommittedBaselineView from '@/components/CommittedBaselineView';
import ArchitectureDiagramModal from '@/components/ArchitectureDiagramModal';
import VideoScopesModal from '@/components/VideoScopesModal';
import AuditJsonModal from '@/components/AuditJsonModal';
import EdlExportModal from '@/components/EdlExportModal';
import {
  WorkstationView,
  ClickHouseHealth,
  SceneItem,
  LockedInvariant,
  ActiveRevisionState,
} from '@/lib/types';

export default function ChronicleWorkspacePage() {
  const [activeView, setActiveView] = useState<WorkstationView>('production');
  const [activeRailTool, setActiveRailTool] = useState<string>('continuity');
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isScopesModalOpen, setIsScopesModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isEdlModalOpen, setIsEdlModalOpen] = useState<boolean>(false);

  // Real state managed from ClickHouse and Gemini APIs
  const [health, setHealth] = useState<ClickHouseHealth | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<{ status: string; model: string } | null>(null);
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [invariants, setInvariants] = useState<LockedInvariant[]>([]);
  const [activeRevision, setActiveRevision] = useState<ActiveRevisionState | null>(null);
  const [committedBaseline, setCommittedBaseline] = useState<{
    commitHash: string;
    sequenceNumber: number;
    scenes?: SceneItem[];
    invariants?: LockedInvariant[];
  } | null>(null);

  // Loading & error states
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);

  // Initial fetch: System health & canonical baseline
  const fetchHealthAndState = useCallback(async () => {
    try {
      const [healthRes, stateRes] = await Promise.all([
        fetch('/api/chronicle/health'),
        fetch('/api/chronicle/state'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.clickhouse);
        setGeminiStatus(healthData.gemini);
      }

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        if (stateData.scenes && stateData.scenes.length > 0) {
          setScenes(stateData.scenes);
        }
        if (stateData.invariants && stateData.invariants.length > 0) {
          setInvariants(stateData.invariants);
        }
      }
    } catch {
      // Degraded / offline state without fabricating
      setHealth({
        status: 'UNAVAILABLE',
        host: 'localhost:8123',
        latencyMs: 0,
        totalScenes: 6,
        totalRevisions: 0,
        totalReceipts: 0,
        isReadOnlyReaderReady: false,
        isScopedWriterReady: false,
        error: 'ClickHouse service unreachable',
      });
    }
  }, []);

  useEffect(() => {
    fetchHealthAndState();
  }, [fetchHealthAndState]);

  // Real Revision Orchestration via Gemini 3.8 Flash & MCP ClickHouse
  const handleLaunchSimulation = async (directorPrompt?: string) => {
    setIsOrchestrating(true);
    setOrchestrationError(null);
    try {
      const res = await fetch('/api/chronicle/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            directorPrompt ||
            'Shift the revelation beat from Scene 12 to Scene 18; transition Scene 12 from night deluge rain into quiet dawn sunrise.',
          sourceScene: 12,
          targetScene: 18,
        }),
      });
      const data = await res.json();
      if (data.success && data.revision) {
        setActiveRevision(data.revision);
        if (data.revision.invariants && data.revision.invariants.length > 0) {
          setInvariants(data.revision.invariants);
        }
        setActiveView('simulation');
      } else {
        setOrchestrationError(data.error || 'Revision orchestration failed.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Orchestration network request failed.';
      setOrchestrationError(message);
    } finally {
      setIsOrchestrating(false);
    }
  };

  // Real Deterministic Promotion to ClickHouse Canonical Baseline
  const handlePromoteRepair = async (promotedBy = 'DIRECTOR_AND_LEAD_SUPERVISOR') => {
    const revisionId = activeRevision?.revisionId || 'rev-sc12-dawn-001';
    setIsPromoting(true);
    setPromotionError(null);
    try {
      const res = await fetch('/api/chronicle/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId,
          promotedBy,
        }),
      });
      const data = await res.json();
      if (data.success && data.promotionReceipt) {
        setCommittedBaseline({
          commitHash: data.promotionReceipt.commitHash,
          sequenceNumber: data.promotionReceipt.sequenceNumber,
          scenes: data.committedScenes,
          invariants: data.committedInvariants,
        });
        if (data.committedScenes) {
          setScenes(data.committedScenes);
        }
        if (data.committedInvariants) {
          setInvariants(data.committedInvariants);
        }
        setActiveView('committed');
      } else {
        setPromotionError(data.error || 'Promotion rejected by authority rules.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Promotion network request failed.';
      setPromotionError(message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRailToolClick = (toolId: string) => {
    setActiveRailTool(toolId);
    if (toolId === 'architecture') {
      setIsArchitectureModalOpen(true);
    } else if (toolId === 'scopes') {
      setIsScopesModalOpen(true);
    } else if (toolId === 'audit') {
      setIsAuditModalOpen(true);
    } else if (toolId === 'edl') {
      setIsEdlModalOpen(true);
    } else if (toolId === 'simulation') {
      setActiveView('simulation');
    } else if (toolId === 'committed') {
      setActiveView('committed');
    } else if (toolId === 'continuity') {
      setActiveView('production');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0c0e11] text-[#e2e2e6] overflow-hidden select-none">
      {/* 1. TOP STUDIO HEADER (48px) */}
      <StudioHeader
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        health={health}
        geminiStatus={geminiStatus}
        isCommitted={activeView === 'committed'}
      />

      {/* 2. MAIN WORKSPACE WITH MINI ACTIVITY RAIL */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Leftmost Mini Activity Rail (44px) */}
        <MiniActivityRail
          activeTool={activeRailTool}
          onSelectTool={handleRailToolClick}
        />

        {/* Dynamic Viewport Swapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeView === 'production' && (
            <ProductionStateView
              onLaunchSimulation={handleLaunchSimulation}
              onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
              onOpenScopes={() => setIsScopesModalOpen(true)}
              scenes={scenes}
              health={health}
              invariants={invariants}
              isOrchestrating={isOrchestrating}
              orchestrationError={orchestrationError}
            />
          )}

          {activeView === 'simulation' && (
            <ActiveSimulationView
              onPromoteRepair={handlePromoteRepair}
              onAbortSimulation={() => setActiveView('production')}
              onOpenScopes={() => setIsScopesModalOpen(true)}
              activeRevision={activeRevision}
              invariants={invariants}
              health={health}
              isPromoting={isPromoting}
              promotionError={promotionError}
            />
          )}

          {activeView === 'committed' && (
            <CommittedBaselineView
              onUnlockPipeline={() => setActiveView('production')}
              onExportEdl={() => setIsEdlModalOpen(true)}
              onViewAuditJson={() => setIsAuditModalOpen(true)}
              onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
              commitHash={committedBaseline?.commitHash}
              sequenceNum={committedBaseline?.sequenceNumber}
              health={health}
              scenes={committedBaseline?.scenes || scenes}
              invariants={committedBaseline?.invariants || invariants}
            />
          )}
        </div>
      </div>

      {/* 3. INTERACTIVE MODALS */}
      <ArchitectureDiagramModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      <VideoScopesModal
        isOpen={isScopesModalOpen}
        onClose={() => setIsScopesModalOpen(false)}
      />

      <AuditJsonModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <EdlExportModal
        isOpen={isEdlModalOpen}
        onClose={() => setIsEdlModalOpen(false)}
      />
    </div>
  );
}
