import React, { useRef, useEffect } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force') };

import scaleCanvas from './scaleCanvas';

import styles from './styles.scss';

const ANIMATION_TICK_LIMIT = 11000;

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

const nodesToAdd = [];
const duration = 10000; // In milliseconds

let ticks = 0;
let startTime = false;
let animReqId = null;

// Setup our physics
simulation = d3
  .forceSimulation([])
  .force(
    'x',
    d3
      .forceX()
      .strength(0.6)
      .x(d => d.targetX)
  )
  .force(
    'y',
    d3
      .forceY()
      .strength(0.6)
      .y(d => d.targetY)
  )
  .force(
    'charge',
    d3
      .forceManyBody()
      .strength(-20)
      .theta(0.1)
      .distanceMax(200)
  )
  .alpha(1)
  .alphaDecay(0.2)
  .alphaMin(0.001)
  .velocityDecay(0.7)
  .stop();

// Function that paints to canvas
render = () => {
  const nodes = simulation.nodes();
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    ctx.beginPath();
    ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }

  return nodes;
};

// Animation frame
animate = (time, nodesToAdd) => {
  if (!startTime) {
    startTime = time;
  }

  const progress = time - startTime;
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

  ticks++;

  if (ticks < ANIMATION_TICK_LIMIT || nodesToAdd.length > 0) {
    requestAnimationFrame(t => {
      animate(t, nodesToAdd);
    });
  }
};

export default props => {
  const el = useRef(null);

  useEffect(() => {
    // Add the canvas element to the page
    canvas = d3
      .select(el.current)
      .attr('width', width)
      .attr('height', height);

    // Get the canvas context to draw
    ctx = canvas.node().getContext('2d');

    // Fit to retina devices
    scaleCanvas(canvas.node(), ctx, width, height);

    // Add initial nodes to simulation
    // simulation.nodes(nodes).stop();

    // Tick over a few to get stable initial state
    // for (let i = 0; i < 128; i++) {
    //   simulation.tick();
    // }
    simulation.nodes([]).stop();

    // render();
    // Additional nodes
    startTime = false;
    ticks = 0;

    let count = requestAnimationFrame(t => animate(t, nodesToAdd));

    // Unload these otherwise browser gets bogged down
    return () => {
      // canvas = null;
      // ctx = null;
      // simulation = null;
      // render = null;
      // animate = null;
    };
  }, []);

  useEffect(() => {
    if (props.marker === 'doubling') {
      simulation.nodes([]).stop();
      return;
    }

    // Reset animation timers
    startTime = false;
    ticks = 0;

    for (let i = 0; i < 16; i++) {
      nodesToAdd.push({
        groupName: 'one',
        x: width * 0.25, //centerX,
        y: centerY, //height * 0.25,
        delay: Math.random() * duration,
        targetX: width * 0.25,
        targetY: height * 0.5
      });
    }

    for (let i = 0; i < 128; i++) {
      nodesToAdd.push({
        groupName: 'two',
        x: width * 0.5, //centerX,
        y: centerY, //height * 0.5,
        delay: Math.random() * duration,
        targetX: centerX,
        targetY: height * 0.5
      });
    }

    for (let i = 0; i < 645; i++) {
      nodesToAdd.push({
        groupName: 'three',
        x: width * 0.75, //centerX,
        y: centerY, //height * 0.75,
        delay: Math.random() * duration,
        targetX: width * 0.75, //centerX,
        targetY: height * 0.5
      });
    }
  }, [props.marker]);

  return (
    <div className={styles.root}>
      <canvas className={styles.canvas} ref={el} />
    </div>
  );
};
