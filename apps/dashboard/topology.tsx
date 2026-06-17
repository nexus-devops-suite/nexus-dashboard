'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Server, Activity, Radio, AlertCircle } from 'lucide-react';

interface ClusterNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'master' | 'worker';
  status: 'healthy' | 'patched' | 'error' | 'offline';
}

interface ClusterLink extends d3.SimulationLinkDatum<ClusterNode> {
  source: string;
  target: string;
}

export default function TopologyMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);

  // Mock cluster topologies data
  const [nodes, setNodes] = useState<ClusterNode[]>([
    { id: 'node_m1', name: 'master-01', type: 'master', status: 'healthy' },
    { id: 'node_w1', name: 'worker-us-01', type: 'worker', status: 'patched' },
    { id: 'node_w2', name: 'worker-us-02', type: 'worker', status: 'healthy' },
    { id: 'node_w3', name: 'worker-eu-01', type: 'worker', status: 'error' },
    { id: 'node_w4', name: 'worker-eu-02', type: 'worker', status: 'healthy' },
    { id: 'node_w5', name: 'worker-ap-01', type: 'worker', status: 'offline' },
  ]);

  const links: ClusterLink[] = [
    { source: 'node_m1', target: 'node_w1' },
    { source: 'node_m1', target: 'node_w2' },
    { source: 'node_m1', target: 'node_w3' },
    { source: 'node_m1', target: 'node_w4' },
    { source: 'node_m1', target: 'node_w5' },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 400;

    // Clear previous drawing
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation<ClusterNode>(nodes)
      .force('link', d3.forceLink<ClusterNode, ClusterLink>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Draw Links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#1f2833')
      .attr('stroke-width', 2);

    // Draw Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, ClusterNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    // Node glyphs background
    node.append('circle')
      .attr('r', 18)
      .attr('fill', d => {
        switch (d.status) {
          case 'patched': return '#00ffcc';
          case 'healthy': return '#0099ff';
          case 'error': return '#ff3366';
          default: return '#555555';
        }
      })
      .attr('stroke', '#0b0c10')
      .attr('stroke-width', 2);

    // Node labels
    node.append('text')
      .text(d => d.name)
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c5c6c7')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [nodes]);

  return (
    <div className="bg-[#0f111a] border border-gray-850 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2">
            <Radio size={20} className="text-[#66fcf1] animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">Active Cluster Topology</h2>
          </div>
          <span className="text-xs font-mono text-gray-500">cls_main_99</span>
        </div>
        <div className="bg-black/20 rounded-xl overflow-hidden border border-gray-900 flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      <div className="w-full md:w-64 bg-[#151824] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-bold text-sm mb-4">Node Details</h3>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block">Host Name</label>
                <div className="text-white font-mono text-sm">{selectedNode.name}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block">Role</label>
                <span className="bg-[#1f2833] text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {selectedNode.type.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block">Daemon Status</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedNode.status === 'patched' ? 'bg-[#00ffcc]' :
                    selectedNode.status === 'healthy' ? 'bg-[#0099ff]' :
                    selectedNode.status === 'error' ? 'bg-[#ff3366]' : 'bg-gray-500'
                  }`} />
                  <span className="text-xs font-mono uppercase text-gray-300">{selectedNode.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 leading-relaxed py-8 text-center flex flex-col items-center gap-2">
              <Server size={24} />
              <span>Select a node in the graph topology to review details.</span>
            </div>
          )}
        </div>

        {selectedNode && selectedNode.status === 'error' && (
          <div className="mt-4 bg-red-950/20 border border-red-900/40 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <div className="text-[11px] text-red-400">
              Hooking collision detected in module `.text`. Automated rollback initialized.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
