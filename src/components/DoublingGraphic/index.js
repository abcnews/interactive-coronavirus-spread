import React, { useRef, useEffect } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force'), ...require('d3-scale') };

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
  const duration = 200; // In milliseconds

  const config = {
    startTime: false,
    ticks: 0,
    animReqId: null
  };

  // Initial dots setup
  // Set up groups
  for (let i = 0; i < 1; i++) {
    nodes.push({
      groupName: 'one',
      targetX: centerX,
      targetY: height * 0.25
    });
  }

  for (let i = 0; i < 1; i++) {
    nodes.push({
      groupName: 'two',
      targetX: centerX,
      targetY: centerY
    });
  }

  for (let i = 0; i < 1; i++) {
    nodes.push({
      groupName: 'three',
      targetX: centerX,
      targetY: height * 0.75
    });
  }

  // Setup our physics
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
        .strength(-3)
        .theta(0.9)
    )
    .alpha(1)
    .alphaDecay(0.01)
    .alphaMin(0.25)
    .velocityDecay(0.4)
    .stop();

  useEffect(() => {
    // Add the canvas element to the page
    canvas = d3
      .select(el.current)
      .append('canvas')
      .attr('width', width)
      .attr('height', height);

    // Get the canvas context to draw
    ctx = canvas.node().getContext('2d');

    // Fit to retina devices
    scaleCanvas(canvas.node(), ctx, width, height);

    // Add initial nodes to simulation
    simulation.nodes(nodes).stop();

    // Tick over a few to get stable initial state
    for (let i = 0; i < 128; i++) {
      simulation.tick();
    }

    // Function that paints to canvas
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

    // Unload these otherwise browser gets bogged down
    return () => {
      canvas = null;
      ctx = null;
      simulation = null;
      render = null;
      animate = null;
    };
  });

  useEffect(() => {
    

  

    // Additional nodes
    for (let i = 0; i < 10; i++) {
      nodesToAdd.push({
        groupName: 'one',
        x: centerX,
        y: height * 0.25,
        delay: Math.random() * duration,
        targetX: centerX,
        targetY: height * 0.25
      });
    }

    console.log(props.marker);

    let count = requestAnimationFrame(t => animate(t, nodesToAdd));

    // render();
  }, [props.marker]);

  return <div ref={el} className={styles.root}></div>;
};
