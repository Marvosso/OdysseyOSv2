'use client';

/**
 * Timeline Chart
 * 
 * Visualizes story timeline using D3.js
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TimelineVisualization } from '@/lib/export/analysisExports';

interface TimelineChartProps {
  data: TimelineVisualization;
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.events.length === 0) return;

    const width = 600;
    const height = Math.max(400, data.events.length * 60);
    const margin = { top: 20, right: 20, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, data.events.length - 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(data.events.map((_, i) => i.toString()))
      .range([0, innerHeight])
      .padding(0.2);

    // Color scale for emotions
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral'])
      .range(['#FCD34D', '#60A5FA', '#F87171', '#A78BFA', '#34D399', '#9CA3AF']);

    // Draw timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', innerHeight / 2)
      .attr('x2', innerWidth)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#6B7280')
      .attr('stroke-width', 2);

    // Draw events
    data.events.forEach((event, index) => {
      const y = yScale(index.toString())! + yScale.bandwidth() / 2;

      // Event circle
      g.append('circle')
        .attr('cx', xScale(index))
        .attr('cy', y)
        .attr('r', 8)
        .attr('fill', colorScale(event.emotion))
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2);

      // Event label
      g.append('text')
        .attr('x', xScale(index))
        .attr('y', y - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#FFFFFF')
        .text(event.title.substring(0, 20));

      // Characters
      if (event.characters.length > 0) {
        g.append('text')
          .attr('x', xScale(index))
          .attr('y', y + 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', 8)
          .attr('fill', '#9CA3AF')
          .text(event.characters.slice(0, 2).join(', '));
      }
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(data.events.length))
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', 10);

    // Y axis labels
    g.selectAll('.event-label')
      .data(data.events)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', (_, i) => yScale(i.toString())! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#9CA3AF')
      .text((_, i) => `Scene ${i + 1}`);
  }, [data]);

  if (data.events.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No timeline events to visualize
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="bg-gray-900 rounded" />
    </div>
  );
}
