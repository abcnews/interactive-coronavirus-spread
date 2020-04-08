import { fetchPlacesTotals, renderCasesGraphics } from './utils';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesTotals().then(placesTotals => domready(() => renderCasesGraphics(placesTotals)));
