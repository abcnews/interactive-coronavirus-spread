import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force'), ...require('d3-force-reuse') };
import { Fade } from 'react-reveal';

import scaleCanvas from './scaleCanvas';
import styles from './styles.scss';

import { useWindowSize } from './useWindowSize';

const ANIMATION_TICK_LIMIT = 600;
const RANDOM_INIT_DISTANCE = 100;

let dot1ypos = 0.333;
let dot2ypos = 0.5;
let dot3ypos = 0.666;

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

let nodes = [];
let nodesToAdd = [];
let duration = 2000; // In milliseconds
let initialDotState = [];
let week1DotState = [];
let week2DotState = [];
let week3DotState = [];

let ticks = 0;
let startTime = false;
let runAnimation = false;
let isAnimating = false;

export default props => {
  // Get a reference to our canvas
  const canvasEl = useRef(null);

  const size = useWindowSize();

  // Set up state
  const [pageTitle, setPageTitle] = useState(null);
  const [label1Ypos, setLabel1Ypos] = useState(height * 0.25);
  const [label2Ypos, setLabel2Ypos] = useState(height * 0.5);
  const [label3Ypos, setLabel3Ypos] = useState(height * 0.75);

  useLayoutEffect(() => {
    console.log('Mounting D3 vis...');
    // Add the canvas element to the page
    canvas = d3
      .select(canvasEl.current)
      .attr('width', width)
      .attr('height', height);

    // Get the canvas context to draw
    ctx = canvas.node().getContext('2d');

    // Fit to retina devices
    scaleCanvas(canvas.node(), ctx, width, height);

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
          .forceManyBodyReuse()
          .strength(-30)
          .theta(0.9)
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
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#8EC3CE';
        // ctx.strokeStyle = '#5FA9BA';
        // ctx.stroke();
        ctx.fill();
      }

      return nodes;
    };

    // Animation frame
    // Removed nodesToAdd from 2nd arg to global so we can override globally
    animate = time => {
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

      if ((runAnimation && ticks < ANIMATION_TICK_LIMIT) || nodesToAdd.length > 0) {
        isAnimating = true;
        requestAnimationFrame(t => {
          animate(t, nodesToAdd);
        });
      } else {
        isAnimating = false;
      }
    };

    // Kind of a hack to stop animations on unmount
    runAnimation = true;
    if (runAnimation) {
      requestAnimationFrame(t => {
        animate(t, nodesToAdd);
      });
    }

    // Run on unmount
    return () => {
      console.log('Unmounting doubling vis...');

      // canvas = null;
      // ctx = null;
      // simulation = null;
      // render = null;
      // animate = null;
      // NOTE: THIS CAUSES AN ERROR ON UNMOUNT BECAUSE THE REQUESTANIMATIONFRAME FUNCTION IS
      // STILL TRYING TO CALL ANIMATE AFTER UNMOUNT BUT THAT'S KINDA GOOD BECAUSE IT MEANS
      // THAT THE INTERACTIVE STOPS TRYING TO ANIMATE
      // PLEASE FIX LATER DOWN THE TRACK
      // Update: The runAnimation trick seems to have worked... maybe

      runAnimation = false;
    };
  }, []);

  useEffect(() => {
    width = window.innerWidth;
    height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;

    canvas.attr('width', width).attr('height', height);

    ctx = canvas.node().getContext('2d');

    // Fit to retina devices
    scaleCanvas(canvas.node(), ctx, width, height);

    console.log(size);
    setLabel1Ypos(height * dot1ypos);
    setLabel2Ypos(height * dot2ypos);
    setLabel3Ypos(height * dot3ypos);
  }, [size.width, size.height]);

  useEffect(() => {
    console.log(props);

    // Delay transitions to animate
    setPageTitle(null);

    switch (props.marker) {
      case 'doublinginit':
        setTimeout(() => {
          nodesToAdd = [];

          setPageTitle('What is exponential growth?');

          initialDotState = [];

          // Add initial nodes to simulation
          for (let i = 0; i < 1; i++) {
            initialDotState.push({
              groupName: 'one',
              x: centerX + Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2,
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 1; i++) {
            initialDotState.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: centerY + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: centerY
            });
          }

          for (let i = 0; i < 1; i++) {
            initialDotState.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }
          simulation.nodes(initialDotState).stop();

          startTime = false;
          ticks = 0;
        }, 100);

        break;
      case 'doublingweek1':
        setTimeout(() => {
          setPageTitle('Week 1');

          week1DotState = [];

          // After 1 week first state
          for (let i = 0; i < 1; i++) {
            week1DotState.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 1; i++) {
            week1DotState.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: centerY + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: centerY
            });
          }

          for (let i = 0; i < 1; i++) {
            week1DotState.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          simulation.nodes(week1DotState).stop();

          startTime = false;
          ticks = 0;

          nodesToAdd = [];

          for (let i = 0; i < 2 - 1; i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (7 / 3) - 1; i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * 0.5 + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * 0.5
            });
          }

          for (let i = 0; i < 2 ** (7 / 2) - 1; i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, 100);

        break;
      case 'doublingweek2':
        setTimeout(() => {
          setPageTitle('Week 2');

          week2DotState = [];

          // After 2 weeks
          for (let i = 0; i < 2; i++) {
            week2DotState.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (7 / 3); i++) {
            week2DotState.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: centerY + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: centerY
            });
          }

          for (let i = 0; i < 2 ** (7 / 2); i++) {
            week2DotState.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          simulation.nodes(week2DotState).stop();

          startTime = false;
          ticks = 0;

          // Add nodes after the mark
          nodesToAdd = [];

          for (let i = 0; i < 2; i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (14 / 3) - 2 ** (7 / 3); i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * 0.5 + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * 0.5
            });
          }

          for (let i = 0; i < 2 ** (14 / 2) - 2 ** (7 / 2); i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, 100);

        break;
      case 'doublingmonth':
        setTimeout(() => {
          setPageTitle('3 weeks');

          week3DotState = [];

          // After 2 weeks
          for (let i = 0; i < 2 ** (14 / 7); i++) {
            week3DotState.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (14 / 3); i++) {
            week3DotState.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: centerY + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: centerY
            });
          }

          for (let i = 0; i < 2 ** (14 / 2); i++) {
            week3DotState.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          simulation.nodes(week3DotState).stop();

          startTime = false;
          ticks = 0;

          // Add nodes after the mark
          nodesToAdd = [];

          for (let i = 0; i < 2 ** (21 / 7) - 2 ** (14 / 7); i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (21 / 3) - 2 ** (14 / 3); i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * 0.5 + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * 0.5
            });
          }

          for (let i = 0; i < 2 ** (21 / 2) - 2 ** (14 / 2); i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: Math.random() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, 100);
        break;
      default:
        setTimeout(() => {
          setPageTitle('What is exponential growth?');
        }, 100);
    }
  }, [props, size.width, size.height]);

  useLayoutEffect(() => {}, [props]);

  return (
    <div className={styles.root}>
      <canvas className={styles.canvas} ref={canvasEl} />
      <Fade>
        {pageTitle ? <h1>{pageTitle}</h1> : ''}

        <div className={styles.label} style={{ top: `${label1Ypos}px` }}>
          <span className={`${styles.noBackground}`}>When the number of cases doubles every week</span>
        </div>

        <div className={styles.label} style={{ top: `${label2Ypos}px` }}>
          <span className={`${styles.noBackground}`}>...doubles every 3 days</span>
        </div>

        <div className={`${styles.label}`} style={{ top: `${label3Ypos}px` }}>
          <span className={`${styles.background}`}>...doubles every 2 days</span>
        </div>
      </Fade>
    </div>
  );
};
