import 'core-js/features/symbol';
import 'core-js/features/symbol/iterator';
import renderCasesGraphics from './components/CasesGraphic/mounts';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

domready(renderCasesGraphics);
