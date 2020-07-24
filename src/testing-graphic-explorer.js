import { ensureBlockMount, exactMountSelector } from '@abcnews/mount-utils';
import React from 'react';
import { render } from 'react-dom';
import TestingGraphicExplorer from './components/TestingGraphicExplorer';
import { fetchPlacesTestingData } from './utils';

export const renderExplorer = placesData => {
  const mountEl = document.querySelector(exactMountSelector('testinggraphicexplorer'));

  if (!mountEl) {
    return;
  }

  render(<TestingGraphicExplorer placesData={placesData} />, ensureBlockMount(mountEl));
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

fetchPlacesTestingData().then(placesData => domready(() => renderExplorer(placesData)));
