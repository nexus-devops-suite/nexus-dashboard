'use client';

import React, { useState } from 'react';
import { Key, Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function TokenManagement() {
  const [token, setToken] = useState('tok_acme_prod_99f3b7d1e8c92a5436f011');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateToken = () => {
    setGenerating(true);
    setTimeout(() => {
      const chars = 'abcdef0123456789';
      let randToken = 'tok_acme_prod_';
      for (let i = 0; i < 22; i++) {
        randToken += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setToken(randToken);
      setGenerating(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1f2833] p-3 rounded-lg text-[#66fcf1]">
            <Key size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Organization Access Tokens</h1>
            <p className="text-gray-400 text-sm">Configure authentication credentials for CLI tools and Docker agents.</p>
          </div>
        </div>

        <div className="bg-[#0f111a] border border-gray-850 rounded-xl p-6 shadow-xl">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Active Organization Agent Token
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 bg-black/40 border border-gray-850 rounded-lg overflow-hidden flex items-center px-4 font-mono text-sm text-[#66fcf1]">
              <input
                type={showToken ? 'text' : 'password'}
                readOnly
                value={token}
                className="bg-transparent outline-none w-full border-none pr-10 text-[#66fcf1] focus:ring-0 focus:outline-none"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 text-gray-500 hover:text-gray-300"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <button
              onClick={copyToClipboard}
              className="bg-[#1f2833] hover:bg-[#2c3540] text-white px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-800 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-800">
            <div className="text-xs text-gray-500">
              Generated tokens grant read/write privileges to all associated daemon runtimes.
            </div>
            <button
              onClick={regenerateToken}
              disabled={generating}
              className="text-[#66fcf1] text-xs font-semibold flex items-center gap-1.5 hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              <span>Regenerate Token</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
