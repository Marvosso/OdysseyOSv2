'use client';

/**
 * Writing Speed Chart
 * 
 * Line chart showing writing speed over time
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { WritingSpeed } from '@/lib/analytics/writingMetrics';

interface WritingSpeedChartProps {
  data: WritingSpeed[];
}

export default function WritingSpeedChart({ data }: WritingSpeedChartProps) {
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
      .scaleTime()
      .domain(d3.extent(data, (d) => d.timestamp) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.wordsPerMinute) || 0])
      .nice()
      .range([innerHeight, 0]);

    // Line generator
    const line = d3
      .line<WritingSpeed>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.wordsPerMinute))
      .curve(d3.curveMonotoneX);

    // Area generator
    const area = d3
      .area<WritingSpeed>()
      .x((d) => xScale(d.timestamp))
      .y0(innerHeight)
      .y1((d) => yScale(d.wordsPerMinute))
      .curve(d3.curveMonotoneX);

    // Area
    g.append('path')
      .datum(data)
      .attr('fill', 'rgba(139, 92, 246, 0.2)')
      .attr('d', area);

    // Line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8B5CF6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Dots
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.timestamp))
      .attr('cy', (d) => yScale(d.wordsPerMinute))
      .attr('r', 4)
      .attr('fill', '#8B5CF6')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 6);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 4);
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => {
            const date = new Date(d as number);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          })
      )
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '10px');

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
      .text('Words per Minute');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No writing speed data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="bg-gray-900 rounded" />
    </div>
  );
}
