import { ensureBlockMount, exactMountSelector } from '@abcnews/mount-utils';
import React from 'react';
import { render } from 'react-dom';
import TestingGraphicExplorer from './components/TestingGraphicExplorer';

export const renderExplorer = placesData => {
  const mountEl = document.querySelector(exactMountSelector('testinggraphicexplorer'));

  if (!mountEl) {
    return;
  }

  render(<TestingGraphicExplorer />, ensureBlockMount(mountEl));
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

domready(renderExplorer);
