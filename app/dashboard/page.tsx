'use client';

import React from 'react';
import TopologyMap from '../../apps/dashboard/topology';
import PatchHistory from '../../apps/dashboard/patch-history';
import MemoryHeatmap from '../../apps/dashboard/heatmap';
import SecurityAlerts from '../../apps/dashboard/alerts';
import PatchApprovals from '../../apps/dashboard/approvals';
import AICopilot from '../../apps/dashboard/ai-copilot';
import { ArrowLeft, Cpu, Activity, ShieldCheck, Database, RefreshCw, BarChart2 } from 'lucide-react';

export default function DashboardConsole() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#66fcf1] selection:text-black pb-12">
      {/* Navigation Top Bar */}
      <header className="border-b border-gray-900 bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={16} />
              <span className="text-xs">Landing</span>
            </a>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded flex items-center justify-center text-black font-bold text-sm shadow-[0_0_10px_rgba(102,252,241,0.2)]">
                N
              </div>
              <span className="text-white font-bold tracking-tight text-sm">NEXUS CONSOLE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-mono">
            <a href="/onboarding/setup" className="hover:underline text-gray-400 hover:text-white">Daemon Setup</a>
            <a href="/onboarding/token" className="hover:underline text-gray-400 hover:text-white">API Key</a>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-1.5 bg-[#1f2833]/60 border border-gray-800 px-3 py-1.5 rounded-lg text-[#66fcf1]">
              <Activity size={12} className="animate-pulse" />
              <span>Org: Acme Enterprise</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Console Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Quick Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Cluster Nodes', value: '12 Active', icon: <Cpu size={18} className="text-blue-400" />, sub: '1 Offline / 1 Alerting' },
            { label: 'Avg Patch Speed', value: '0.45ms', icon: <RefreshCw size={18} className="text-[#66fcf1]" />, sub: 'Redirection JMP E9 latency' },
            { label: 'Patches Executed', value: '148 applied', icon: <ShieldCheck size={18} className="text-green-400" />, sub: '0 requests dropped' },
            { label: 'Memory Hook Volume', value: '45,892 calls/s', icon: <BarChart2 size={18} className="text-yellow-400" />, sub: 'Real-time instrumentation' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl flex items-center justify-between">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">{stat.label}</label>
                <div className="text-xl font-extrabold text-white mt-1">{stat.value}</div>
                <span className="text-[10px] text-gray-500 mt-1 block">{stat.sub}</span>
              </div>
              <div className="bg-[#151824] p-3 rounded-lg border border-gray-800">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* First Row: Topology & AI Copilot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TopologyMap />
          </div>
          <div>
            <AICopilot />
          </div>
        </div>

        {/* Second Row: Approvals & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PatchApprovals />
          <SecurityAlerts />
        </div>

        {/* Third Row: Heatmap */}
        <div>
          <MemoryHeatmap />
        </div>

        {/* Fourth Row: Logs */}
        <div>
          <PatchHistory />
        </div>

      </main>
    </div>
  );
}
