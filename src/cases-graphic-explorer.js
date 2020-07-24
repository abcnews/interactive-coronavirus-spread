import { ensureBlockMount, exactMountSelector } from '@abcnews/mount-utils';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphicExplorer from './components/CasesGraphicExplorer';
import { fetchPlacesData } from './utils';

export const renderExplorer = placesData => {
  const mountEl = document.querySelector(exactMountSelector('casesgraphicexplorer'));

  if (!mountEl) {
    return;
  }

  render(<CasesGraphicExplorer placesData={placesData} />, ensureBlockMount(mountEl));
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesData().then(placesData => domready(() => renderExplorer(placesData)));
