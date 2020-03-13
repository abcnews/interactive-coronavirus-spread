import { select } from 'd3';
import React, { useEffect, useRef } from 'react';
import styles from './styles.css';

export default ({ preset }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = select(svgRef.current);
  }, [preset]);

  return (
    <div className={styles.root}>
      <svg ref={svgRef} className={styles.svg}></svg>
    </div>
  );
};
