console.log(':)');

const d3 = { ...require('d3-selection'), ...require('d3-force'), ...require('d3-force-reuse') };
import scaleCanvas from './scaleCanvas';

const ANIMATION_TICK_LIMIT = 30000;
const RANDOM_INIT_DISTANCE = 80;

let dot2ypos = 0.5;

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
let duration = 120000; // In milliseconds
let initialDotState = [];
let week1DotState = [];
let week2DotState = [];
let week3DotState = [];

let ticks = 0;
let startTime = false;
let runAnimation = false;
let isAnimating = false;

canvas = d3
  .select(document.querySelector('.canvas'))
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

runAnimation = true;
// if (runAnimation) {
//   requestAnimationFrame(t => {
//     animate(t, nodesToAdd);
//   });
// }

initialDotState = [];
nodesToAdd = [];

// Add initial nodes to simulation

for (let i = 0; i < 1; i++) {
  initialDotState.push({
    groupName: 'two',
    x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
    y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
    targetX: centerX,
    targetY: height * dot2ypos
  });
}

simulation.nodes(initialDotState).stop();

startTime = false;
ticks = 0;

let max = 1000;

setTimeout(() => {
  nodesToAdd = [];

  for (let i = 0; i < 2 ** (30 / 3); i++) {
    nodesToAdd.push({
      groupName: 'two',
      x: centerX + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
      y: height * dot2ypos + (Math.random() * RANDOM_INIT_DISTANCE - RANDOM_INIT_DISTANCE / 2),
      delay: Math.random() * duration,
      targetX: centerX,
      targetY: height * dot2ypos
    });
  }

  if (!isAnimating) {
    requestAnimationFrame(t => {
      animate(t, nodesToAdd);
    });
  }
}, 1000);

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
