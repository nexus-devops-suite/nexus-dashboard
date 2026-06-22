'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Bell } from 'lucide-react';

interface SystemAlert {
  id: string;
  level: 'CRITICAL' | 'WARNING' | 'RESOLVED';
  message: string;
  timestamp: string;
}

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Connect to live WebSocket security feed
  React.useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:7860/ws');
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'alert_event' && payload.data) {
            const al = payload.data;
            const newAlert: SystemAlert = {
              id: al.id || `al_${Date.now()}`,
              level: al.level || 'WARNING',
              message: al.message,
              timestamp: al.timestamp ? new Date(al.timestamp).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            setAlerts(prev => [newAlert, ...prev.filter(x => x.id !== newAlert.id)].slice(0, 10));
          }
        } catch (err) {
          console.debug("Error parsing WebSocket alert event:", err);
        }
      };
      
      ws.onerror = () => {
        // Silent fail, rely on pre-seeded alerts
      };
    };

    connectWS();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const clearAlert = (id: string) => {
    setAlerts(prev => prev.filter(al => al.id !== id));
  };

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[#66fcf1]" />
          <h2 className="text-lg font-bold text-white tracking-tight">Security & Rollback Feed</h2>
        </div>
        <span className="bg-red-950/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-900/30">
          {alerts.filter(a => a.level !== 'RESOLVED').length} Active
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((al) => {
          let alertStyle = 'bg-yellow-950/20 border-yellow-900/40 text-yellow-400';
          let icon = <AlertTriangle className="shrink-0 mt-0.5" size={18} />;

          if (al.level === 'CRITICAL') {
            alertStyle = 'bg-red-950/20 border-red-900/40 text-red-400';
            icon = <ShieldAlert className="shrink-0 mt-0.5" size={18} />;
          } else if (al.level === 'RESOLVED') {
            alertStyle = 'bg-green-950/20 border-green-900/40 text-green-400';
            icon = <CheckCircle className="shrink-0 mt-0.5" size={18} />;
          }

          return (
            <div
              key={al.id}
              className={`border p-4 rounded-xl flex justify-between items-start gap-4 transition-all ${alertStyle}`}
            >
              <div className="flex gap-3">
                {icon}
                <div>
                  <div className="font-bold text-xs font-mono uppercase tracking-wider">{al.level}</div>
                  <p className="text-xs mt-1 leading-relaxed text-gray-300">{al.message}</p>
                  <span className="text-[10px] text-gray-500 block mt-2 font-mono">{al.timestamp}</span>
                </div>
              </div>
              <button
                onClick={() => clearAlert(al.id)}
                className="text-gray-500 hover:text-gray-300 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center text-xs text-gray-500 py-12">
            No system warnings reported. All cluster checkpoints are healthy.
          </div>
        )}
      </div>
    </div>
  );
}
