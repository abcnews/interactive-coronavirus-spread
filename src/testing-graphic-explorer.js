import React from 'react';
import { render } from 'react-dom';
import TestingGraphicExplorer from './components/TestingGraphicExplorer';
import { fetchPlacesData } from './utils';

export const renderExplorer = placesData => {
  const anchorEl = document.querySelector(`a[name^=testinggraphicexplorer]`);
  const mountEl = document.createElement('div');

  anchorEl.parentElement.insertBefore(mountEl, anchorEl);
  anchorEl.parentElement.removeChild(anchorEl);

  render(<TestingGraphicExplorer placesData={placesData} />, mountEl);
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesData().then(placesData => domready(() => renderExplorer(placesData)));
