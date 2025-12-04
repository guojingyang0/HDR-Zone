import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CurvePoint, ZoneConfig, ZoneType, MIN_STOP, MAX_STOP } from '../types';

interface HDRGraphProps {
  data: CurvePoint[];
  zones: ZoneConfig[];
  activeZoneId: ZoneType | null;
  width?: number;
  height?: number;
  theme: 'light' | 'dark';
  labels: {
    xAxis: string;
    yAxis: string;
  };
}

const HDRGraph: React.FC<HDRGraphProps> = ({ data, zones, activeZoneId, width = 600, height = 300, theme, labels }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Define Gradients & Filters
    const defs = svg.append("defs");
    
    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Curve Gradient
    const curveGradient = defs.append("linearGradient")
      .attr("id", "curveGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
    curveGradient.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8");
    curveGradient.append("stop").attr("offset", "100%").attr("stop-color", "#818cf8");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Colors based on theme
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const axisTextColor = theme === 'dark' ? '#6b7280' : '#9ca3af'; 
    const refLineColor = theme === 'dark' ? '#333' : '#e5e5e5';

    // Scales
    const xScale = d3.scaleLinear()
      .domain([MIN_STOP, MAX_STOP])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([MIN_STOP, MAX_STOP])
      .range([innerHeight, 0]);

    // Grid Construction
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d}`);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    const styleAxis = (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      selection.style("font-family", "Inter, sans-serif").style("font-size", "10px");
      selection.style("color", axisTextColor);
      selection.selectAll("line").style("stroke", gridColor);
      selection.selectAll("path").style("stroke", "none");
    };

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis.tickSize(-innerHeight))
      .call(styleAxis);

    g.append("g")
      .attr("class", "grid")
      .call(yAxis.tickSize(-innerWidth))
      .call(styleAxis);

    // 1. Draw Zone Weights (The background fill showing influence)
    zones.forEach(zone => {
      if (!zone.isEnabled) return;
      
      const isActive = activeZoneId === zone.id;
      const baseOpacity = theme === 'dark' ? 0.08 : 0.05;
      const activeOpacity = theme === 'dark' ? 0.25 : 0.2;
      
      // Calculate dynamic color and opacity based on saturation
      const color = d3.hsl(zone.color);
      // Adjust saturation: 0 makes it gray, >1 keeps it vivid
      color.s *= zone.saturation; 
      
      // Adjust opacity: Higher saturation makes the zone more "solid" / visible
      // Range mapped from [0, 2] -> [0.5x, 1.4x] multiplier
      const saturationOpacityMod = 0.5 + (zone.saturation * 0.45);
      
      let opacity = isActive ? activeOpacity : baseOpacity;
      opacity = Math.min(1, opacity * saturationOpacityMod);

      const area = d3.area<CurvePoint>()
        .x(d => xScale(d.x))
        .y0(innerHeight)
        .y1(d => innerHeight - (d.weights[zone.id] * (innerHeight * 0.95))) 
        .curve(d3.curveBasis);

      g.append("path")
        .datum(data)
        .attr("fill", color.toString())
        .attr("opacity", opacity)
        .attr("d", area)
        .style("mix-blend-mode", theme === 'dark' ? "screen" : "multiply");
    });

    // 2. Draw Reference Line (Input == Output)
    g.append("line")
      .attr("x1", xScale(MIN_STOP))
      .attr("y1", yScale(MIN_STOP))
      .attr("x2", xScale(MAX_STOP))
      .attr("y2", yScale(MAX_STOP))
      .attr("stroke", refLineColor)
      .attr("stroke-width", 1.5)
      .style("stroke-dasharray", "4 4");

    // 3. Draw The Result Curve
    const line = d3.line<CurvePoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Shadow path for glow
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "url(#curveGradient)")
      .attr("stroke-width", 3)
      .attr("d", line)
      .attr("filter", "url(#glow)")
      .attr("opacity", 0.6);

    // Main path
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "url(#curveGradient)")
      .attr("stroke-width", 2.5)
      .attr("d", line);
      
    // 4. Draw Falloff Markers (Vertical Lines)
    zones.forEach(zone => {
      if (!zone.isEnabled) return;
      const isActive = activeZoneId === zone.id;
      if (!isActive && activeZoneId !== null) return; 

      const xPos = xScale(zone.rangeEnd);
      
      // Stem
      g.append("line")
        .attr("x1", xPos)
        .attr("y1", 0)
        .attr("x2", xPos)
        .attr("y2", innerHeight)
        .attr("stroke", zone.color)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2 2")
        .attr("opacity", isActive ? 0.8 : 0.3);

      // Range Indicator Top
      const isLowPass = [ZoneType.BLACK, ZoneType.DARK, ZoneType.SHADOW].includes(zone.id);
      const falloffEnd = isLowPass ? zone.rangeEnd - zone.falloff : zone.rangeEnd + zone.falloff;
      const xFalloff = xScale(falloffEnd);

      if (isActive) {
        // Only draw the range arrow when active to reduce clutter
        g.append("line")
            .attr("x1", xPos)
            .attr("y1", innerHeight * 0.05) 
            .attr("x2", xFalloff)
            .attr("y2", innerHeight * 0.05)
            .attr("stroke", zone.color)
            .attr("stroke-width", 2);
            
        g.append("circle")
            .attr("cx", xFalloff)
            .attr("cy", innerHeight * 0.05)
            .attr("r", 4)
            .attr("fill", zone.color);
      }
    });

  }, [data, zones, width, height, activeZoneId, theme]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="overflow-visible"
    />
  );
};

export default HDRGraph;