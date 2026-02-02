'use client';

/**
 * Words Per Day Chart
 * 
 * Bar chart showing daily word counts
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DailyStats } from '@/lib/analytics/writingMetrics';

interface WordsPerDayChartProps {
  data: DailyStats[];
}

export default function WordsPerDayChart({ data }: WordsPerDayChartProps) {
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
      .domain(data.map((d) => d.date))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.words) || 0])
      .nice()
      .range([innerHeight, 0]);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([
      0,
      d3.max(data, (d) => d.words) || 0,
    ]);

    // Bars
    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.date) || 0)
      .attr('y', (d) => yScale(d.words))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => innerHeight - yScale(d.words))
      .attr('fill', (d) => colorScale(d.words))
      .attr('rx', 4)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.7);
        // Tooltip would go here
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => {
        const date = new Date(d as string);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }))
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '10px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

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
      .text('Words');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No data available. Start writing to see your progress!
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="bg-gray-900 rounded" />
    </div>
  );
}
