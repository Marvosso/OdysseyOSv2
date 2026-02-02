'use client';

/**
 * Plot Map Component
 * 
 * Visual graph representation of story structure using D3.js
 * Shows chapters, scenes, and plot points as nodes with connections
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Download, Layout, Network, Maximize2 } from 'lucide-react';
import type { StoryOutline, Chapter, OutlinePoint } from '@/types/outline';
import type { Scene, SceneStatus } from '@/types/story';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { useRouter } from 'next/navigation';

interface PlotMapProps {
  outline: StoryOutline | null;
  onNodeClick?: (nodeId: string, type: 'chapter' | 'point' | 'scene') => void;
  onNodeReorder?: (nodeIds: string[]) => void;
}

type LayoutType = 'hierarchical' | 'force' | 'linear';

interface GraphNode {
  id: string;
  label: string;
  type: 'chapter' | 'point' | 'scene';
  status?: SceneStatus;
  chapterId?: string;
  position: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'chapter-to-point' | 'point-to-point' | 'scene-to-scene';
}

export default function PlotMap({ outline, onNodeClick, onNodeReorder }: PlotMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutType>('hierarchical');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const router = useRouter();

  // Load scenes from storage
  const scenes = StoryStorage.loadScenes();

  // Build graph data from outline and scenes
  const buildGraphData = useCallback((): { nodes: GraphNode[]; links: GraphLink[] } => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    if (!outline) {
      // If no outline, just show scenes
      scenes.forEach((scene, index) => {
        nodes.push({
          id: scene.id,
          label: scene.title || `Scene ${index + 1}`,
          type: 'scene',
          status: scene.status || 'draft',
          position: scene.position,
        });
      });

      // Link scenes in order
      for (let i = 0; i < nodes.length - 1; i++) {
        links.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'scene-to-scene',
        });
      }
      return { nodes, links };
    }

    // Build nodes from outline chapters and points
    outline.chapters.forEach((chapter, chapterIndex) => {
      // Chapter node
      nodes.push({
        id: chapter.id,
        label: chapter.title,
        type: 'chapter',
        position: chapter.position,
        chapterId: chapter.id,
      });

      // Point nodes
      chapter.points.forEach((point, pointIndex) => {
        nodes.push({
          id: point.id,
          label: point.title,
          type: 'point',
          chapterId: chapter.id,
          position: point.position,
        });

        // Link chapter to point
        links.push({
          source: chapter.id,
          target: point.id,
          type: 'chapter-to-point',
        });

        // Link points in sequence
        if (pointIndex > 0) {
          const prevPoint = chapter.points[pointIndex - 1];
          links.push({
            source: prevPoint.id,
            target: point.id,
            type: 'point-to-point',
          });
        }
      });

      // Link chapters in sequence
      if (chapterIndex > 0) {
        const prevChapter = outline.chapters[chapterIndex - 1];
        if (prevChapter.points.length > 0) {
          const lastPoint = prevChapter.points[prevChapter.points.length - 1];
          links.push({
            source: lastPoint.id,
            target: chapter.id,
            type: 'point-to-point',
          });
        } else {
          links.push({
            source: prevChapter.id,
            target: chapter.id,
            type: 'point-to-point',
          });
        }
      }
    });

    // Add scene nodes if they exist
    scenes.forEach((scene, index) => {
      nodes.push({
        id: `scene-${scene.id}`,
        label: scene.title || `Scene ${index + 1}`,
        type: 'scene',
        status: scene.status || 'draft',
        position: scene.position,
      });
    });

    return { nodes, links };
  }, [outline, scenes]);

  // Get color for node based on type and status
  const getNodeColor = (node: GraphNode): string => {
    if (node.type === 'chapter') {
      return '#9333ea'; // Purple
    }
    if (node.type === 'point') {
      return '#3b82f6'; // Blue
    }
    if (node.type === 'scene') {
      switch (node.status) {
        case 'final':
          return '#10b981'; // Green
        case 'revised':
          return '#f59e0b'; // Amber
        case 'draft':
        default:
          return '#6b7280'; // Gray
      }
    }
    return '#6b7280';
  };

  // Render graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(600, container.clientHeight);

    // Clear previous render
    svg.selectAll('*').remove();

    // Set up zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        const { transform } = event;
        setZoom(transform.k);
        setPan({ x: transform.x, y: transform.y });
        g.attr('transform', transform.toString());
      });

    svg.call(zoomBehavior);

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Apply initial transform
    const initialTransform = d3.zoomIdentity.translate(pan.x, pan.y).scale(zoom);
    svg.call(zoomBehavior.transform, initialTransform);

    // Layout nodes based on selected layout
    if (layout === 'hierarchical') {
      // Hierarchical layout: chapters at top, points below, scenes at bottom
      const chapterNodes = nodes.filter((n) => n.type === 'chapter');
      const pointNodes = nodes.filter((n) => n.type === 'point');
      const sceneNodes = nodes.filter((n) => n.type === 'scene');

      chapterNodes.forEach((node, i) => {
        node.x = (width / (chapterNodes.length + 1)) * (i + 1);
        node.y = 100;
        node.fx = node.x;
        node.fy = node.y;
      });

      pointNodes.forEach((node) => {
        const chapter = chapterNodes.find((c) => c.id === node.chapterId);
        if (chapter && chapter.x !== undefined) {
          const chapterPoints = pointNodes.filter((p) => p.chapterId === chapter.id);
          const pointIndex = chapterPoints.findIndex((p) => p.id === node.id);
          node.x = (chapter.x || 0) + (pointIndex - chapterPoints.length / 2) * 80;
          node.y = 250;
          node.fx = node.x;
          node.fy = node.y;
        }
      });

      sceneNodes.forEach((node, i) => {
        node.x = (width / (sceneNodes.length + 1)) * (i + 1);
        node.y = height - 100;
        node.fx = node.x;
        node.fy = node.y;
      });
    } else if (layout === 'linear') {
      // Linear layout: all nodes in a horizontal line
      nodes.sort((a, b) => a.position - b.position);
      nodes.forEach((node, i) => {
        node.x = (width / (nodes.length + 1)) * (i + 1);
        node.y = height / 2;
        node.fx = node.x;
        node.fy = node.y;
      });
    } else {
      // Force-directed layout
      const simulation = d3
        .forceSimulation<GraphNode>(nodes)
        .force(
          'link',
          d3
            .forceLink<GraphNode, GraphLink>(links)
            .id((d) => d.id)
            .distance(100)
        )
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

      simulationRef.current = simulation;

      simulation.on('tick', () => {
        link.attr('x1', (d) => (d.source as GraphNode).x || 0)
          .attr('y1', (d) => (d.source as GraphNode).y || 0)
          .attr('x2', (d) => (d.target as GraphNode).x || 0)
          .attr('y2', (d) => (d.target as GraphNode).y || 0);

        node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
      });
    }

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('x1', (d) => {
        const source = typeof d.source === 'string' ? nodes.find((n) => n.id === d.source) : d.source;
        return source?.x || 0;
      })
      .attr('y1', (d) => {
        const source = typeof d.source === 'string' ? nodes.find((n) => n.id === d.source) : d.source;
        return source?.y || 0;
      })
      .attr('x2', (d) => {
        const target = typeof d.target === 'string' ? nodes.find((n) => n.id === d.target) : d.target;
        return target?.x || 0;
      })
      .attr('y2', (d) => {
        const target = typeof d.target === 'string' ? nodes.find((n) => n.id === d.target) : d.target;
        return target?.y || 0;
      });

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.id);
        if (onNodeClick) {
          onNodeClick(d.id, d.type);
        }
        if (d.type === 'scene') {
          router.push('/dashboard');
        }
      })
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            setIsDragging(true);
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            setIsDragging(false);
            // Trigger reorder callback
            if (onNodeReorder) {
              const sortedNodes = [...nodes].sort((a, b) => {
                if (a.x !== undefined && b.x !== undefined) {
                  return a.x - b.x;
                }
                return a.position - b.position;
              });
              onNodeReorder(sortedNodes.map((n) => n.id));
            }
          })
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => (d.type === 'chapter' ? 20 : d.type === 'point' ? 15 : 12))
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', (d) => (selectedNode === d.id ? '#ffffff' : '#1f2937'))
      .attr('stroke-width', (d) => (selectedNode === d.id ? 3 : 2))
      .attr('opacity', 0.9);

    // Node labels
    node
      .append('text')
      .attr('dy', (d) => (d.type === 'chapter' ? 35 : 30))
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => (d.type === 'chapter' ? '12px' : '10px'))
      .attr('font-weight', (d) => (d.type === 'chapter' ? 'bold' : 'normal'))
      .text((d) => {
        const maxLength = d.type === 'chapter' ? 20 : 15;
        return d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
      })
      .append('title')
      .text((d) => d.label);

    // Update link positions for hierarchical/linear layouts
    if (layout !== 'force') {
      link
        .attr('x1', (d) => {
          const source = typeof d.source === 'string' ? nodes.find((n) => n.id === d.source) : d.source;
          return source?.x || 0;
        })
        .attr('y1', (d) => {
          const source = typeof d.source === 'string' ? nodes.find((n) => n.id === d.source) : d.source;
          return source?.y || 0;
        })
        .attr('x2', (d) => {
          const target = typeof d.target === 'string' ? nodes.find((n) => n.id === d.target) : d.target;
          return target?.x || 0;
        })
        .attr('y2', (d) => {
          const target = typeof d.target === 'string' ? nodes.find((n) => n.id === d.target) : d.target;
          return target?.y || 0;
        });
    }

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [outline, scenes, layout, zoom, pan, selectedNode, onNodeClick, onNodeReorder, router, buildGraphData]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1 / 1.5
      );
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Export as SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plot-map-${new Date().toISOString().split('T')[0]}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as PNG
  const handleExportPNG = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = containerRef.current!.clientWidth;
      canvas.height = containerRef.current!.clientHeight;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `plot-map-${new Date().toISOString().split('T')[0]}.png`;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const { nodes } = buildGraphData();

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="text-center">
          <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No story structure to visualize</p>
          <p className="text-sm text-gray-500 mt-1">Create an outline or import scenes to see the plot map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Layout:</label>
          <select
            value={layout}
            onChange={(e) => {
              setLayout(e.target.value as LayoutType);
              if (simulationRef.current) {
                simulationRef.current.stop();
              }
            }}
            className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="force">Force-Directed</option>
            <option value="linear">Linear</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export Controls */}
          <div className="h-6 w-px bg-gray-600 mx-1" />
          <button
            onClick={handleExportSVG}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            title="Export as SVG"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
          <button
            onClick={handleExportPNG}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span className="text-gray-400">Chapter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-gray-400">Plot Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-gray-400">Final Scene</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500" />
          <span className="text-gray-400">Revised Scene</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500" />
          <span className="text-gray-400">Draft Scene</span>
        </div>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        <svg ref={svgRef} width="100%" height="100%" style={{ minHeight: '600px' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#4b5563" />
            </marker>
          </defs>
        </svg>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click nodes to navigate • Drag to reorder • Scroll to zoom • Drag background to pan
      </p>
    </div>
  );
}
