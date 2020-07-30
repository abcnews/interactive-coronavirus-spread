import 'core-js/features/symbol';
import 'core-js/features/symbol/iterator';
import renderTestingGraphics from './components/TestingGraphic/mounts';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

domready(renderTestingGraphics);
