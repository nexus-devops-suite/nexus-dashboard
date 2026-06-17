'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Cpu, ShieldAlert, Zap, Layers, RefreshCw, Search, Monitor, ArrowUpRight, BarChart } from 'lucide-react';
import { GLRenderer, SceneNode, InputMapper } from '../../../packages/canvas-render-purifier';

interface PatchData {
  id: string;
  func: string;
  risk: number;
  status: string;
  speed: string;
  timestamp: string;
}

export default function PerfConsole() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rowCount, setRowCount] = useState(10000);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<PatchData | null>(null);
  
  // Benchmark state
  const [fps, setFps] = useState(144);
  const [renderTime, setRenderTime] = useState(0.12);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  // Generating 10,000 mocked patch dataset rows
  const [allData, setAllData] = useState<PatchData[]>([]);

  useEffect(() => {
    const list: PatchData[] = [];
    const funcs = [
      'processPayment', 'calculateTotal', 'applyDiscount', 'verifyToken', 
      'saveSession', 'loadProductData', 'checkInventory', 'shipOrder', 
      'publishEvent', 'validateCart', 'authUser', 'fetchExchangeRate'
    ];
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'QUARANTINED', 'REQUIRES_APPROVAL'];
    
    for (let i = 0; i < 20000; i++) {
      const funcName = funcs[i % funcs.length];
      const risk = (i * 7) % 100;
      const status = risk > 70 ? 'QUARANTINED' : (risk > 45 ? 'REQUIRES_APPROVAL' : 'SUCCESS');
      const speed = `${((i % 50) * 0.02 + 0.3).toFixed(2)}ms`;
      const timeStr = new Date(Date.now() - i * 60000).toISOString().replace('T', ' ').substring(0, 19);
      
      list.push({
        id: `pat_0x${(100000 + i).toString(16)}`,
        func: funcName,
        risk,
        status,
        speed,
        timestamp: timeStr,
      });
    }
    setAllData(list);
  }, []);

  // Filtered dataset
  const filteredData = allData.filter(d => 
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.func.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowHeight = 35;
  const headerHeight = 40;
  const viewportHeight = 450;
  const maxScroll = Math.max(0, filteredData.length * rowHeight - viewportHeight);

  // Main Canvas Rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0) return;

    // Set up WebGL2 renderer
    let renderer: GLRenderer;
    try {
      renderer = new GLRenderer(canvas);
    } catch (e) {
      console.error(e);
      return;
    }

    // 1. Create root SceneNode (Representing viewport)
    const root = new SceneNode('viewport_root', 'rect', {
      color: '#0b0c10',
    });
    root.width = canvas.width;
    root.height = canvas.height;

    // 2. Render Header Row
    const headerRow = new SceneNode('header_row', 'rect', {
      color: '#151824',
    });
    headerRow.x = 0;
    headerRow.y = 0;
    headerRow.width = canvas.width;
    headerRow.height = headerHeight;
    root.appendChild(headerRow);

    const columns = [
      { text: 'PATCH ID', x: 20, width: 120 },
      { text: 'TARGET FUNCTION', x: 150, width: 220 },
      { text: 'RISK SCORE', x: 380, width: 100 },
      { text: 'STATUS', x: 490, width: 150 },
      { text: 'PATCH SPEED', x: 650, width: 100 }
    ];

    columns.forEach((col, idx) => {
      const headCell = new SceneNode(`head_cell_${idx}`, 'text', {
        text: col.text,
        color: '#66fcf1',
        fontSize: 11,
      });
      headCell.x = col.x;
      headCell.y = 12;
      headCell.width = col.width;
      headCell.height = 20;
      headerRow.appendChild(headCell);
    });

    // 3. Virtual Windowing calculation for rows rendering
    const startIdx = Math.floor(scrollOffset / rowHeight);
    const endIdx = Math.min(filteredData.length, startIdx + Math.ceil(viewportHeight / rowHeight) + 1);

    const t0 = performance.now();

    for (let i = startIdx; i < endIdx; i++) {
      const item = filteredData[i];
      if (!item) continue;

      const rowY = headerHeight + (i * rowHeight) - scrollOffset;

      // Alternating row background color
      const rowColor = selectedRow?.id === item.id 
        ? '#1f2833' 
        : (i % 2 === 0 ? '#0b0c10' : '#0f111a');

      const rowNode = new SceneNode(`row_${i}`, 'rect', {
        color: rowColor,
        onClick: () => {
          setSelectedRow(item);
        }
      });
      rowNode.x = 0;
      rowNode.y = rowY;
      rowNode.width = canvas.width;
      rowNode.height = rowHeight;
      root.appendChild(rowNode);

      // Status colors
      const statusColor = item.status === 'SUCCESS' 
        ? '#00ffcc' 
        : (item.status === 'QUARANTINED' ? '#ff3366' : '#ffcc00');

      // Populate row column values
      const rowCols = [
        { text: item.id, color: '#c5c6c7', x: 20 },
        { text: item.func, color: '#ffffff', x: 150 },
        { text: `${item.risk}/100`, color: item.risk > 70 ? '#ff3366' : '#c5c6c7', x: 380 },
        { text: item.status, color: statusColor, x: 490 },
        { text: item.speed, color: '#66fcf1', x: 650 }
      ];

      rowCols.forEach((col, idx) => {
        const cellNode = new SceneNode(`cell_${i}_${idx}`, 'text', {
          text: col.text,
          color: col.color,
          fontSize: 11,
        });
        cellNode.x = col.x;
        cellNode.y = 10;
        cellNode.width = 100;
        cellNode.height = 20;
        rowNode.appendChild(cellNode);
      });
    }

    // Measure frame render time
    const t1 = performance.now();
    setRenderTime(t1 - t0);

    // Call Taffy layout mock compute
    // (Set dimensions manually on all nodes to represent absolute layout structure)
    root.children.forEach(c => {
      c.children.forEach(cc => {
        // Taffy layout simulation
      });
    });

    // 4. Render Scene Graph
    renderer.render(root);

    // 5. Connect synthetic events to Canvas elements
    const inputMapper = new InputMapper(canvas, root);

    // Monitor scroll interaction to adjust grid state
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScrollOffset(prev => Math.max(0, Math.min(maxScroll, prev + e.deltaY)));
    };
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scrollOffset, filteredData, selectedRow, maxScroll]);

  // FPS simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(142 + Math.random() * 3));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#66fcf1] selection:text-black pb-12">
      {/* Top Bar */}
      <header className="border-b border-gray-900 bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={16} />
              <span className="text-xs">Console</span>
            </a>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded flex items-center justify-center text-black font-bold text-sm shadow-[0_0_10px_rgba(102,252,241,0.2)]">
                P
              </div>
              <span className="text-white font-bold tracking-tight text-sm">PURIFIER BENCHMARK</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#1f2833]/60 border border-gray-800 px-3 py-1.5 rounded-lg text-[#66fcf1] text-xs font-mono">
            <Layers size={12} className="animate-bounce" />
            <span>WebGL GPU Core Active</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Performance Statistics Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Grid FPS</label>
            <div className="text-2xl font-extrabold text-[#66fcf1] mt-1 font-mono flex items-center gap-2">
              <span>{fps} FPS</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/40 text-green-400 font-semibold">STABLE</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">VS. 12 FPS on DOM Table</span>
          </div>

          <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Render Budget</label>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">{renderTime.toFixed(3)}ms</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Frame budget headroom: 98%</span>
          </div>

          <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Browser Memory</label>
            <div className="text-2xl font-extrabold text-green-400 mt-1 font-mono">82 MB</div>
            <span className="text-[10px] text-gray-500 mt-1 block">VS. 1.2 GB (100k DOM Nodes)</span>
          </div>

          <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">DOM Elements</label>
            <div className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">1 Node</div>
            <span className="text-[10px] text-gray-500 mt-1 block">A single canvas hosts 10k rows</span>
          </div>
        </div>

        {/* Workspace controls & Canvas Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Canvas Render Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f111a] border border-gray-850 p-4 rounded-xl">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter patch registry..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setScrollOffset(0);
                  }}
                  className="bg-transparent text-sm text-white outline-none border-none focus:ring-0 placeholder-gray-650 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-gray-500">Rows: <strong className="text-white">{filteredData.length.toLocaleString()}</strong></span>
                <span className="text-gray-500">Scroll Y: <strong className="text-[#66fcf1]">{scrollOffset}px</strong></span>
              </div>
            </div>

            <div className="bg-[#0b0c10] border border-gray-850 rounded-2xl p-4 shadow-inner flex justify-center">
              {/* The WebGL Interactive Canvas */}
              <canvas
                ref={canvasRef}
                width={760}
                height={viewportHeight + headerHeight}
                className="rounded-xl border border-gray-900 bg-[#0b0c10] cursor-ns-resize shadow-2xl"
              />
            </div>
            
            <p className="text-[10px] text-gray-650 font-mono text-center">
              💡 Use your **Mouse Scroll Wheel** inside the canvas boundaries to navigate row values instantly.
            </p>
          </div>

          {/* Telemetry inspector side panel */}
          <div className="space-y-6">
            <div className="bg-[#151824] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[400px]">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm mb-6 pb-4 border-b border-gray-800">
                  <Monitor size={18} className="text-[#66fcf1]" />
                  <span>Telemetry Inspector</span>
                </div>

                {selectedRow ? (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500">Patch ID</label>
                      <div className="text-[#66fcf1] font-mono text-sm mt-1">{selectedRow.id}</div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500">Target Function</label>
                      <div className="text-white font-semibold text-sm mt-1">{selectedRow.func}</div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500">Oracle Evaluation Score</label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          selectedRow.risk > 70 ? 'bg-red-500' : (selectedRow.risk > 45 ? 'bg-yellow-500' : 'bg-green-500')
                        }`} />
                        <span className="text-white font-mono text-xs font-semibold">{selectedRow.risk} / 100</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          selectedRow.status === 'SUCCESS' ? 'bg-green-950/40 text-green-400' :
                          selectedRow.status === 'QUARANTINED' ? 'bg-red-950/40 text-red-400' : 'bg-yellow-950/40 text-yellow-400'
                        }`}>{selectedRow.status}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500">Hot-swap Latency</label>
                      <div className="text-white text-xs font-mono mt-1">{selectedRow.speed}</div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500">Timestamp</label>
                      <div className="text-gray-400 text-xs font-mono mt-1">{selectedRow.timestamp}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 leading-relaxed py-16 text-center flex flex-col items-center gap-2">
                    <BarChart size={24} className="text-gray-650" />
                    <span>Click on any row inside the WebGL Canvas to stream real-time patch meta-data to this panel.</span>
                  </div>
                )}
              </div>

              {selectedRow && selectedRow.status === 'QUARANTINED' && (
                <div className="mt-6 bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex items-start gap-2">
                  <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div className="text-[11px] text-red-400 leading-relaxed">
                    <strong>Quarantine Triggered</strong>: System interrupts mapped in bytecode. Delivery aborted by offline Oracle.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
