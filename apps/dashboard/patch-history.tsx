'use client';

import React, { useState } from 'react';
import { History, Shield, ArrowLeftRight, Check, AlertTriangle } from 'lucide-react';

interface PatchLog {
  id: string;
  developer: string;
  targetFn: string;
  riskScore: number;
  status: 'active' | 'rolled_back' | 'pending';
  timestamp: string;
}

export default function PatchHistory() {
  const [patches, setPatches] = useState<PatchLog[]>([
    {
      id: 'pat_098f',
      developer: 'Alice Smith (DevOps)',
      targetFn: 'auth.validate_token',
      riskScore: 24,
      status: 'active',
      timestamp: '2026-06-15 14:10:05'
    },
    {
      id: 'pat_1f8a',
      developer: 'Bob Jones (SecOps)',
      targetFn: 'payment.process_checkout',
      riskScore: 82,
      status: 'pending',
      timestamp: '2026-06-15 13:54:12'
    },
    {
      id: 'pat_2b8c',
      developer: 'Charlie Brown (Core Eng)',
      targetFn: 'router.route_request',
      riskScore: 12,
      status: 'rolled_back',
      timestamp: '2026-06-15 11:22:45'
    }
  ]);

  // Fetch from API Gateway and subscribe to live patch rollouts
  React.useEffect(() => {
    // 1. Fetch historical database records
    fetch('http://localhost:7860/api/patch/history', {
      headers: {
        'Authorization': 'Bearer tok_developer_key_mock_123'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Authentication / network failure");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map((p: any) => ({
            id: p.id,
            developer: p.developer,
            targetFn: p.target_fn,
            riskScore: Number(p.risk_score),
            status: p.status === 'DEPLOYED' ? 'active' as const : p.status === 'PENDING_APPROVAL' ? 'pending' as const : 'rolled_back' as const,
            timestamp: new Date(p.timestamp).toISOString().replace('T', ' ').substring(0, 19)
          }));
          setPatches(formatted);
        }
      })
      .catch(err => {
        console.log("Gateway offline or route rejected. Running with static pre-seeded patches.", err);
      });

    // 2. Connect live WebSocket listener for real-time patch logs
    let ws: WebSocket | null = null;
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:7860/ws');
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'patch_event' && payload.data) {
            const p = payload.data;
            const newPatch: PatchLog = {
              id: p.id,
              developer: p.developer,
              targetFn: p.target_fn,
              riskScore: Number(p.risk_score),
              status: p.status === 'DEPLOYED' ? 'active' : p.status === 'PENDING_APPROVAL' ? 'pending' : 'rolled_back',
              timestamp: p.timestamp ? new Date(p.timestamp).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            setPatches(prev => [newPatch, ...prev.filter(x => x.id !== newPatch.id)]);
          }
        } catch (err) {
          console.debug("Error parsing WebSocket patch event:", err);
        }
      };
    };

    connectWS();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleRollback = (id: string) => {
    setPatches(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'rolled_back' as const } : p))
    );
  };

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <History size={20} className="text-[#66fcf1]" />
        <h2 className="text-lg font-bold text-white tracking-tight">System Patch Logs</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Patch ID</th>
              <th className="py-3 px-4">Developer</th>
              <th className="py-3 px-4">Target Function</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900 text-gray-300">
            {patches.map((patch) => (
              <tr key={patch.id} className="hover:bg-[#151824]/40 transition-colors">
                <td className="py-4 px-4 text-white font-semibold">{patch.id}</td>
                <td className="py-4 px-4 text-gray-400">{patch.developer}</td>
                <td className="py-4 px-4 text-[#66fcf1]">{patch.targetFn}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      patch.riskScore > 70 ? 'bg-red-500' :
                      patch.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span>{patch.riskScore}%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    patch.status === 'active' ? 'bg-green-950/40 text-green-400 border border-green-900/30' :
                    patch.status === 'rolled_back' ? 'bg-gray-800 text-gray-400' :
                    'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30'
                  }`}>
                    {patch.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-500">{patch.timestamp}</td>
                <td className="py-4 px-4 text-right">
                  {patch.status === 'active' && (
                    <button
                      onClick={() => handleRollback(patch.id)}
                      className="bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-900/30 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-colors"
                    >
                      Rollback
                    </button>
                  )}
                  {patch.status === 'rolled_back' && (
                    <span className="text-[10px] text-gray-500 uppercase">Restored &lt;5ms</span>
                  )}
                  {patch.status === 'pending' && (
                    <span className="text-[10px] text-yellow-500 uppercase">Awaiting RBAC</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
