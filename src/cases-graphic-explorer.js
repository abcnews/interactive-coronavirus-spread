import React from 'react';
import { render } from 'react-dom';
import CasesGraphicExplorer from './components/CasesGraphicExplorer';
import { fetchPlacesTotals } from './utils';

export const renderExplorer = placesTotals => {
  const anchorEl = document.querySelector(`a[name^=casesgraphicexplorer]`);
  const mountEl = document.createElement('div');

  anchorEl.parentElement.insertBefore(mountEl, anchorEl);
  anchorEl.parentElement.removeChild(anchorEl);

  render(<CasesGraphicExplorer placesTotals={placesTotals} />, mountEl);
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesTotals().then(placesTotals => domready(() => renderExplorer(placesTotals)));
