import 'core-js/features/symbol';
import 'core-js/features/symbol/iterator';
import { fetchPlacesTestingData, renderTestingGraphics } from './utils';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesTestingData().then(placesData => domready(() => renderTestingGraphics(placesData)));
