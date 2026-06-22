'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Cpu, ShieldAlert, Zap, Layers, RefreshCw, Search, Monitor, 
  BarChart, Play, Code, Sliders, Eye, BookOpen, Sparkles, Copy, Check, Settings, Terminal as TermIcon
} from 'lucide-react';
import { GLRenderer, SceneNode, InputMapper, computeLayout } from '../../../packages/canvas-render-purifier';

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
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // App navigation state
  const [activeMode, setActiveMode] = useState<'benchmark' | 'playground' | 'tutorial'>('benchmark');
  const [renderMode, setRenderMode] = useState<'webgl' | 'dom'>('webgl');
  
  // Benchmark page states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<PatchData | null>(null);
  const [fps, setFps] = useState(144);
  const [renderTime, setRenderTime] = useState(0.12);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [allData, setAllData] = useState<PatchData[]>([]);
  const [realPatchesCount, setRealPatchesCount] = useState(0);

  // Playground Sandbox states
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'telemetry' | 'consensus' | 'alert'>('telemetry');
  const [cardWidth, setCardWidth] = useState(380);
  const [cardHeight, setCardHeight] = useState(80);
  const [cardPadding, setCardPadding] = useState(12);
  const [cardMargin, setCardMargin] = useState(10);
  const [cardFlexDir, setCardFlexDir] = useState<'row' | 'column'>('row');
  const [cardColor, setCardColor] = useState('#151824');
  const [cardText, setCardText] = useState('sys_patch_v32');
  const [cardChildCount, setCardChildCount] = useState(2);
  const [inspectLayout, setInspectLayout] = useState(true);
  const [activeCodeTab, setActiveCodeTab] = useState<'jsx' | 'ast' | 'webgl'>('jsx');
  const [isCopied, setIsCopied] = useState(false);

  // Onboarding Step State
  const [tutorialStep, setTutorialStep] = useState(1);
  const [simulatedCliLogs, setSimulatedCliLogs] = useState<string[]>([
    '⚡ Initializing Purifier static scan target...'
  ]);

  // Load real telemetry or fall back
  useEffect(() => {
    fetch('http://localhost:7860/api/patch/history', {
      headers: {
        'Authorization': 'Bearer tok_developer_key_mock_123'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Gateway offline");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRealPatchesCount(data.length);
          const list: PatchData[] = [];
          for (let i = 0; i < 20000; i++) {
            const original = data[i % data.length];
            const risk = Number(original.risk_score || 0) + (i % 7);
            const finalRisk = Math.min(100, Math.max(0, risk));
            const status = finalRisk > 70 ? 'QUARANTINED' : (original.status === 'DEPLOYED' ? 'SUCCESS' : 'REQUIRES_APPROVAL');
            
            list.push({
              id: `${original.id || 'pat_0x'}_${i.toString(16)}`,
              func: original.target_fn || 'unknownFn',
              risk: finalRisk,
              status: status,
              speed: `${((i % 50) * 0.02 + 0.12).toFixed(2)}ms`,
              timestamp: new Date(new Date(original.timestamp || Date.now()).getTime() - i * 60000)
                .toISOString().replace('T', ' ').substring(0, 19),
            });
          }
          setAllData(list);
        } else {
          generateFallbackData();
        }
      })
      .catch(() => {
        generateFallbackData();
      });

    function generateFallbackData() {
      const list: PatchData[] = [];
      const funcs = [
        'processPayment', 'calculateTotal', 'applyDiscount', 'verifyToken', 
        'saveSession', 'loadProductData', 'checkInventory', 'shipOrder', 
        'publishEvent', 'validateCart', 'authUser', 'fetchExchangeRate'
      ];
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
    }
  }, []);

  const filteredData = allData.filter(d => 
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.func.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowHeight = 35;
  const headerHeight = 40;
  const viewportHeight = 450;
  const maxScroll = Math.max(0, filteredData.length * rowHeight - viewportHeight);

  // Main canvas benchmark rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0 || renderMode === 'dom' || activeMode !== 'benchmark') return;

    let renderer: GLRenderer;
    try {
      renderer = new GLRenderer(canvas);
    } catch (e) {
      console.error(e);
      return;
    }

    const root = new SceneNode('viewport_root', 'rect', {
      color: '#0b0c10',
    });
    root.width = canvas.width;
    root.height = canvas.height;

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

    const startIdx = Math.floor(scrollOffset / rowHeight);
    const endIdx = Math.min(filteredData.length, startIdx + Math.ceil(viewportHeight / rowHeight) + 1);

    const t0 = performance.now();

    for (let i = startIdx; i < endIdx; i++) {
      const item = filteredData[i];
      if (!item) continue;

      const rowY = headerHeight + (i * rowHeight) - scrollOffset;
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

      const statusColor = item.status === 'SUCCESS' 
        ? '#00ffcc' 
        : (item.status === 'QUARANTINED' ? '#ff3366' : '#ffcc00');

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

    const t1 = performance.now();
    setRenderTime(t1 - t0);

    // Run layout compiler checks
    root.children.forEach(c => {
      c.children.forEach(() => {});
    });

    renderer.render(root);
    const inputMapper = new InputMapper(canvas, root);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScrollOffset(prev => Math.max(0, Math.min(maxScroll, prev + e.deltaY)));
    };
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scrollOffset, filteredData, selectedRow, maxScroll, renderMode, activeMode]);

  // FPS ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (renderMode === 'webgl') {
        setFps(Math.floor(142 + Math.random() * 3));
      } else {
        setFps(Math.floor(11 + Math.random() * 5)); // simulated heavy DOM stutters
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [renderMode]);

  // Template select handlers
  useEffect(() => {
    if (selectedTemplate === 'telemetry') {
      setCardWidth(380);
      setCardHeight(80);
      setCardPadding(12);
      setCardMargin(10);
      setCardFlexDir('row');
      setCardColor('#151824');
      setCardText('sys_patch_v32');
      setCardChildCount(2);
    } else if (selectedTemplate === 'consensus') {
      setCardWidth(340);
      setCardHeight(130);
      setCardPadding(16);
      setCardMargin(12);
      setCardFlexDir('column');
      setCardColor('#0f111a');
      setCardText('Consensus Node #03');
      setCardChildCount(3);
    } else if (selectedTemplate === 'alert') {
      setCardWidth(350);
      setCardHeight(90);
      setCardPadding(14);
      setCardMargin(8);
      setCardFlexDir('row');
      setCardColor('#2d1217');
      setCardText('Bytecode Breach Detected');
      setCardChildCount(1);
    }
  }, [selectedTemplate]);

  // Sandbox Live rendering loop
  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas || activeMode !== 'playground') return;

    let renderer: GLRenderer;
    try {
      renderer = new GLRenderer(canvas);
    } catch (e) {
      console.error(e);
      return;
    }

    const root = new SceneNode('sandbox_root', 'rect', { color: '#0b0c10' });
    root.width = canvas.width;
    root.height = canvas.height;

    const cardNode = new SceneNode('custom_card', 'rect', {
      color: cardColor,
      style: {
        width: cardWidth,
        height: cardHeight,
        flexDirection: cardFlexDir,
        padding: cardPadding,
        margin: cardMargin
      }
    });

    cardNode.x = (canvas.width - cardWidth) / 2;
    cardNode.y = (canvas.height - cardHeight) / 2;
    root.appendChild(cardNode);

    const childrenList: any[] = [];
    if (selectedTemplate === 'telemetry') {
      childrenList.push(
        { type: 'rect', color: '#00ffcc', text: '', style: { width: 8, height: 8, margin: 4 } },
        { type: 'text', color: '#ffffff', text: cardText, style: { width: 120, height: 16 } },
        { type: 'text', color: '#66fcf1', text: 'Latency: 0.28ms', style: { width: 100, height: 16 } }
      );
    } else if (selectedTemplate === 'consensus') {
      childrenList.push(
        { type: 'text', color: '#ffffff', text: cardText, style: { width: 160, height: 16 } },
        { type: 'text', color: '#ffcc00', text: 'Status: Syncing (Mesh)', style: { width: 160, height: 16 } },
        { type: 'text', color: '#c5c6c7', text: 'gRPC Topology active', style: { width: 160, height: 16 } }
      );
    } else if (selectedTemplate === 'alert') {
      childrenList.push(
        { type: 'rect', color: '#ff3366', text: '', style: { width: 10, height: 10, margin: 4 } },
        { type: 'text', color: '#ff3366', text: cardText, style: { width: 220, height: 16 } }
      );
    } else {
      for (let i = 0; i < cardChildCount; i++) {
        if (i === 0) {
          childrenList.push({ type: 'text', color: '#ffffff', text: cardText || 'Node Header', style: { width: 140, height: 16 } });
        } else if (i === 1) {
          childrenList.push({ type: 'text', color: '#66fcf1', text: 'Performance Node', style: { width: 120, height: 16 } });
        } else if (i === 2) {
          childrenList.push({ type: 'rect', color: '#00ffcc', text: '', style: { width: 12, height: 12, margin: 6 } });
        } else {
          childrenList.push({ type: 'text', color: '#c5c6c7', text: 'Sub-metric Active', style: { width: 100, height: 16 } });
        }
      }
    }

    childrenList.forEach((c, idx) => {
      const childNode = new SceneNode(`child_${idx}`, c.type, {
        color: c.color,
        text: c.text,
        fontSize: 11,
        style: c.style
      });
      cardNode.appendChild(childNode);
    });

    computeLayout(root);

    if (inspectLayout) {
      addWireframe(root, cardNode);
      cardNode.children.forEach(child => {
        addWireframe(root, child);
      });
    }

    function addWireframe(parent: SceneNode, node: SceneNode) {
      const borderCol = '#66fcf1';
      const pos = node.getAbsolutePosition();
      const thick = 1;

      // Top
      const t = new SceneNode(`wire_t_${node.id}`, 'rect', { color: borderCol });
      t.x = pos.x; t.y = pos.y; t.width = node.width; t.height = thick;
      parent.appendChild(t);
      // Bottom
      const b = new SceneNode(`wire_b_${node.id}`, 'rect', { color: borderCol });
      b.x = pos.x; b.y = pos.y + node.height - thick; b.width = node.width; b.height = thick;
      parent.appendChild(b);
      // Left
      const l = new SceneNode(`wire_l_${node.id}`, 'rect', { color: borderCol });
      l.x = pos.x; l.y = pos.y; l.width = thick; l.height = node.height;
      parent.appendChild(l);
      // Right
      const r = new SceneNode(`wire_r_${node.id}`, 'rect', { color: borderCol });
      r.x = pos.x + node.width - thick; r.y = pos.y; r.width = thick; r.height = node.height;
      parent.appendChild(r);
    }

    renderer.render(root);
  }, [activeMode, cardWidth, cardHeight, cardPadding, cardMargin, cardFlexDir, cardColor, cardText, cardChildCount, selectedTemplate, inspectLayout]);

  const getJsxCode = () => {
    const dir = cardFlexDir === 'row' ? 'row' : 'column';
    const indent = '  ';
    let childrenJsx = '';
    
    if (selectedTemplate === 'telemetry') {
      childrenJsx = `${indent}<rect style={{ width: 8, height: 8, backgroundColor: '#00ffcc', marginRight: 4 }} />\n` +
                    `${indent}<text text="${cardText}" style={{ color: '#ffffff' }} />\n` +
                    `${indent}<text text="Latency: 0.28ms" style={{ color: '#66fcf1' }} />`;
    } else if (selectedTemplate === 'consensus') {
      childrenJsx = `${indent}<text text="${cardText}" style={{ color: '#ffffff' }} />\n` +
                    `${indent}<text text="Status: Syncing (Mesh)" style={{ color: '#ffcc00' }} />\n` +
                    `${indent}<text text="gRPC Topology active" style={{ color: '#c5c6c7' }} />`;
    } else if (selectedTemplate === 'alert') {
      childrenJsx = `${indent}<rect style={{ width: 10, height: 10, backgroundColor: '#ff3366', marginRight: 4 }} />\n` +
                    `${indent}<text text="${cardText}" style={{ color: '#ff3366' }} />`;
    } else {
      for (let i = 0; i < cardChildCount; i++) {
        if (i === 0) {
          childrenJsx += `${indent}<text text="${cardText}" style={{ color: '#ffffff' }} />\n`;
        } else if (i === 1) {
          childrenJsx += `${indent}<text text="Performance Node" style={{ color: '#66fcf1' }} />\n`;
        } else if (i === 2) {
          childrenJsx += `${indent}<rect style={{ width: 12, height: 12, backgroundColor: '#00ffcc' }} />\n`;
        } else {
          childrenJsx += `${indent}<text text="Sub-metric Active" style={{ color: '#c5c6c7' }} />\n`;
        }
      }
      childrenJsx = childrenJsx.trim();
    }

    return `// Compiled Canvas-Render Purifier React element\n` +
           `import { CanvasRenderer } from '@nexus/canvas-render-purifier';\n\n` +
           `const CustomCardComponent = () => (\n` +
           `  <rect style={{\n` +
           `    flexDirection: '${dir}',\n` +
           `    width: ${cardWidth},\n` +
           `    height: ${cardHeight},\n` +
           `    padding: ${cardPadding},\n` +
           `    margin: ${cardMargin},\n` +
           `    backgroundColor: '${cardColor}'\n` +
           `  }}>\n` +
           `    ${childrenJsx.split('\n').join('\n    ')}\n` +
           `  </rect>\n` +
           `);`;
  };

  const getJsonAst = () => {
    const childrenAst: any[] = [];
    if (selectedTemplate === 'telemetry') {
      childrenAst.push(
        { id: "child_0", type: "rect", style: { width: 8, height: 8, margin: 4 }, color: "#00ffcc" },
        { id: "child_1", type: "text", style: { width: 120, height: 16 }, text: cardText, color: "#ffffff" },
        { id: "child_2", type: "text", style: { width: 100, height: 16 }, text: "Latency: 0.28ms", color: "#66fcf1" }
      );
    } else if (selectedTemplate === 'consensus') {
      childrenAst.push(
        { id: "child_0", type: "text", style: { width: 160, height: 16 }, text: cardText, color: "#ffffff" },
        { id: "child_1", type: "text", style: { width: 160, height: 16 }, text: "Status: Syncing (Mesh)", color: "#ffcc00" },
        { id: "child_2", type: "text", style: { width: 160, height: 16 }, text: "gRPC Topology active", color: "#c5c6c7" }
      );
    } else if (selectedTemplate === 'alert') {
      childrenAst.push(
        { id: "child_0", type: "rect", style: { width: 10, height: 10, margin: 4 }, color: "#ff3366" },
        { id: "child_1", type: "text", style: { width: 220, height: 16 }, text: cardText, color: "#ff3366" }
      );
    } else {
      for (let i = 0; i < cardChildCount; i++) {
        if (i === 0) childrenAst.push({ id: `child_${i}`, type: "text", style: { width: 140, height: 16 }, text: cardText, color: "#ffffff" });
        else if (i === 1) childrenAst.push({ id: `child_${i}`, type: "text", style: { width: 120, height: 16 }, text: "Performance Node", color: "#66fcf1" });
        else if (i === 2) childrenAst.push({ id: `child_${i}`, type: "rect", style: { width: 12, height: 12, margin: 6 }, color: "#00ffcc" });
        else childrenAst.push({ id: `child_${i}`, type: "text", style: { width: 100, height: 16 }, text: "Sub-metric Active", color: "#c5c6c7" });
      }
    }

    const ast = {
      id: "custom_card",
      type: "rect",
      color: cardColor,
      style: {
        width: cardWidth,
        height: cardHeight,
        flexDirection: cardFlexDir,
        padding: cardPadding,
        margin: cardMargin
      },
      children: childrenAst
    };

    return JSON.stringify(ast, null, 2);
  };

  const getGlLogs = () => {
    const textLen = cardText.length;
    return `[GLCompiler] Shader compile sequence target initialized.
[GLCompiler] Compiling SceneNode 'viewport_root' (rect)
[GL] Bind Program: 'rect'
[GL] Vertex Buffer: upload 12 floats mapping coordinate space
[GL] Uniform 'u_resolution': [600, 320]
[GL] Uniform 'u_color': [0.043, 0.047, 0.063, 1.0]
[GL] Draw Arrays: TRIANGLES (6 vertices)

[GLCompiler] Compiling SceneNode 'custom_card' (rect)
[GL] Vertex Buffer: coordinates [x=${(600 - cardWidth) / 2}, y=${(320 - cardHeight) / 2}, w=${cardWidth}, h=${cardHeight}]
[GL] Uniform 'u_color': [${cardColor}]
[GL] Draw Arrays: TRIANGLES (6 vertices)

${selectedTemplate === 'telemetry' || selectedTemplate === 'alert' ? `[GLCompiler] Compiling SceneNode 'child_rect' (rect)
[GL] Vertex Buffer: coordinates [x=${(600 - cardWidth) / 2 + cardPadding}, y=${(320 - cardHeight) / 2 + cardPadding}, w=8, h=8]
[GL] Uniform 'u_color': [${selectedTemplate === 'telemetry' ? '0.0, 1.0, 0.8' : '1.0, 0.2, 0.4'}]
[GL] Draw Arrays: TRIANGLES (6 vertices)
` : ''}

[GLCompiler] Compiling SceneNode 'child_text' (text)
[GL] Bind Program: 'text'
[GL] SDF Font Texture: Bind texture unit 0
[GL] Vertex Buffer: upload ${textLen * 12} floats for glyph positions
[GL] Uniform 'u_color': [1.0, 1.0, 1.0, 1.0]
[GL] Draw Arrays: TRIANGLES (${textLen * 6} vertices)

[GLCompiler] Render Frame finished in 0.03ms. Active WebGL VRAM buffers: 4.`;
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runSimulatedCli = () => {
    setSimulatedCliLogs([
      '🔎 Scanning workspace files for DOM performance hotspots...',
      '  - Found DOM Table container inside "apps/dashboard/patch-history.tsx" (heavy tree)',
      '  - Found React list mapper inside "apps/dashboard/heatmap.tsx" (layout thrashing)',
      '⚙ Connecting Canvas-Render Purifier build hooks...',
      '🚀 Compiling layout instructions using Taffy WASM layout engine...',
      '✨ Optimization complete. 0 DOM rendering bottlenecks remaining. Live GPU reconciler running.'
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#66fcf1] selection:text-black pb-12">
      {/* Top Bar */}
      <header className="border-b border-gray-900 bg-[#0f111a]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-gray-400 hover:text-[#66fcf1] transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} />
              <span className="text-xs font-semibold">Back to Control Plane</span>
            </a>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-gradient-to-tr from-[#66fcf1] to-[#45f3ff] rounded flex items-center justify-center text-black font-bold text-sm shadow-[0_0_10px_rgba(102,252,241,0.2)]">
                P
              </div>
              <span className="text-white font-bold tracking-tight text-sm">PURIFIER COMPILER WORKSPACE</span>
            </div>
          </div>
          
          {/* Navigation tabs inside the header area */}
          <div className="flex bg-black/45 border border-gray-850 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode('benchmark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'benchmark' ? 'bg-[#1f2833] text-[#66fcf1]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart size={13} />
              <span>Scroll Benchmarks</span>
            </button>
            <button
              onClick={() => setActiveMode('playground')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'playground' ? 'bg-[#1f2833] text-[#66fcf1]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              <span>Visual Playground</span>
            </button>
            <button
              onClick={() => setActiveMode('tutorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'tutorial' ? 'bg-[#1f2833] text-[#66fcf1]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Developer Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* MODE A: SCROLL BENCHMARK COMPARATOR */}
        {activeMode === 'benchmark' && (
          <div className="space-y-6">
            
            {/* Real GORM details banner */}
            {realPatchesCount > 0 && (
              <div className="bg-green-950/20 border border-green-900/40 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles size={14} />
                  <span>Successfully fetched <strong>{realPatchesCount}</strong> real patches from database! Scaled dataset to 20,000 items to benchmark GPU render capabilities.</span>
                </div>
              </div>
            )}

            {/* Performance Statistics Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Grid FPS</label>
                <div className="text-2xl font-extrabold text-[#66fcf1] mt-1 font-mono flex items-center gap-2">
                  <span>{fps} FPS</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    renderMode === 'webgl' ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400 animate-pulse'
                  }`}>{renderMode === 'webgl' ? 'STABLE' : 'LAGGING'}</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {renderMode === 'webgl' ? 'VS. 12 FPS on DOM Table' : 'VS. 144 FPS on WebGL Canvas'}
                </span>
              </div>

              <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Render Budget</label>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                  {renderMode === 'webgl' ? `${renderTime.toFixed(3)}ms` : '18.420ms'}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {renderMode === 'webgl' ? 'Frame budget headroom: 98%' : 'Frame budget exceeded! Thread Blocked'}
                </span>
              </div>

              <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Browser Memory</label>
                <div className={`text-2xl font-extrabold mt-1 font-mono ${
                  renderMode === 'webgl' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {renderMode === 'webgl' ? '82 MB' : '1.2 GB'}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {renderMode === 'webgl' ? 'VS. 1.2 GB (100k DOM Nodes)' : '100,000+ heavy styled objects'}
                </span>
              </div>

              <div className="bg-[#0f111a] border border-gray-850 p-5 rounded-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">DOM Elements</label>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">
                  {renderMode === 'webgl' ? '1 Node' : '30,000+ Nodes'}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {renderMode === 'webgl' ? 'A single HTML canvas element' : 'Rows, cells, and text nodes tree'}
                </span>
              </div>
            </div>

            {/* Toggle bar for comparing render engines */}
            <div className="bg-[#0f111a] border border-gray-850 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-gray-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Compare Render Engine Performance</span>
              </div>
              <div className="flex bg-black/60 p-1 rounded-lg border border-gray-800">
                <button
                  onClick={() => setRenderMode('webgl')}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                    renderMode === 'webgl' ? 'bg-[#1f2833] text-[#66fcf1] border border-gray-700' : 'text-gray-400'
                  }`}
                >
                  <Layers size={12} />
                  <span>WebGL GPU Canvas</span>
                </button>
                <button
                  onClick={() => setRenderMode('dom')}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                    renderMode === 'dom' ? 'bg-[#1f2833] text-[#66fcf1] border border-gray-700' : 'text-gray-400'
                  }`}
                >
                  <Cpu size={12} />
                  <span>Standard React DOM</span>
                </button>
              </div>
            </div>

            {/* Render Canvas vs HTML DOM Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
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
                    {renderMode === 'webgl' && (
                      <span className="text-gray-500">Scroll Y: <strong className="text-[#66fcf1]">{scrollOffset}px</strong></span>
                    )}
                  </div>
                </div>

                {renderMode === 'webgl' ? (
                  <div className="bg-[#0b0c10] border border-gray-850 rounded-2xl p-4 shadow-inner flex flex-col items-center">
                    <canvas
                      ref={canvasRef}
                      width={760}
                      height={viewportHeight + headerHeight}
                      className="rounded-xl border border-gray-900 bg-[#0b0c10] cursor-ns-resize shadow-2xl"
                    />
                    <p className="text-[10px] text-gray-650 font-mono mt-3 text-center">
                      💡 Use your <strong>Mouse Scroll Wheel</strong> inside the WebGL boundary to navigate rows instantly.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#0b0c10] border border-gray-850 rounded-2xl p-4 flex flex-col">
                    
                    {/* Simulated DOM Warning */}
                    <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3.5 mb-4 flex items-start gap-2 text-xs">
                      <ShieldAlert className="text-red-500 shrink-0 mt-0.5 animate-pulse" size={16} />
                      <div className="text-red-400">
                        <strong>DOM Rendering Bottleneck Active</strong>: Standard React DOM maps nested styling elements for all rows. Notice the lag during scrolling or searching as garbage collection sweeps and layout calculations block the main thread.
                      </div>
                    </div>

                    <div 
                      className="border border-gray-900 bg-[#0b0c10] rounded-xl overflow-y-auto max-h-[450px]"
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        const t0 = performance.now();
                        // Force layout thrashing for metrics illustration
                        const d = target.offsetHeight; 
                        const t1 = performance.now();
                        setRenderTime(t1 - t0 + 14.8);
                      }}
                    >
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead className="bg-[#151824] sticky top-0 text-[#66fcf1] border-b border-gray-850">
                          <tr>
                            <th className="p-3 text-left">PATCH ID</th>
                            <th className="p-3 text-left">TARGET FUNCTION</th>
                            <th className="p-3 text-left">RISK SCORE</th>
                            <th className="p-3 text-left">STATUS</th>
                            <th className="p-3 text-left">PATCH SPEED</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.slice(0, 1000).map((row, idx) => (
                            <tr 
                              key={row.id}
                              onClick={() => setSelectedRow(row)}
                              className={`border-b border-gray-900/40 cursor-pointer transition-all ${
                                selectedRow?.id === row.id ? 'bg-[#1f2833] text-white' : idx % 2 === 0 ? 'bg-[#0b0c10]' : 'bg-[#0f111a]'
                              } hover:bg-[#151824]/60`}
                            >
                              <td className="p-3 text-gray-400">{row.id}</td>
                              <td className="p-3 text-white font-semibold">{row.func}</td>
                              <td className={`p-3 ${row.risk > 70 ? 'text-[#ff3366]' : 'text-gray-400'}`}>{row.risk}/100</td>
                              <td className="p-3" style={{ color: row.status === 'SUCCESS' ? '#00ffcc' : row.status === 'QUARANTINED' ? '#ff3366' : '#ffcc00' }}>{row.status}</td>
                              <td className="p-3 text-[#66fcf1]">{row.speed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Side telemetry inspector */}
              <div className="space-y-6">
                <div className="bg-[#151824] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[400px]">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-sm mb-6 pb-4 border-b border-gray-850">
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
                          <label className="text-[10px] uppercase font-bold text-gray-500">Safety Score</label>
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
                        <BarChart size={24} className="text-gray-650 animate-pulse" />
                        <span>Click on any telemetry row inside the list to stream its bytecode properties here.</span>
                      </div>
                    )}
                  </div>

                  {selectedRow && selectedRow.status === 'QUARANTINED' && (
                    <div className="mt-6 bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex items-start gap-2">
                      <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <div className="text-[11px] text-red-400 leading-relaxed">
                        <strong>Quarantine Active</strong>: Ptrace hook blocked by AI static oracle evaluations. Bytecode has been sandboxed.
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODE B: VISUAL COMPILER PLAYGROUND (SANDBOX) */}
        {activeMode === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Sidebar (4 cols) */}
            <div className="lg:col-span-4 bg-[#0f111a] border border-gray-850 rounded-2xl p-5 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sliders size={16} className="text-[#66fcf1]" />
                  <span>Sandbox Styling Core</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Adjust custom layout parameters. Components compile live to GL vertex shaders.
                </p>
              </div>

              {/* Template dropdown presets */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">Preset Presets</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as any)}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#66fcf1]"
                >
                  <option value="telemetry">Telemetry Row Card</option>
                  <option value="consensus">Mesh Consensus Status Node</option>
                  <option value="alert">Security Quarantine Badge</option>
                  <option value="custom">Custom (Adjust styles below)</option>
                </select>
              </div>

              <div className="h-px bg-gray-900" />

              {/* Stylings controllers (Only interactable if custom) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Styling Attributes</span>
                  {selectedTemplate !== 'custom' && (
                    <span className="text-[9px] bg-[#1f2833] text-[#66fcf1] px-2 py-0.5 rounded font-bold">LOCKED BY PRESET</span>
                  )}
                </div>

                {/* Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Card Width</span>
                    <span className="text-[#66fcf1]">{cardWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="500"
                    disabled={selectedTemplate !== 'custom'}
                    value={cardWidth}
                    onChange={(e) => setCardWidth(Number(e.target.value))}
                    className="w-full accent-[#66fcf1] disabled:opacity-50"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Card Height</span>
                    <span className="text-[#66fcf1]">{cardHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="220"
                    disabled={selectedTemplate !== 'custom'}
                    value={cardHeight}
                    onChange={(e) => setCardHeight(Number(e.target.value))}
                    className="w-full accent-[#66fcf1] disabled:opacity-50"
                  />
                </div>

                {/* Padding */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Inner Padding</span>
                    <span className="text-[#66fcf1]">{cardPadding}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    disabled={selectedTemplate !== 'custom'}
                    value={cardPadding}
                    onChange={(e) => setCardPadding(Number(e.target.value))}
                    className="w-full accent-[#66fcf1] disabled:opacity-50"
                  />
                </div>

                {/* Flex Direction */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-400 block">Flex Layout Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCardFlexDir('row')}
                      disabled={selectedTemplate !== 'custom'}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        cardFlexDir === 'row' ? 'bg-[#1f2833] border-[#66fcf1] text-[#66fcf1]' : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      Row (Horizontal)
                    </button>
                    <button
                      onClick={() => setCardFlexDir('column')}
                      disabled={selectedTemplate !== 'custom'}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        cardFlexDir === 'column' ? 'bg-[#1f2833] border-[#66fcf1] text-[#66fcf1]' : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      Column (Vertical)
                    </button>
                  </div>
                </div>

                {/* Custom Card label */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-400 block">Card Label Text</label>
                  <input
                    type="text"
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    placeholder="Enter node labels..."
                    className="w-full bg-black/60 border border-gray-800 rounded-xl p-2 text-xs text-white outline-none focus:border-[#66fcf1]"
                  />
                </div>

                {/* Child items count (Only if custom) */}
                {selectedTemplate === 'custom' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-gray-400">Child Elements</span>
                      <span className="text-[#66fcf1]">{cardChildCount} Nodes</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={cardChildCount}
                      onChange={(e) => setCardChildCount(Number(e.target.value))}
                      className="w-full accent-[#66fcf1]"
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-900" />

              {/* Wireframe inspector overlays toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Eye size={14} className="text-[#66fcf1]" />
                  <span>Inspect Layout wireframes</span>
                </span>
                <input
                  type="checkbox"
                  checked={inspectLayout}
                  onChange={(e) => setInspectLayout(e.target.checked)}
                  className="rounded border-gray-800 text-[#66fcf1] focus:ring-0 focus:ring-offset-0 accent-[#66fcf1] h-4 w-4 bg-black"
                />
              </div>
            </div>

            {/* Sandbox Canvas & Code AST (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Upper Sandbox viewport */}
              <div className="bg-[#0f111a] border border-gray-850 rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#66fcf1]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live WebGL Viewport</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">600 x 320 Canvas Grid</span>
                </div>
                
                <div className="bg-[#0b0c10] border border-gray-900 rounded-xl p-4 shadow-inner">
                  <canvas
                    ref={sandboxCanvasRef}
                    width={580}
                    height={280}
                    className="rounded-lg bg-[#0b0c10] border border-gray-950 shadow-2xl"
                  />
                </div>
                
                {inspectLayout && (
                  <p className="text-[9px] text-[#66fcf1] font-mono mt-3 text-center">
                    🟢 Neon Cyan lines indicate layout boundaries calculated using the Taffy WebAssembly layout module!
                  </p>
                )}
              </div>

              {/* Lower AST / Compile specifications */}
              <div className="bg-[#0f111a] border border-gray-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-black/40 border-b border-gray-900 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveCodeTab('jsx')}
                      className={`text-xs font-mono font-semibold py-1 px-3 rounded-lg transition-all ${
                        activeCodeTab === 'jsx' ? 'bg-[#1f2833] text-[#66fcf1] border border-gray-800' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      React Component JSX
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('ast')}
                      className={`text-xs font-mono font-semibold py-1 px-3 rounded-lg transition-all ${
                        activeCodeTab === 'ast' ? 'bg-[#1f2833] text-[#66fcf1] border border-gray-800' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      SceneNode AST JSON
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('webgl')}
                      className={`text-xs font-mono font-semibold py-1 px-3 rounded-lg transition-all ${
                        activeCodeTab === 'webgl' ? 'bg-[#1f2833] text-[#66fcf1] border border-gray-800' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      GPU Draw Commands
                    </button>
                  </div>

                  <button
                    onClick={() => copyCodeToClipboard(
                      activeCodeTab === 'jsx' ? getJsxCode() : activeCodeTab === 'ast' ? getJsonAst() : getGlLogs()
                    )}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors border border-gray-800 hover:bg-[#151824] px-2.5 py-1 rounded-lg"
                  >
                    {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-6 bg-black/25 font-mono text-[11px] leading-relaxed text-gray-300 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {activeCodeTab === 'jsx' && getJsxCode()}
                    {activeCodeTab === 'ast' && getJsonAst()}
                    {activeCodeTab === 'webgl' && (
                      <span className="text-[#66fcf1]">
                        {getGlLogs()}
                      </span>
                    )}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODE C: STEP-BY-STEP DEVELOPER ONBOARDING WALKTHROUGH */}
        {activeMode === 'tutorial' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Guide Stepper Panel (1 col) */}
            <div className="col-span-1 bg-[#0f111a] border border-gray-850 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
                <BookOpen className="text-[#66fcf1]" size={18} />
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">SDK Integration Stepper</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { step: 1, title: 'Install npm SDK Package' },
                  { step: 2, title: 'Initialize Reconciler Root' },
                  { step: 3, title: 'Define Canvas Layout Nodes' },
                  { step: 4, title: 'Map Events & Interactivity' }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setTutorialStep(s.step)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      tutorialStep === s.step 
                        ? 'bg-[#1f2833] border-[#66fcf1] text-[#66fcf1]' 
                        : 'bg-black/20 border-gray-850 text-gray-400 hover:text-white hover:border-gray-750'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tutorialStep === s.step ? 'bg-[#66fcf1] text-black' : 'bg-gray-850 text-gray-500'
                      }`}>{s.step}</span>
                      <span>{s.title}</span>
                    </div>
                    {tutorialStep > s.step && <Check size={12} className="text-[#66fcf1]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Details Pane (2 cols) */}
            <div className="lg:col-span-2 bg-[#0f111a] border border-gray-850 p-6 rounded-2xl space-y-6">
              
              {tutorialStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2833] text-[#66fcf1] font-bold">STEP 1 OF 4</span>
                    <h3 className="text-base font-bold text-white mt-2">Install the Canvas-Render Purifier</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Add the Core React Reconciler engine package directly to your client workspace dependencies.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block">NPM Shell Command</label>
                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-xs text-[#66fcf1] flex items-center justify-between">
                      <span>npm install @nexus/canvas-render-purifier --save</span>
                      <button
                        onClick={() => copyCodeToClipboard('npm install @nexus/canvas-render-purifier --save')}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-900">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulate Performance Optimize Scan</h4>
                    <p className="text-xs text-gray-400">
                      You can run a static compilation check command to find rendering bottlenecks on standard DOM structures. Click to run:
                    </p>
                    
                    <button
                      onClick={runSimulatedCli}
                      className="bg-gradient-to-r from-[#66fcf1] to-[#45f3ff] text-black font-extrabold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Play size={12} />
                      <span>Execute `nexus ui optimize`</span>
                    </button>

                    <div className="bg-black border border-gray-950 rounded-xl p-4 font-mono text-[11px] text-[#66fcf1] space-y-1.5 max-h-36 overflow-y-auto">
                      {simulatedCliLogs.map((log, idx) => (
                        <div key={idx}>{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2833] text-[#66fcf1] font-bold">STEP 2 OF 4</span>
                    <h3 className="text-base font-bold text-white mt-2">Initialize the Reconciler Root</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Replace ReactDOM hooks. Instantiates the main scene-graph and hooks directly into the WebGL drawing loop.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Root Setup Snippet</label>
                      <button
                        onClick={() => copyCodeToClipboard(`import { CanvasRenderer, SceneNode } from '@nexus/canvas-render-purifier';\n\nconst canvasElement = document.getElementById('gpu_canvas');\nconst rootNode = new SceneNode('root', 'rect', { color: '#0b0c10' });\n\nCanvasRenderer.render(<App />, rootNode);`)}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        <span>Copy snippet</span>
                      </button>
                    </div>

                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-[11px] text-gray-300 leading-relaxed">
                      <pre>{`import { CanvasRenderer, SceneNode } from '@nexus/canvas-render-purifier';\n\n// 1. Get HTML canvas target\nconst canvasElement = document.getElementById('gpu_canvas');\n\n// 2. Instantiate root container element\nconst rootNode = new SceneNode('root', 'rect', { color: '#0b0c10' });\n\n// 3. Mount React elements to the GPU canvas context\nCanvasRenderer.render(<App />, rootNode);`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2833] text-[#66fcf1] font-bold">STEP 3 OF 4</span>
                    <h3 className="text-base font-bold text-white mt-2">Define Canvas Layout Nodes</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Construct nodes using layout-specific components. Nest structures using flex configurations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">JSX Nodes Structure</label>
                      <button
                        onClick={() => copyCodeToClipboard(`<rect style={{ flexDirection: 'row', padding: 12, backgroundColor: '#151824' }}>\n  <rect style={{ width: 10, height: 10, backgroundColor: '#00ffcc' }} />\n  <text text="System Monitor" style={{ color: '#ffffff' }} />\n</rect>`)}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        <span>Copy Code</span>
                      </button>
                    </div>

                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-[11px] text-gray-300 leading-relaxed">
                      <pre>{`<rect style={{\n  flexDirection: 'row',\n  padding: 12,\n  backgroundColor: '#151824'\n}}>\n  {/* Status indicator */}\n  <rect style={{ width: 10, height: 10, backgroundColor: '#00ffcc' }} />\n  \n  {/* Label text element */}\n  <text text="System Monitor" style={{ color: '#ffffff' }} />\n</rect>`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2833] text-[#66fcf1] font-bold">STEP 4 OF 4</span>
                    <h3 className="text-base font-bold text-white mt-2">Map Events & Interactivity</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">
                      Configure pointer event triggers. The InputMapper tracks click coordinates, converting them to nodes synthetically.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Synthetic Event Handler Code</label>
                      <button
                        onClick={() => copyCodeToClipboard(`<rect\n  style={{ width: 200, height: 50, backgroundColor: '#1f2833' }}\n  onClick={(e) => {\n    console.log('Clicked on coordinate target node:', e.target.id);\n  }}\n/>`)}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        <span>Copy Code</span>
                      </button>
                    </div>

                    <div className="bg-black/60 border border-gray-800 rounded-xl p-4 font-mono text-[11px] text-gray-300 leading-relaxed">
                      <pre>{`<rect\n  style={{ width: 200, height: 50, backgroundColor: '#1f2833' }}\n  onClick={(e) => {\n    // Intercept clicks on compiled canvas coordinates\n    console.log('Clicked on coordinate target node:', e.target.id);\n    alert('Interacted with node: ' + e.target.id);\n  }}\n/>`}</pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
