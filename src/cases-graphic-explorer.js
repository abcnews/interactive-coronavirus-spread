import React from 'react';
import { render } from 'react-dom';
import CasesGraphicExplorer from './components/CasesGraphicExplorer';
import { fetchCountryTotals } from './utils';

export const renderExplorer = countryTotals => {
  const anchorEl = document.querySelector(`a[name^=casesgraphicexplorer]`);
  const mountEl = document.createElement('div');

  anchorEl.parentElement.insertBefore(mountEl, anchorEl);
  anchorEl.parentElement.removeChild(anchorEl);

  render(<CasesGraphicExplorer countryTotals={countryTotals} />, mountEl);
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchCountryTotals().then(countryTotals => domready(() => renderExplorer(countryTotals)));
