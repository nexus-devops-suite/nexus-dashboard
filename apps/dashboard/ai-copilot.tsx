'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, ArrowRight, Play, Check } from 'lucide-react';

export default function AICopilot() {
  const [prompt, setPrompt] = useState('Fix index boundary check inside payment.process_checkout');
  const [loading, setLoading] = useState(false);
  const [outputPatch, setOutputPatch] = useState<string | null>(null);

  const generatePatch = () => {
    setLoading(true);
    setTimeout(() => {
      // Mocked assembly patch output matching JMP relative instructions
      setOutputPatch(`// Generated patch payload for payment.process_checkout
// Opcode redirection: E9 2A 1F 00 00
0x7fffb8a1c900:  E9 2A 1F 00 00     JMP 0x7fffb8a1e82f
0x7fffb8a1e82f:  48 83 FA 0A        CMP RDX, 10
0x7fffb8a1e833:  7C 05              JL  0x7fffb8a1e83a
0x7fffb8a1e835:  31 C0              XOR EAX, EAX
0x7fffb8a1e837:  C3                 RET
0x7fffb8a1e83a:  48 8B 04 D0        MOV RAX, [RAX+RDX*8]
0x7fffb8a1e83e:  E9 BD E0 FF FF     JMP 0x7fffb8a1c905`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <Sparkles size={20} className="text-[#66fcf1]" />
        <h2 className="text-lg font-bold text-white tracking-tight">AI Patch Copilot</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase font-semibold mb-2">
            Natural Language Patch Instruction
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-black/40 border border-gray-850 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#66fcf1]"
            />
            <button
              onClick={generatePatch}
              disabled={loading}
              className="bg-[#1f2833] hover:bg-[#2c3540] text-white px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-800 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Synthesizing...' : 'Generate'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {outputPatch && (
          <div className="mt-4 border border-gray-850 rounded-xl overflow-hidden">
            <div className="bg-[#151824] px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs text-[#66fcf1] font-mono">
              <div className="flex items-center gap-1.5">
                <Terminal size={14} />
                <span>Bytecode Assembly Redirection</span>
              </div>
              <span className="text-[10px] text-gray-500">Target: x86_64</span>
            </div>
            <div className="p-4 bg-black/30 font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto">
              <pre>{outputPatch}</pre>
            </div>
            <div className="bg-[#151824] p-3 border-t border-gray-800 flex justify-end">
              <button className="bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] text-black px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(102,252,241,0.15)] hover:opacity-95 transition-all">
                <Play size={12} />
                <span>Verify & Stage Patch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
