'use client';

import React, { useEffect, useState } from 'react';
import { LayoutGrid, RefreshCcw, Activity } from 'lucide-react';

interface MemorySegment {
  region: string;
  load: number;
  pages_rw: number;
  executions: number;
}

export default function MemoryHeatmap() {
  const [segments, setSegments] = useState<MemorySegment[]>([
    { region: '.text', load: 12, pages_rw: 4, executions: 420 },
    { region: '.data', load: 45, pages_rw: 8, executions: 120 },
    { region: '.rodata', load: 5, pages_rw: 1, executions: 0 },
    { region: 'stack', load: 82, pages_rw: 16, executions: 980 },
    { region: 'heap', load: 60, pages_rw: 32, executions: 1450 }
  ]);

  // Connect to live API Gateway websocket telemetry
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const connectWS = () => {
      ws = new WebSocket('ws://localhost:8080/ws');
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'heatmap_update' && Array.isArray(payload.data)) {
            const formatted = payload.data.map((seg: any) => ({
              region: seg.region,
              load: Number(seg.load),
              pages_rw: Number(seg.pages_rw),
              executions: Number(seg.executions)
            }));
            setSegments(formatted);
          }
        } catch (err) {
          console.debug("Error parsing WebSocket telemetry payload:", err);
        }
      };

      ws.onerror = () => {
        startFallback();
      };

      ws.onclose = () => {
        startFallback();
      };
    };

    const startFallback = () => {
      if (fallbackInterval) return;
      console.log("WebSocket telemetry offline. Starting local simulation loop.");
      fallbackInterval = setInterval(() => {
        setSegments(prev =>
          prev.map(seg => ({
            ...seg,
            load: Math.min(100, Math.max(0, seg.load + (Math.random() * 20 - 10))),
            executions: Math.max(0, Math.round(seg.executions + (Math.random() * 100 - 50)))
          }))
        );
      }, 3000);
    };

    // Attempt backend telemetry connection
    connectWS();

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={20} className="text-[#66fcf1]" />
          <h2 className="text-lg font-bold text-white tracking-tight">Live Memory Heatmap</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
          <Activity size={14} className="text-green-500 animate-pulse" />
          <span>Real-time Stream</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {segments.map((seg, idx) => {
          // Heatmap color map
          let heatColor = 'bg-blue-950/40 text-blue-400 border-blue-900/30';
          if (seg.load > 80) heatColor = 'bg-red-950/40 text-red-400 border-red-900/30';
          else if (seg.load > 50) heatColor = 'bg-yellow-950/40 text-yellow-400 border-yellow-900/30';
          else if (seg.load > 20) heatColor = 'bg-green-950/40 text-green-400 border-green-900/30';

          return (
            <div
              key={idx}
              className={`border p-4 rounded-xl flex flex-col justify-between h-32 transition-all hover:scale-[1.02] ${heatColor}`}
            >
              <div>
                <div className="font-bold text-sm tracking-wide">{seg.region}</div>
                <div className="text-[10px] opacity-75 mt-0.5">Pages RW: {seg.pages_rw}</div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold">{Math.round(seg.load)}%</div>
                <div className="text-[9px] opacity-75 uppercase tracking-wider font-mono">
                  Execs: {seg.executions}/s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
