import { ensureBlockMount, exactMountSelector } from '@abcnews/mount-utils';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphicExplorer from './components/CasesGraphicExplorer';

export const renderExplorer = () => {
  const mountEl = document.querySelector(exactMountSelector('casesgraphicexplorer'));

  if (!mountEl) {
    return;
  }

  render(<CasesGraphicExplorer />, ensureBlockMount(mountEl));
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

domready(renderExplorer);
