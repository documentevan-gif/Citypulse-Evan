import React, { useState, useMemo } from 'react';
import { 
  KALTENG_REGIONS, 
  KALTENG_COORDS, 
  KALTENG_EDGES, 
  BASE_SNA_METRICS, 
  KaltengRegion, 
  SnaNodeMetrics 
} from '../data/kaltengRegions';
import { Share2, ZoomIn, ZoomOut, RotateCcw, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SnaNetworkGraphProps {
  selectedRegions: KaltengRegion[];
  onToggleRegion: (region: KaltengRegion) => void;
  regionCommentCounts: Record<string, number>;
}

export const SnaNetworkGraph: React.FC<SnaNetworkGraphProps> = ({
  selectedRegions,
  onToggleRegion,
  regionCommentCounts,
}) => {
  const [hoveredNode, setHoveredNode] = useState<KaltengRegion | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeMetricTab, setActiveMetricTab] = useState<'betweenness' | 'degree'>('betweenness');

  // Sorted metrics table
  const sortedMetrics = useMemo(() => {
    return [...BASE_SNA_METRICS].sort((a, b) => {
      if (activeMetricTab === 'betweenness') {
        return b.betweennessCentrality - a.betweennessCentrality;
      }
      return b.degreeCentrality - a.degreeCentrality;
    });
  }, [activeMetricTab]);

  // Edges linked to the hovered node
  const highlightedEdges = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>();
    KALTENG_EDGES.forEach((edge, idx) => {
      if (edge.source === hoveredNode || edge.target === hoveredNode) {
        set.add(`${edge.source}->${edge.target}`);
        set.add(`${edge.target}->${edge.source}`);
      }
    });
    return set;
  }, [hoveredNode]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Canvas Graph Viewport */}
        <div className="panel flex flex-col relative overflow-hidden">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-main">
                  Topologi Graf Jaringan Wilayah (SNA)
                </h3>
              </div>
              <p className="text-[11px] text-text-dim mt-0.5">
                Klik titik untuk memfilter wilayah • Hover untuk melihat metrik sentralitas & jalur koridor
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-surface-accent border border-border rounded-lg p-1">
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))} 
                title="Perbesar"
                className="p-1 hover:bg-border rounded text-text-dim hover:text-text-main"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.75))} 
                title="Perkecil"
                className="p-1 hover:bg-border rounded text-text-dim hover:text-text-main"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoomLevel(1)} 
                title="Reset Zoom"
                className="p-1 hover:bg-border rounded text-text-dim hover:text-text-main"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Visualizer */}
          <div className="w-full h-[480px] bg-[#121316] rounded-xl border border-border relative overflow-hidden flex items-center justify-center select-none">
            <svg 
              viewBox="40 30 680 400" 
              className="w-full h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#34D399" stopOpacity="0.7" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Edge Connections */}
              {KALTENG_EDGES.map((edge, idx) => {
                const p1 = KALTENG_COORDS[edge.source];
                const p2 = KALTENG_COORDS[edge.target];
                const isConnectedToHover = highlightedEdges.has(`${edge.source}->${edge.target}`);
                const isBothSelected = selectedRegions.includes(edge.source) && selectedRegions.includes(edge.target);

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={isConnectedToHover ? '#4F9CF9' : isBothSelected ? '#31333A' : '#202126'}
                      strokeWidth={isConnectedToHover ? 3.5 : isBothSelected ? 1.8 : 1}
                      strokeDasharray={isConnectedToHover ? 'none' : isBothSelected ? 'none' : '4 3'}
                      className="transition-all duration-300"
                    />
                    {isConnectedToHover && (
                      <circle
                        cx={(p1.x + p2.x) / 2}
                        cy={(p1.y + p2.y) / 2}
                        r="3"
                        fill="#4F9CF9"
                      />
                    )}
                  </g>
                );
              })}

              {/* Region Nodes */}
              {KALTENG_REGIONS.map((region) => {
                const coord = KALTENG_COORDS[region];
                const metric = BASE_SNA_METRICS.find(m => m.region === region);
                const isSelected = selectedRegions.includes(region);
                const isHovered = hoveredNode === region;
                const isPalangka = region === 'Kota Palangka Raya';
                const commentCount = regionCommentCounts[region] || 0;

                // Dynamic node size based on Betweenness Centrality
                const baseRadius = isPalangka ? 18 : 11 + ((metric?.betweennessCentrality || 0) * 16);
                const r = isHovered ? baseRadius + 4 : baseRadius;

                return (
                  <g 
                    key={region}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredNode(region)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onToggleRegion(region)}
                  >
                    {/* Pulsing ring for capital or hovered node */}
                    {(isPalangka || isHovered) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={r + 8}
                        fill="none"
                        stroke={isPalangka ? '#34D399' : '#4F9CF9'}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        className="animate-ping origin-center"
                      />
                    )}

                    {/* Outer Glow on hover */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={r}
                      fill={
                        isPalangka
                          ? isSelected ? '#34D399' : '#1e4b3c'
                          : isSelected
                          ? '#4F9CF9'
                          : '#25262B'
                      }
                      stroke={
                        isHovered 
                          ? '#FFFFFF' 
                          : isSelected 
                          ? isPalangka ? '#6EE7B7' : '#93C5FD' 
                          : '#3F424E'
                      }
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-200"
                    />

                    {/* Centrality Badge dot */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="3.5"
                      fill={isSelected ? '#FFFFFF' : '#6B7280'}
                    />

                    {/* Node Label */}
                    <text
                      x={coord.x}
                      y={coord.y + (r + 14)}
                      textAnchor="middle"
                      className={`text-[9.5px] font-semibold select-none pointer-events-none transition-all duration-200 ${
                        isHovered 
                          ? 'fill-white font-bold text-[11px]' 
                          : isSelected 
                          ? isPalangka ? 'fill-emerald-300' : 'fill-sky-300' 
                          : 'fill-zinc-500'
                      }`}
                    >
                      {coord.shortName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredNode && (
              <div className="absolute bottom-4 left-4 bg-surface/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-2xl max-w-xs pointer-events-none z-20">
                <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-border pb-1.5">
                  <span className="text-xs font-bold text-text-main">{hoveredNode}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    selectedRegions.includes(hoveredNode) 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-zinc-800 text-text-dim'
                  }`}>
                    {selectedRegions.includes(hoveredNode) ? '✓ Terpilih' : 'Tidak Aktif'}
                  </span>
                </div>
                
                {(() => {
                  const m = BASE_SNA_METRICS.find(x => x.region === hoveredNode);
                  return (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-text-dim block">Betweenness:</span>
                        <span className="font-bold text-primary">{(m?.betweennessCentrality || 0).toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Degree Centrality:</span>
                        <span className="font-bold text-success">{(m?.degreeCentrality || 0).toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Aspirasi Terkait:</span>
                        <span className="font-bold text-text-main">{regionCommentCounts[hoveredNode] || 0} data</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Jalur Arteri:</span>
                        <span className="font-bold text-text-main">{m?.degree || 0} Koridor</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Legend Footer */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-text-dim pt-4 border-t border-border mt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]"></span>
                Ibukota Provinsi (Palangka Raya)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F9CF9]"></span>
                Wilayah Terfilter Aktif
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25262B] border border-border"></span>
                Di luar Filter
              </span>
            </div>
            <span className="text-[10px] text-primary italic">
              Ukuran node = Besaran Betweenness Centrality
            </span>
          </div>
        </div>

        {/* Centrality Metrics Leaderboard Panel */}
        <div className="panel flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
              Peringkat Sentralitas (SNA)
            </h3>
            
            {/* Metric Switcher Tab */}
            <div className="flex bg-surface-accent p-0.5 rounded-lg border border-border text-[10px]">
              <button
                onClick={() => setActiveMetricTab('betweenness')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  activeMetricTab === 'betweenness' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                Betweenness
              </button>
              <button
                onClick={() => setActiveMetricTab('degree')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  activeMetricTab === 'degree' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                Degree
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
            {sortedMetrics.map((item, rank) => {
              const isSelected = selectedRegions.includes(item.region);
              const score = activeMetricTab === 'betweenness' ? item.betweennessCentrality : item.degreeCentrality;

              return (
                <div 
                  key={item.region}
                  onClick={() => onToggleRegion(item.region)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-surface-accent border-primary/30 hover:border-primary' 
                      : 'bg-[#141519] border-border/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      rank === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      rank === 1 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                      rank === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {rank + 1}
                    </span>
                    <div className="truncate">
                      <div className={`font-semibold truncate ${isSelected ? 'text-text-main' : 'text-text-dim'}`}>
                        {item.shortName}
                      </div>
                      <div className="text-[10px] text-text-dim truncate">
                        {item.koridor}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-primary">
                      {score.toFixed(4)}
                    </div>
                    <div className="text-[9px] text-text-dim">
                      {regionCommentCounts[item.region] || 0} aspirasi
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytical Takeaway Note */}
          <div className="mt-4 p-3 bg-surface-accent rounded-lg border border-border/80 flex gap-2 text-[11px] text-text-dim">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-text-main">Wawasan Strategis:</strong> Kota Palangka Raya dan Kotawaringin Timur (Sampit) bertindak sebagai <em className="text-primary font-medium">Critical Bridges</em> dengan Betweenness tertinggi, menghubungkan koridor Barat, Pedalaman DAS Barito, dan Pesisir Selatan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
