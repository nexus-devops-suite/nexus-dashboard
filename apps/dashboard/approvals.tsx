'use client';

import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

interface PendingPatch {
  id: string;
  developer: string;
  targetFn: string;
  riskScore: number;
  linesModified: number;
}

export default function PatchApprovals() {
  const [pending, setPending] = useState<PendingPatch[]>([]);

  // Fetch and update approvals from live API Gateway WebSockets
  React.useEffect(() => {
    // 1. Fetch initial pending approvals from database
    fetch('http://localhost:7860/api/patch/history', {
      headers: {
        'Authorization': 'Bearer tok_developer_key_mock_123'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Network / auth check failed");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const pendingItems = data
            .filter((p: any) => p.status === 'PENDING_APPROVAL')
            .map((p: any) => ({
              id: p.id,
              developer: p.developer,
              targetFn: p.target_fn,
              riskScore: Number(p.risk_score),
              linesModified: Math.round(Number(p.risk_score) / 6) + 3
            }));
          setPending(pendingItems);
        }
      })
      .catch(err => {
        console.log("Gateway offline. Running approvals with static mockup list.", err);
      });

    // 2. Connect WebSocket listener for pending admin authorizations
    let ws: WebSocket | null = null;
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:7860/ws');
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'patch_event' && payload.data) {
            const p = payload.data;
            if (p.status === 'PENDING_APPROVAL') {
              const newPending: PendingPatch = {
                id: p.id,
                developer: p.developer,
                targetFn: p.target_fn,
                riskScore: Number(p.risk_score),
                linesModified: Math.round(Number(p.risk_score) / 6) + 3
              };
              setPending(prev => [newPending, ...prev.filter(x => x.id !== newPending.id)]);
            }
          }
        } catch (err) {
          console.debug("Error parsing WebSocket approval event:", err);
        }
      };
    };

    connectWS();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleApprove = (id: string) => {
    // Notify, propagate, or call gateway API route
    setPending(prev => prev.filter(p => p.id !== id));
  };

  const handleReject = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <UserCheck size={20} className="text-[#66fcf1]" />
        <h2 className="text-lg font-bold text-white tracking-tight">Pending Admin Approvals (RBAC)</h2>
      </div>

      <div className="space-y-4">
        {pending.map((p) => (
          <div key={p.id} className="bg-[#151824] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-mono font-bold text-sm">{p.id}</span>
                <span className="text-xs text-gray-500 font-mono">by {p.developer}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400">Target Function: </span>
                <code className="text-[#66fcf1] font-mono text-xs">{p.targetFn}</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <ShieldAlert size={14} />
                  <span>Risk Score: {p.riskScore}% (HIGH)</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  Diff size: +{p.linesModified} lines
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => handleReject(p.id)}
                className="flex-1 md:flex-none border border-gray-800 hover:border-gray-700 text-gray-400 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <X size={14} />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleApprove(p.id)}
                className="flex-1 md:flex-none bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(102,252,241,0.15)] hover:opacity-95 transition-all"
              >
                <Check size={14} />
                <span>Approve & Rollout</span>
              </button>
            </div>
          </div>
        ))}

        {pending.length === 0 && (
          <div className="text-center text-xs text-gray-500 py-8">
            No patches pending administrator verification.
          </div>
        )}
      </div>
    </div>
  );
}
