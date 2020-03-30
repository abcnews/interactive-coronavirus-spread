import { fetchCountryTotals, renderCasesGraphics } from './utils';

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchCountryTotals().then(countryTotals => domready(() => renderCasesGraphics(countryTotals)));
