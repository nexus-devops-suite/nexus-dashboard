'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Cpu } from 'lucide-react';

export default function SetupInstructions() {
  const [activeTab, setActiveTab] = useState<'k8s' | 'docker' | 'linux'>('k8s');
  const [copied, setCopied] = useState(false);

  const commands = {
    k8s: `helm repo add nexus-charts https://charts.nexus.dev
helm install nexus-daemon nexus-charts/nexus-agent \\
  --set clusterToken="tok_acme_prod_99f3" \\
  --set namespace="nexus-system"`,
    docker: `docker run -d --name nexus-daemon \\
  --pid=host --privileged \\
  -e CLUSTER_TOKEN="tok_acme_prod_99f3" \\
  -v /proc:/host/proc:ro \\
  nexusdevops/daemon:latest`,
    linux: `curl -sSL https://install.nexus.dev | sh -s -- \\
  --token="tok_acme_prod_99f3" \\
  --systemd-enable`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1f2833] p-3 rounded-lg text-[#66fcf1]">
            <Cpu size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Daemon Node Setup</h1>
            <p className="text-gray-400 text-sm">Deploy the in-memory patching daemon sidecar into your clusters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { id: 'k8s', title: 'Kubernetes', desc: 'Helm chart deployment' },
            { id: 'docker', title: 'Docker Sidecar', desc: 'Privileged host runtime' },
            { id: 'linux', title: 'Linux VM', desc: 'Systemd service daemon' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-5 rounded-xl text-left transition-all border ${
                activeTab === tab.id
                  ? 'bg-[#1f2833] border-[#66fcf1] shadow-[0_0_15px_rgba(102,252,241,0.15)] text-white'
                  : 'bg-[#0f111a] border-gray-800 hover:border-gray-700 text-gray-400'
              }`}
            >
              <h3 className="font-semibold text-lg">{tab.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{tab.desc}</p>
            </button>
          ))}
        </div>

        <div className="bg-[#0f111a] border border-gray-850 rounded-xl overflow-hidden">
          <div className="bg-[#151824] px-5 py-3 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2 text-sm text-[#66fcf1]">
              <Terminal size={16} />
              <span>Shell Execution command</span>
            </div>
            <button
              onClick={() => copyToClipboard(commands[activeTab])}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-5 font-mono text-sm overflow-x-auto text-[#66fcf1] bg-black/40">
            <pre>{commands[activeTab]}</pre>
          </div>
        </div>

        <div className="mt-8 bg-[#1f2833]/30 border border-[#66fcf1]/10 rounded-xl p-6 flex items-start gap-4">
          <ShieldCheck className="text-[#66fcf1] shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="text-white font-semibold text-sm">Security Verification & Privileges</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              The daemon requires <code className="text-[#66fcf1]">CAP_SYS_PTRACE</code> capabilities and raw namespace access to hook dynamic calls and write bytecode to target memory bounds. Inspect our open-source Dockerfile scripts prior to rollout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
