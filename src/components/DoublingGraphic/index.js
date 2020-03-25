import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force'), ...require('d3-force-reuse') };
import { Fade } from 'react-reveal';

import scaleCanvas from './scaleCanvas';
import styles from './styles.scss';

import { useWindowSize } from './useWindowSize';

const ANIMATION_TICK_LIMIT = 600;
const RANDOM_INIT_DISTANCE = 80;
const MULTIPLY_DELAY = 100;

let dot1ypos = 0.333333;
let dot2ypos = 0.5;
let dot3ypos = 0.666666;

let manyBodyForceStrength = -13;
let dotSize = 4;

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
  const [label1Ypos, setLabel1Ypos] = useState(height * dot1ypos);
  const [label2Ypos, setLabel2Ypos] = useState(height * dot2ypos);
  const [label3Ypos, setLabel3Ypos] = useState(height * dot3ypos);
  const [labelOffsets, setLabeloffsets] = useState(70);
  const [dot3Background, setDot3Background] = useState(false);

  useLayoutEffect(() => {
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
          .strength(manyBodyForceStrength)
          .theta(0.9)
      )
      .alpha(1)
      .alphaDecay(0.2)
      .alphaMin(0.001)
      .velocityDecay(0.6)
      .stop();

    // Function that paints to canvas
    render = () => {
      const nodes = simulation.nodes();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        ctx.beginPath();
        ctx.arc(node.x, node.y, dotSize, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(140, 193, 204, 0.9)';
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
          // Here we are simulating new dots "dividing" from dots already there
          // So we randomly select nodes until we find one that matches

          // Make an array of random numbers
          // and go through until we find one
          for (var a = [], j = 0; j < nodes.length; ++j) a[j] = j;
          const shuffledArray = shuffle(a);

          for (let randomNumber of shuffledArray) {
            // const randomNode = getRandomInt(0, nodes.length - 1);
            if (nodes[randomNumber].groupName === node.groupName) {
              node.y = nodes[randomNumber].y;
              node.x = nodes[randomNumber].x;
              break;
            }
          }

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

    setLabel1Ypos(height * dot1ypos);
    setLabel2Ypos(height * dot2ypos);
    setLabel3Ypos(height * dot3ypos);

    // On iPhone SE and very small screens dots go off screen
    // So bump down
    if (size.width > 400) {
      setLabeloffsets(30);
    } else if (size.width > 320) {
      setLabeloffsets(50);
    } else {
      setLabeloffsets(60);
    }
  }, [size.width, size.height]);

  useEffect(() => {
    // Delay transitions to animate
    setPageTitle(null);

    switch (props.marker) {
      case 'doublinginit':
        // Reset some things
        initialDotState = [];
        nodesToAdd = [];

        // Reset labels
        setLabel1Ypos(height * dot1ypos);
        setLabel2Ypos(height * dot2ypos);
        setLabel3Ypos(height * dot3ypos);

        setDot3Background(false);

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
            y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
            targetX: centerX,
            targetY: height * dot2ypos
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

        setTimeout(() => {
          setPageTitle('What is exponential growth?');
        }, 100);

        break;
      case 'doublingweek1':
        setLabel1Ypos(height * dot1ypos - 4);
        setLabel2Ypos(height * dot2ypos - 8);
        setLabel3Ypos(height * dot3ypos - 10);

        setDot3Background(false);

        if (simulation.nodes().length !== 3) {
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
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot2ypos
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
        } else {
          week1DotState = simulation.nodes();
        }

        simulation.nodes(week1DotState).stop();

        startTime = false;
        ticks = 0;

        setTimeout(() => {
          setPageTitle('Week 1');
        }, 100);

        setTimeout(() => {
          nodesToAdd = [];

          for (let i = 0; i < 2 - 1; i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (7 / 3) - 1; i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot2ypos
            });
          }

          for (let i = 0; i < 2 ** (7 / 2) - 1; i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, MULTIPLY_DELAY);

        break;
      case 'doublingweek2':
        setLabel1Ypos(height * dot1ypos - 12);
        setLabel2Ypos(height * dot2ypos - 30);
        setLabel3Ypos(height * dot3ypos - 42);

        setDot3Background(false);

        if (simulation.nodes().length !== 20) {
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
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot2ypos
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
        } else {
          week2DotState = simulation.nodes();
        }

        simulation.nodes(week2DotState).stop();

        startTime = false;
        ticks = 0;

        setTimeout(() => {
          setPageTitle('Week 2');
        }, 100);

        setTimeout(() => {
          // Add nodes after the mark
          nodesToAdd = [];

          for (let i = 0; i < 2; i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (14 / 3) - 2 ** (7 / 3); i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot2ypos
            });
          }

          for (let i = 0; i < 2 ** (14 / 2) - 2 ** (7 / 2); i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, MULTIPLY_DELAY);

        break;
      case 'doublingweek3':
        setDot3Background(true);

        setLabel1Ypos(height * dot1ypos - 105);
        setLabel2Ypos(height * dot2ypos - 140);
        setLabel3Ypos(height * dot3ypos - 80);

        if (simulation.nodes().length !== 160) {
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
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              targetX: centerX,
              targetY: height * dot2ypos
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
        } else {
          week3DotState = simulation.nodes();
        }

        simulation.nodes(week3DotState).stop();

        startTime = false;
        ticks = 0;

        setTimeout(() => {
          setPageTitle('Week 3');
        }, 100);

        setTimeout(() => {
          // Add nodes after the mark
          nodesToAdd = [];

          for (let i = 0; i < 2 ** (21 / 7) - 2 ** (14 / 7); i++) {
            nodesToAdd.push({
              groupName: 'one',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot1ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot1ypos
            });
          }

          for (let i = 0; i < 2 ** (21 / 3) - 2 ** (14 / 3); i++) {
            nodesToAdd.push({
              groupName: 'two',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot2ypos
            });
          }

          for (let i = 0; i < 2 ** (21 / 2) - 2 ** (14 / 2); i++) {
            nodesToAdd.push({
              groupName: 'three',
              x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              y: height * dot3ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
              delay: weightedRandom() * duration,
              targetX: centerX,
              targetY: height * dot3ypos
            });
          }

          if (!isAnimating) {
            requestAnimationFrame(t => {
              animate(t, nodesToAdd);
            });
          }
        }, MULTIPLY_DELAY);
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

        <div className={styles.label} style={{ top: `${label1Ypos + labelOffsets}px` }}>
          <span className={`${styles.noBackground}`}>When the number of cases doubles every week</span>
        </div>

        <div className={styles.label} style={{ top: `${label2Ypos + labelOffsets}px` }}>
          <span className={`${styles.noBackground}`}>...doubles every 3 days</span>
        </div>

        <div className={`${styles.label}`} style={{ top: `${label3Ypos + labelOffsets}px` }}>
          <span className={`${dot3Background && styles.background}`}>...doubles every 2 days</span>
        </div>
      </Fade>
    </div>
  );
};

// Helper functions -----------------------

// Get a random integer between two numbers
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffles an array
function shuffle(array) {
  var tmp,
    current,
    top = array.length;
  if (top)
    while (--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }
  return array;
}

// Make dots grow faster when approaching end of time
function weightedRandom() {
  let min = 0.0;
  let max = 1.0;
  let p = 0.55;
  let result = min + (max - min) * Math.pow(Math.random(), p);
  return result;
}
