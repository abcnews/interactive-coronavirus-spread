import { select, axisBottom, axisRight, scaleLinear, scaleBand } from 'd3';
import React, { useEffect, useRef } from 'react';
import styles from './styles.css';

export default ({ preset, booms, countryTotals }) => {
  const svgRef = useRef();

  console.debug({ countryTotals });

  useEffect(() => {
    const svg = select(svgRef.current);
    const xScale = scaleBand()
      .domain([0])
      .range([0, 300])
      .padding(0.5);

    const yScale = scaleLinear()
      .domain([0, 150])
      .range([150, 0]);

    const colorScale = scaleLinear()
      .domain([75, 100, 150])
      .range(['green', 'orange', 'red'])
      .clamp(true);

    const xAxis = axisBottom(xScale).ticks(1);

    svg
      .select(`.${styles.xAxis}`)
      .style('transform', 'translateY(150px)')
      .call(xAxis);

    const yAxis = axisRight(yScale);

    svg
      .select(`.${styles.ysAxis}`)
      .style('transform', 'translateX(300px)')
      .call(yAxis);

    svg
      .selectAll('.bar')
      .data([booms || 0])
      .join('rect')
      .attr('class', 'bar')

      .style('transform', 'scale(1, -1)')
      .attr('x', (value, index) => xScale(index))
      .attr('y', -150)
      .attr('width', xScale.bandwidth())
      .transition()
      .attr('fill', colorScale)
      .attr('height', value => 150 - yScale(value));
  }, [preset, booms]);

  return (
    <div className={styles.root}>
      <svg ref={svgRef} className={styles.svg}>
        <g className={styles.xAxis} />
        <g className={styles.yAxis} />
      </svg>
    </div>
  );
};
