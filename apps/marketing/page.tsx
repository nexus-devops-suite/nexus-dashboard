'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Terminal, Zap, Shield, Cpu, RefreshCw, Check, Play, Command, ChevronRight } from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'success' | 'error';
}

export default function MarketingLandingPage() {
  // Dynamic stats counters ticking up
  const [patchesTicked, setPatchesTicked] = useState(148293);
  const [avgOverhead, setAvgOverhead] = useState(340);

  // Terminal state
  const [cmdInput, setCmdInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: '⚡ NEXUS Live Patching Terminal Simulator. Type "help" to start.', type: 'output' },
  ]);
  
  // Simulated project states
  const [projectInit, setProjectInit] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Ticking statistics simulation
    const statsInterval = setInterval(() => {
      setPatchesTicked(prev => prev + Math.floor(Math.random() * 3) + 1);
      setAvgOverhead(prev => Math.max(280, Math.min(410, prev + (Math.random() * 6 - 3))));
    }, 4000);

    return () => clearInterval(statsInterval);
  }, []);

  useEffect(() => {
    // Scroll terminal to bottom
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = cmdInput.trim();
    if (!cleanCmd) return;

    const newHistory = [...terminalHistory, { text: `$ ${cleanCmd}`, type: 'input' as const }];
    const lowerCmd = cleanCmd.toLowerCase();

    if (lowerCmd === 'help') {
      newHistory.push(
        { text: 'Available commands:', type: 'output' },
        { text: '  nexus init    - Initialize a project configuration structure', type: 'output' },
        { text: '  nexus keygen  - Generate a secure ED25519 signature keypair', type: 'output' },
        { text: '  nexus patch   - Hot-swap code (requires keygen and init first)', type: 'output' },
        { text: '  nexus status  - Fetch active cluster node health and layouts', type: 'output' },
        { text: '  clear         - Clear terminal console history', type: 'output' }
      );
    } else if (lowerCmd === 'clear') {
      setTerminalHistory([]);
      setCmdInput('');
      return;
    } else if (lowerCmd === 'nexus init') {
      setProjectInit(true);
      newHistory.push(
        { text: '[+] Scaffolding config folder ~/.nexus/...', type: 'output' },
        { text: '[+] Creating project configuration schema in nexus.json', type: 'output' },
        { text: '✔ Project initialized successfully. Ready to generate keys.', type: 'success' }
      );
    } else if (lowerCmd === 'nexus keygen') {
      if (!projectInit) {
        newHistory.push({ text: '✖ Error: Project must be initialized first. Run "nexus init".', type: 'error' });
      } else {
        const randPub = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const randPriv = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setPublicKey(randPub);
        setPrivateKey(randPriv);
        newHistory.push(
          { text: '[+] Generating ED25519 signature keypairs...', type: 'output' },
          { text: `✔ Public signature key generated: pub_key_${randPub.substring(0, 8)}...`, type: 'success' },
          { text: '✔ Private key saved securely in ~/.nexus/nexus_key', type: 'success' }
        );
      }
    } else if (lowerCmd.startsWith('nexus patch')) {
      if (!projectInit || !publicKey) {
        newHistory.push({ text: '✖ Error: You must initialize the project and generate keys first. Run "nexus init" then "nexus keygen".', type: 'error' });
      } else {
        newHistory.push(
          { text: '[+] Compiling patch differentials...', type: 'output' },
          { text: '[+] Requesting safety checks from offline Oracle...', type: 'output' },
          { text: `[+] Cryptographically signing payload using key: pub_key_${publicKey.substring(0, 8)}...`, type: 'output' },
          { text: '[+] Injecting JMP E9 instruction via process_vm_writev() to remote PID...', type: 'output' },
          { text: '✔ Hot Patch successfully applied. Overhead: 320ns. Node sync: OK.', type: 'success' }
        );
      }
    } else if (lowerCmd === 'nexus status') {
      newHistory.push(
        { text: 'NODE NAME     ROLE      STATUS     MEMORY LOAD   EXEC/S', type: 'output' },
        { text: 'master-01     Master    Healthy    14%           4,200', type: 'output' },
        { text: 'worker-us-01  Worker    Patched    42%           24,105', type: 'output' },
        { text: 'worker-us-02  Worker    Healthy    28%           12,850', type: 'output' },
        { text: 'worker-eu-01  Worker    Alerting   76%           9,800', type: 'output' }
      );
    } else {
      newHistory.push({ text: `command not found: ${cleanCmd}. Type "help" for a list of commands.`, type: 'output' });
    }

    setTerminalHistory(newHistory);
    setCmdInput('');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans overflow-x-hidden selection:bg-[#66fcf1] selection:text-black pb-20">
      
      {/* Header */}
      <header className="border-b border-gray-900 bg-[#0b0c10]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded-lg flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(102,252,241,0.2)]">
              N
            </div>
            <span className="text-white font-bold tracking-tight text-xl">NEXUS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#playground" className="hover:text-white transition-colors">Live CLI Playground</a>
            <a href="/pricing" className="hover:text-white transition-colors font-semibold text-[#66fcf1]">Pricing</a>
          </nav>
          <a
            href="/dashboard"
            className="bg-[#1f2833] text-white hover:text-[#66fcf1] px-4 py-2 rounded-lg text-sm border border-gray-800 transition-all flex items-center gap-1.5"
          >
            <span>Launch Dashboard</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#66fcf1]/5 to-[#45f3ff]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f2833]/60 border border-[#66fcf1]/20 text-[#66fcf1] text-xs font-semibold mb-6">
            <Zap size={12} className="animate-pulse" />
            <span>Zero-Downtime Native Patching Framework</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Hot-Swap Live Native Code <br />
            <span className="bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] bg-clip-text text-transparent">
              Without Downtime.
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Inject patches and compile changes directly into target processes in-memory under <code className="text-white">&lt;5ms</code>. No container restarts. No load balancer drops.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="w-full sm:w-auto bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] hover:opacity-95 text-black font-semibold px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(102,252,241,0.25)] transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </a>
            <a
              href="#playground"
              className="w-full sm:w-auto bg-[#1f2833]/50 hover:bg-[#1f2833]/80 border border-gray-800 text-white font-medium px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Terminal size={18} />
              <span>Try Live CLI Simulator</span>
            </a>
          </div>
        </div>
      </section>

      {/* Live Ticking Statistics Grid */}
      <section className="max-w-6xl mx-auto px-6 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Patches Compiled', value: patchesTicked.toLocaleString(), sub: 'Ticking up in real-time' },
          { label: 'Avg Instruction Overhead', value: `${Math.round(avgOverhead)}ns`, sub: 'Sub-millisecond redirection' },
          { label: 'Active Cluster Nodes', value: '1,283 Healthy', sub: 'Monitoring consensus state' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl text-center">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#66fcf1] block mb-2">{stat.label}</label>
            <div className="text-3xl font-extrabold text-white font-mono">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Interactive CLI Playground */}
      <section id="playground" className="py-16 px-6 bg-[#0f111a]/40 border-y border-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Command size={22} className="text-[#66fcf1]" />
              <span>Interactive CLI Playground</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Initialize a project, generate keys, and hot-swap a patch in the terminal simulator below.
            </p>
          </div>

          <div className="bg-[#0f111a] border border-gray-850 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-[#151824] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-gray-500 font-mono">nexus-terminal-simulator</div>
              <div className="w-12" />
            </div>

            <div className="p-6 font-mono text-sm leading-relaxed text-[#66fcf1] h-80 overflow-y-auto space-y-2 bg-black/40">
              {terminalHistory.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.type === 'input' ? 'text-white font-semibold' :
                    line.type === 'success' ? 'text-green-400' :
                    line.type === 'error' ? 'text-red-400' : 'text-gray-400'
                  }
                >
                  {line.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <form onSubmit={handleCommandSubmit} className="bg-[#0f111a] border-t border-gray-800 flex items-center px-4 py-3">
              <ChevronRight size={18} className="text-[#66fcf1] shrink-0" />
              <input
                type="text"
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder='Type a command (e.g. "help", "nexus init", "nexus keygen", "nexus patch", "nexus status")'
                className="w-full bg-transparent outline-none border-none text-white ml-2 text-sm font-mono focus:ring-0 focus:outline-none"
              />
            </form>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Enterprise Infrastructure Capabilities</h2>
          <p className="text-gray-400 mt-2">Built for critical cloud runtimes operating at scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="text-[#66fcf1]" size={28} />,
              title: 'Sub-millisecond Patching',
              desc: 'In-memory dynamic branch injection maps jumps instantly without execution blocks.'
            },
            {
              icon: <Shield className="text-[#66fcf1]" size={28} />,
              title: 'Offline Risk Analysis',
              desc: 'Mistral 7B GGML integration automatically scores patches (0-100) before deployment.'
            },
            {
              icon: <Cpu className="text-[#66fcf1]" size={28} />,
              title: 'Cross-Language Support',
              desc: 'JVMTI and CLR hooking maps hooks automatically across JVM, .NET, Node, and WebAssembly.'
            }
          ].map((feat, index) => (
            <div key={index} className="bg-[#0f111a] border border-gray-850 p-8 rounded-2xl hover:border-gray-750 transition-all">
              <div className="bg-[#1f2833] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#0f111a] py-16 px-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wider uppercase text-[10px]">Products</h4>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Hot-Swap Daemon</a></li>
              <li><a href="/dashboard/perf" className="hover:text-white transition-colors">Canvas-Render Purifier</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">AI Safety Oracle</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">Daemon Mesh Gossip</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wider uppercase text-[10px]">Developer Guides</h4>
            <ul className="space-y-2">
              <li><a href="/onboarding/setup" className="hover:text-white transition-colors">Kubernetes Deployment</a></li>
              <li><a href="/onboarding/setup" className="hover:text-white transition-colors">Docker Compose Integration</a></li>
              <li><a href="/onboarding/setup" className="hover:text-white transition-colors">Developer CLI Tools</a></li>
              <li><a href="/pricing" className="hover:text-[#66fcf1] transition-colors font-semibold">Paddle Pricing Plans</a></li>
            </ul>
          </div>
          <div className="space-y-4 col-span-2">
            <h4 className="text-white font-bold tracking-wider uppercase text-[10px]">Confidentiality & Compliance</h4>
            <p className="leading-relaxed text-gray-600 max-w-sm">
              NEXUS DevOps Suite Version 1.0 — Confidential & Proprietary. B2B Enterprise SaaS infrastructure compliance guidelines enforced via ED25519 payload signatures and CAP_SYS_PTRACE system credentials.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded flex items-center justify-center text-black font-bold text-xs">
              N
            </div>
            <span className="text-white font-bold text-sm tracking-tight">NEXUS DEVOPS SUITE</span>
          </div>
          <p className="text-center sm:text-right">&copy; {new Date().getFullYear()} Nexus DevOps Suite. Open-source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
}
