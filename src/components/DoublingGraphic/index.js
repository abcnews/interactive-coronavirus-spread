import React, { useRef, useEffect } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force') };

import scaleCanvas from './scaleCanvas';

import styles from './styles.scss';

export default props => {
  const el = useRef(null);

  // Init these so we can unload them later on dismount
  let canvas;
  let ctx;
  let simulation;
  let render;
  let animate;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let centerX = width / 2;
  let centerY = height / 2;

  const nodes = [];
  const nodesToAdd = [];
  const duration = 2;

  const config = {
    startTime: false,
    ticks: 0,
    animReqId: null
  };

  for (let i = 0; i < 0; i++) {
    nodes.push({
      targetX: centerX,
      targetY: centerY
    });
  }

  useEffect(() => {
    canvas = d3
      .select(el.current)
      .append('canvas')
      .attr('width', width)
      .attr('height', height);

    ctx = canvas.node().getContext('2d');

    scaleCanvas(canvas.node(), ctx, width, height);

    simulation = d3
      .forceSimulation([])
      .force(
        'x',
        d3
          .forceX()
          .strength(0.2)
          .x(d => d.targetX)
      )
      .force(
        'y',
        d3
          .forceY()
          .strength(0.2)
          .y(d => d.targetY)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(-1.8)
          .theta(0.9)
      )
      .alpha(1)
      .alphaDecay(0.01)
      .alphaMin(0.25)
      .velocityDecay(0.4)
      .stop();

    simulation.nodes(nodes).stop();

    for (let i = 0; i < 130; i++) {
      simulation.tick();
    }

    // Paint to canvas
    render = () => {
      const nodes = simulation.nodes();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }

      return nodes;
    };

    // Animation frame
    animate = (time, nodesToAdd) => {
      if (!config.startTime) {
        config.startTime = time;
      }

      const progress = time - config.startTime;
      const nodes = render();
      const newNodes = [];

      for (let i = 0; i < nodesToAdd.length; i++) {
        const node = nodesToAdd[i];
        if (node.delay < progress) {
          newNodes.push(node);
          nodesToAdd.splice(i, 1);
          i--;
        }
      }

      simulation
        .nodes(nodes.concat(newNodes))
        .alpha(1)
        .tick();

      config.ticks++;

      if (config.ticks < 1800 || nodesToAdd.length > 0) {
        config.animReqId = requestAnimationFrame(t => animate(t, nodesToAdd));
      }
    };

    render();

    // Additional nodes
    for (let i = 0; i < 1000; i++) {
      nodesToAdd.push({
        // x: centerX + width * Math.sin(Math.random() * (2 * Math.PI)),
        // y: centerY + width * Math.cos(Math.random() * (2 * Math.PI)),
        x: centerX,
        y: centerY,
        delay: Math.random() * (duration * 1000),
        targetX: centerX,
        targetY: i < 500 ? centerY - 100 : centerY + 100
      });
    }

    let count = requestAnimationFrame(t => animate(t, nodesToAdd));

    // Unload these otherwise browser gets bogged down
    return () => {
      canvas = null;
      ctx = null;
      simulation = null;
      render = null;
      animate = null;
    };
  });

  return <div ref={el} className={styles.root}></div>;
};

// import { select } from 'd3';
// import React, { useEffect, useRef } from 'react';
// import styles from './styles.css';

// export default ({ preset }) => {
//   const svgRef = useRef();

//   useEffect(() => {
//     const svg = select(svgRef.current);
//   }, [preset]);

//   return (
//     <div className={styles.root}>
//       <svg ref={svgRef} className={styles.svg}></svg>
//     </div>
//   );
// };
