'use client';

/**
 * Word Frequency Chart
 * 
 * Horizontal bar chart showing most common words
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { WordFrequency } from '@/lib/analytics/writingMetrics';

interface WordFrequencyChartProps {
  data: WordFrequency[];
}

export default function WordFrequencyChart({ data }: WordFrequencyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 600;
    const height = Math.max(400, data.length * 25);
    const margin = { top: 20, right: 100, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.word))
      .range([0, innerHeight])
      .padding(0.2);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .nice()
      .range([0, innerWidth]);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolatePlasma).domain([
      0,
      d3.max(data, (d) => d.count) || 0,
    ]);

    // Bars
    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('y', (d) => yScale(d.word) || 0)
      .attr('x', 0)
      .attr('width', (d) => xScale(d.count))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => colorScale(d.count))
      .attr('rx', 4);

    // Word labels
    g.selectAll('.word-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'word-label')
      .attr('y', (d) => (yScale(d.word) || 0) + yScale.bandwidth() / 2)
      .attr('x', -10)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '12px')
      .text((d) => d.word);

    // Count labels
    g.selectAll('.count-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'count-label')
      .attr('y', (d) => (yScale(d.word) || 0) + yScale.bandwidth() / 2)
      .attr('x', (d) => xScale(d.count) + 10)
      .attr('dy', '0.35em')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '11px')
      .text((d) => `${d.count} (${d.percentage.toFixed(1)}%)`);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '10px');

    // Axis label
    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 35})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '12px')
      .text('Frequency');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No word frequency data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="bg-gray-900 rounded" />
    </div>
  );
}
