'use client';

import React, { useState } from 'react';
import TopologyMap from '../../apps/dashboard/topology';
import PatchHistory from '../../apps/dashboard/patch-history';
import MemoryHeatmap from '../../apps/dashboard/heatmap';
import SecurityAlerts from '../../apps/dashboard/alerts';
import PatchApprovals from '../../apps/dashboard/approvals';
import AICopilot from '../../apps/dashboard/ai-copilot';
import { 
  ArrowLeft, Cpu, Activity, ShieldCheck, Database, RefreshCw, BarChart2, 
  Terminal as TermIcon, Layers, Lock, CreditCard, Code, Compass, ArrowRight, Play, BookOpen 
} from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'success' | 'error';
}

export default function DashboardConsole() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hotswap' | 'purifier' | 'setup' | 'billing'>('overview');
  
  // Simulated interactive CLI State
  const [terminalLogs, setTerminalLogs] = useState<TerminalLine[]>([
    { text: '⚡ NEXUS Live Core CLI initialized. Click any command below to simulate routing execution.', type: 'output' }
  ]);
  const [activeCommand, setActiveCommand] = useState<string>('');

  const executeCliCommand = (cmd: string) => {
    setActiveCommand(cmd);
    const newLogs: TerminalLine[] = [{ text: `$ ${cmd}`, type: 'input' }];
    
    if (cmd === 'nexus status') {
      newLogs.push(
        { text: '📡 Querying active cluster daemons (gRPC Mesh gossip protocol)...', type: 'output' },
        { text: 'prod-node-01: RUNNING | Active Patch: patch_v32_ok | Ptrace Allowed: YES', type: 'success' },
        { text: 'prod-node-02: RUNNING | Active Patch: patch_v32_ok | Ptrace Allowed: YES', type: 'success' },
        { text: 'prod-node-03: RUNNING | Active Patch: patch_v32_ok | Ptrace Allowed: YES', type: 'success' },
        { text: '🟢 Daemon consensus sync verified (3/3 nodes active)', type: 'success' }
      );
    } else if (cmd === 'nexus patch --target processPayment') {
      newLogs.push(
        { text: '📦 Packaging bytecode instruction changes...', type: 'output' },
        { text: '🔑 Cryptographic ED25519 payload signature check passed.', type: 'success' },
        { text: '🧠 Safety Oracle evaluation score: 12/100 (Classification: SAFE_TO_INJECT)', type: 'success' },
        { text: '🚀 Injecting E9 Jump instruction via process_vm_writev()...', type: 'output' },
        { text: '🎉 Patch successfully applied. Overhead: 340ns. Request flow unaffected.', type: 'success' }
      );
    } else if (cmd === 'nexus rollback --steps 1') {
      newLogs.push(
        { text: '⚡ Restoring process memory to previous snapshot block...', type: 'output' },
        { text: '✔ Snapshot recovery target: 0x7fffb8a1c900 (Restore 5 original instruction bytes)', type: 'output' },
        { text: '🟢 Memory segment restored successfully in 1.42ms.', type: 'success' }
      );
    } else if (cmd === 'nexus ui optimize') {
      newLogs.push(
        { text: '🔎 Scanning frontend modules for DOM layout bottlenecks...', type: 'output' },
        { text: '  - Intercepting DOM layout node trees', type: 'output' },
        { text: '✨ Scan complete. 0 DOM rendering bottleneck(s) found. Purifier SDK active.', type: 'success' }
      );
    } else {
      newLogs.push({ text: 'Command execution failure', type: 'error' });
    }

    setTerminalLogs(newLogs);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#66fcf1] selection:text-black">
      
      {/* Top Banner Navigation */}
      <header className="border-b border-gray-900 bg-[#0f111a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
              <ArrowLeft size={14} />
              <span>Back to Landing</span>
            </a>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded flex items-center justify-center text-black font-bold text-sm shadow-[0_0_10px_rgba(102,252,241,0.2)]">
                N
              </div>
              <span className="text-white font-bold tracking-tight text-sm">NEXUS CONTROL PLANE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="text-gray-500 hidden sm:inline">Active Version: <strong className="text-white">v1.0.0</strong></span>
            <div className="flex items-center gap-1.5 bg-[#1f2833]/60 border border-gray-800 px-3 py-1.5 rounded-lg text-[#66fcf1]">
              <Activity size={12} className="animate-pulse" />
              <span>Org: Acme Enterprise</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <aside className="space-y-4 col-span-1">
          <div className="bg-[#0f111a] border border-gray-850 p-4 rounded-2xl space-y-1">
            <div className="px-3 mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Unified Platform
            </div>
            
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'overview' ? 'bg-[#1f2833] text-[#66fcf1] border-l-2 border-[#66fcf1]' : 'text-gray-400 hover:bg-[#151824] hover:text-white'
              }`}
            >
              <Compass size={14} />
              <span>System Control Room</span>
            </button>

            <div className="h-px bg-gray-900 my-2" />
            <div className="px-3 mb-2 mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Platform Products
            </div>

            <button 
              onClick={() => setActiveTab('hotswap')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'hotswap' ? 'bg-[#1f2833] text-[#66fcf1] border-l-2 border-[#66fcf1]' : 'text-gray-400 hover:bg-[#151824] hover:text-white'
              }`}
            >
              <Cpu size={14} />
              <span>Product #1: Hot-Swap Daemon</span>
            </button>

            <button 
              onClick={() => setActiveTab('purifier')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'purifier' ? 'bg-[#1f2833] text-[#66fcf1] border-l-2 border-[#66fcf1]' : 'text-gray-400 hover:bg-[#151824] hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Product #2: Canvas Purifier</span>
            </button>

            <div className="h-px bg-gray-900 my-2" />
            <div className="px-3 mb-2 mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Administration
            </div>

            <button 
              onClick={() => setActiveTab('setup')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'setup' ? 'bg-[#1f2833] text-[#66fcf1] border-l-2 border-[#66fcf1]' : 'text-gray-400 hover:bg-[#151824] hover:text-white'
              }`}
            >
              <Code size={14} />
              <span>Cluster Onboarding Setup</span>
            </button>

            <button 
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                activeTab === 'billing' ? 'bg-[#1f2833] text-[#66fcf1] border-l-2 border-[#66fcf1]' : 'text-gray-400 hover:bg-[#151824] hover:text-white'
              }`}
            >
              <CreditCard size={14} />
              <span>Billing & Subscriptions</span>
            </button>
          </div>

          {/* Interactive Command Center */}
          <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <TermIcon size={12} className="text-[#66fcf1]" />
              <span>CLI Sandbox Actions</span>
            </h4>
            <div className="space-y-2">
              {[
                { cmd: 'nexus status', label: 'Check Cluster Health' },
                { cmd: 'nexus patch --target processPayment', label: 'Deploy Payment Patch' },
                { cmd: 'nexus rollback --steps 1', label: 'Rollback Last Operation' },
                { cmd: 'nexus ui optimize', label: 'Run CRP Performance Scan' }
              ].map((x, idx) => (
                <button
                  key={idx}
                  onClick={() => executeCliCommand(x.cmd)}
                  className={`w-full text-left p-2.5 rounded-lg border text-[11px] font-mono transition-all flex items-center justify-between ${
                    activeCommand === x.cmd ? 'bg-black/50 border-[#66fcf1] text-[#66fcf1]' : 'bg-[#151824] border-gray-800 text-gray-400 hover:text-white hover:border-gray-750'
                  }`}
                >
                  <span>{x.cmd}</span>
                  <Play size={10} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Console Panel */}
        <main className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW CONTROL ROOM */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Back Button for Platform */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Acme Control Plane Room</h2>
                  <p className="text-xs text-gray-500 mt-1">Status check & telemetry analytics dashboard.</p>
                </div>
                <a href="/" className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-[#0f111a] hover:bg-[#151824] text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300">
                  <ArrowLeft size={14} />
                  <span>Exit Console</span>
                </a>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cluster Nodes', value: '12 Active', icon: <Cpu size={18} className="text-blue-400" />, sub: 'All nodes healthy' },
                  { label: 'Redirection latency', value: '0.45ms', icon: <RefreshCw size={18} className="text-[#66fcf1]" />, sub: 'Relative branches execution' },
                  { label: 'Patches Executed', value: '148 applied', icon: <ShieldCheck size={18} className="text-green-400" />, sub: '0 downtime seconds' },
                  { label: 'Memory Hook Volume', value: '45,892 calls/s', icon: <BarChart2 size={18} className="text-yellow-400" />, sub: 'Instrumented functions' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">{stat.label}</label>
                      <div className="text-lg font-extrabold text-white mt-1">{stat.value}</div>
                      <span className="text-[10px] text-gray-500 mt-1 block">{stat.sub}</span>
                    </div>
                    <div className="bg-[#151824] p-3 rounded-lg border border-gray-800">
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cluster Topology Map */}
              <TopologyMap />

              {/* CLI Execution output Console */}
              <div className="bg-[#0b0c10] border border-gray-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-[#0f111a] border-b border-gray-850 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                    <TermIcon size={14} className="text-[#66fcf1]" />
                    <span>SaaS Terminal Console Output</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-green-400">ACTIVE SESSION</span>
                </div>
                <div className="p-6 bg-black/25 font-mono text-xs text-[#66fcf1] space-y-2 h-44 overflow-y-auto leading-relaxed border-t border-gray-950">
                  {terminalLogs.map((l, idx) => (
                    <div 
                      key={idx} 
                      className={
                        l.type === 'input' ? 'text-white font-semibold' :
                        l.type === 'success' ? 'text-green-400' :
                        l.type === 'error' ? 'text-red-400' : 'text-gray-500'
                      }
                    >
                      {l.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOT-SWAP DAEMON CONTROL ROOM */}
          {activeTab === 'hotswap' && (
            <div className="space-y-6">
              {/* Back Button for Product #1 */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Cpu className="text-[#66fcf1]" size={20} />
                    <span>Product #1: Hot-Swap Daemon Panel</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Manage process memory injection, rollbacks, and offline static validation oracles.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-[#0f111a] hover:bg-[#151824] text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Overview</span>
                </button>
              </div>

              {/* AI Safety approvals & Security Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AICopilot />
                <PatchApprovals />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SecurityAlerts />
                <MemoryHeatmap />
              </div>

              {/* Audit history logs */}
              <PatchHistory />
            </div>
          )}

          {/* TAB 3: CANVAS PURIFIER BENCHMARKS */}
          {activeTab === 'purifier' && (
            <div className="space-y-6">
              {/* Back Button for Product #2 */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Layers className="text-[#66fcf1]" size={20} />
                    <span>Product #2: Canvas-Render Purifier Hub</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Review WebGL GPU compilation, layout calculations, and high-frequency benchmarks.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-[#0f111a] hover:bg-[#151824] text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Overview</span>
                </button>
              </div>

              {/* DOM vs GPU Performance Comparison Card */}
              <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-[#66fcf1]">FPS Rendering Stability</h4>
                  <div className="text-3xl font-extrabold text-white font-mono">144 FPS</div>
                  <span className="text-[10px] text-gray-500 block">Standard browser DOM caps out at 12 FPS under load</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-[#66fcf1]">Memory Footprint (100k Rows)</h4>
                  <div className="text-3xl font-extrabold text-green-400 font-mono">82 MB</div>
                  <span className="text-[10px] text-gray-500 block">Standard browser memory allocates 1.2 GB for nodes</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-[#66fcf1]">GPU Draw call Batching</h4>
                  <div className="text-3xl font-extrabold text-blue-400 font-mono">1 Draw Call</div>
                  <span className="text-[10px] text-gray-500 block">Aggregates layout rectangles into single vertex buffer</span>
                </div>
              </div>

              {/* Interactive workspace entry columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="h-8 w-8 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-900 flex items-center justify-center mb-3">
                      <BarChart2 size={16} />
                    </div>
                    <h3 className="text-white font-bold text-sm">Scroll Benchmarks</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      Compare WebGL shaders rendering 20,000 telemetry rows at 144 FPS side-by-side with a standard React DOM table to see frame drops and memory spikes.
                    </p>
                  </div>
                </div>

                <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="h-8 w-8 rounded-lg bg-green-950/40 text-green-400 border border-green-900 flex items-center justify-center mb-3">
                      <Code size={16} />
                    </div>
                    <h3 className="text-white font-bold text-sm">Visual Playground</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      Design nodes with padding/margin sliders, inspect layout boundaries calculated using the Taffy layout engine, and preview compiled JSX and AST JSON.
                    </p>
                  </div>
                </div>

                <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="h-8 w-8 rounded-lg bg-[#1f2833] text-[#66fcf1] border border-gray-800 flex items-center justify-center mb-3">
                      <BookOpen size={16} />
                    </div>
                    <h3 className="text-white font-bold text-sm">Developer Guide</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      Access a step-by-step onboarding walkthrough covering npm packages configuration, reconciler initialization, and synthetic events mapping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Launcher block */}
              <div className="bg-gradient-to-tr from-[#151824] to-[#1f2833] border border-gray-800 p-8 rounded-2xl text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#66fcf1]/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Launch the Canvas-Render Purifier Compiler Hub
                </h3>
                <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
                  Open the fully integrated compiler workspace to test scroll metrics, customize nodes layouts, and copy production-ready SDK snippets.
                </p>

                <div>
                  <a
                    href="/dashboard/perf"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] text-black font-extrabold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(102,252,241,0.2)] hover:opacity-95 transition-all text-xs"
                  >
                    <span>Open Purifier Workspace</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETUP & CLUSTER ONBOARDING */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Cluster Onboarding & Integration</h2>
                  <p className="text-xs text-gray-500 mt-1">Configure daemons across Kubernetes, Docker Compose, or native VMs.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-[#0f111a] hover:bg-[#151824] text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Overview</span>
                </button>
              </div>

              {/* Onboarding content */}
              <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Kubernetes Helm Installation</h3>
                <p className="text-xs text-gray-400">
                  Deploy the Helm operator to configure target namespace sidecar inject hooks automatically.
                </p>
                <div className="bg-black/40 p-4 rounded-xl border border-gray-900 font-mono text-[11px] text-gray-300">
                  <pre>helm repo add nexus-devops https://dist.nexus.dev/charts<br/>helm install nexus-operator nexus-devops/nexus-daemon --set orgToken=tok_developer_key_mock_123</pre>
                </div>
              </div>

              <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Docker Compose Configuration</h3>
                <p className="text-xs text-gray-400">
                  Configure compose specifications to share host pid spaces and execute ptrace overrides.
                </p>
                <div className="bg-black/40 p-4 rounded-xl border border-gray-900 font-mono text-[11px] text-gray-300">
                  <pre>services:<br/>  nexus-daemon:<br/>    image: ghcr.io/nexus-devops/nexus-daemon:latest<br/>    pid: "host"<br/>    cap_add:<br/>      - SYS_PTRACE<br/>    environment:<br/>      - NEXUS_TOKEN=tok_developer_key_mock_123</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BILLING & SUBSCRIPTIONS */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-850 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Billing Portal & Subscriptions</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage billing preferences, Paddle subscriptions, and cluster nodes allocations.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-800 bg-[#0f111a] hover:bg-[#151824] text-xs font-semibold flex items-center gap-1.5 transition-all text-gray-300"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Overview</span>
                </button>
              </div>

              {/* Subscriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { plan: 'Growth Plan', price: '$249/mo', desc: 'Up to 20 cluster nodes limit.', active: false },
                  { plan: 'Scale Plan', price: '$749/mo', desc: 'Up to 100 cluster nodes limit.', active: true },
                  { plan: 'Enterprise Suite', price: '$2,499/mo', desc: 'Unlimited cluster node quotas.', active: false }
                ].map((p, idx) => (
                  <div 
                    key={idx} 
                    className={`border p-6 rounded-2xl flex flex-col justify-between h-48 relative ${
                      p.active ? 'bg-[#151824] border-[#66fcf1]' : 'bg-[#0f111a] border-gray-850'
                    }`}
                  >
                    {p.active && (
                      <span className="absolute top-4 right-4 bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] text-black text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Active Plan
                      </span>
                    )}
                    <div>
                      <h4 className="text-white font-bold text-sm">{p.plan}</h4>
                      <div className="text-2xl font-extrabold text-white mt-2">{p.price}</div>
                      <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                    </div>
                    <button 
                      disabled={p.active}
                      className={`w-full py-2 rounded-lg text-xs font-semibold border transition-all ${
                        p.active ? 'bg-[#1f2833] border-[#66fcf1] text-[#66fcf1] cursor-default' : 'bg-gray-900 border-gray-800 text-white hover:bg-gray-800'
                      }`}
                    >
                      {p.active ? 'Current Subscription' : 'Upgrade Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
