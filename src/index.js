import * as acto from '@abcnews/alternating-case-to-object';
import { getMountValue, isMount, selectMounts } from '@abcnews/mount-utils';
import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import renderCasesGraphics from './components/CasesGraphic/mounts';
import renderTestingGraphics from './components/CasesGraphic/mounts';

const whenOdysseyLoaded = new Promise(resolve =>
  window.__ODYSSEY__
    ? resolve(window.__ODYSSEY__)
    : window.addEventListener('odyssey:api', () => resolve(window.__ODYSSEY__))
);
const whenScrollytellersLoaded = new Promise((resolve, reject) =>
  whenOdysseyLoaded.then(odyssey => {
    const scrollyNames = selectMounts('scrollytellerNAME', { markAsUsed: false }).map(
      mountEl => acto(getMountValue(mountEl, 'scrollyteller')).name
    );
    const scrollyDatas = [];

    for (let i = 0, len = scrollyNames.length; i < len; i++) {
      let scrollyData;

      try {
        scrollyData = loadScrollyteller(scrollyNames[i], 'u-full');
      } catch (err) {
        return reject(err);
      }

      // Keep the DOM tidy.
      if (scrollyData && scrollyData.mountNode) {
        while (isMount(scrollyData.mountNode.nextElementSibling)) {
          odyssey.utils.dom.detach(scrollyData.mountNode.nextElementSibling);
        }
      }

      scrollyDatas.push(scrollyData);
    }

    resolve(scrollyDatas);
  })
);

document.documentElement.style.setProperty('--bg', '#f3fcfc');

whenScrollytellersLoaded
  .then(scrollyDatas => {
    renderCasesGraphics();
    renderTestingGraphics();
    scrollyDatas.forEach(scrollyData => render(<App scrollyData={scrollyData} />, scrollyData.mountNode));
  })
  .catch(console.error);
