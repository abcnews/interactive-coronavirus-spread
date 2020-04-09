import 'core-js/features/symbol';
import 'core-js/features/symbol/iterator';
import { fetchPlacesData, renderCasesGraphics } from './utils';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesData().then(placesData => domready(() => renderCasesGraphics(placesData)));
