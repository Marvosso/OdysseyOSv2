'use client';

/**
 * Time of Day Chart
 * 
 * Pie/bar chart showing productivity by time of day
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TimeOfDayStats } from '@/lib/analytics/writingMetrics';

interface TimeOfDayChartProps {
  data: TimeOfDayStats[];
}

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.period))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.totalWords) || 0])
      .nice()
      .range([innerHeight, 0]);

    // Color scale
    const colors = {
      morning: '#FCD34D',
      afternoon: '#60A5FA',
      evening: '#A78BFA',
      night: '#1F2937',
    };

    // Bars
    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.period) || 0)
      .attr('y', (d) => yScale(d.totalWords))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => innerHeight - yScale(d.totalWords))
      .attr('fill', (d) => colors[d.period as keyof typeof colors] || '#6B7280')
      .attr('rx', 4);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '12px')
      .style('text-transform', 'capitalize');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '10px');

    // Axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - innerHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '12px')
      .text('Total Words');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No data available. Start writing to see your productivity patterns!
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="bg-gray-900 rounded" />
    </div>
  );
}
