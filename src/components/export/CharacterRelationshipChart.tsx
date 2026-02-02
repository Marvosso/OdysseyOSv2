'use client';

/**
 * Character Relationship Chart
 * 
 * Visualizes character relationships using D3.js
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { CharacterRelationshipChart } from '@/lib/export/analysisExports';

interface CharacterRelationshipChartProps {
  data: CharacterRelationshipChart;
}

export default function CharacterRelationshipChart({
  data,
}: CharacterRelationshipChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3.forceLink(data.links).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#6B7280')
      .attr('stroke-width', (d) => d.value)
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', (d) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        return colors[d.group % colors.length];
      })
      .call(
        d3
          .drag<any, any>()
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
      );

    // Add labels
    const label = svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d) => d.name)
      .attr('font-size', 12)
      .attr('fill', '#FFFFFF')
      .attr('dx', 15)
      .attr('dy', 4);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });
  }, [data]);

  if (data.nodes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No character relationships to visualize
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width={600} height={400} className="bg-gray-900 rounded" />
    </div>
  );
}
