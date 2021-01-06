import { selectMounts } from '@abcnews/mount-utils';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphicExplorer from './components/CasesGraphicExplorer';

export const renderExplorer = () => {
  const [mountEl] = selectMounts('casesgraphicexplorer');

  if (!mountEl) {
    return;
  }

  render(<CasesGraphicExplorer />, mountEl);
};

const domready = fn => {
  /in/.test(document.readyState) ? setTimeout(() => domready(fn), 9) : fn();
};

domready(renderExplorer);
