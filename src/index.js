import * as acto from '@abcnews/alternating-case-to-object';
import { getTrailingMountValue, isMount, prefixedMountSelector } from '@abcnews/mount-utils';
import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import { fetchPlacesData, fetchPlacesTestingData, renderCasesGraphics, renderTestingGraphics } from './utils';

const whenPlacesDataFetched = fetchPlacesData();
const whenPlacesTestingDataFetched = fetchPlacesTestingData();
const whenOdysseyLoaded = new Promise(resolve =>
  window.__ODYSSEY__
    ? resolve(window.__ODYSSEY__)
    : window.addEventListener('odyssey:api', () => resolve(window.__ODYSSEY__))
);
const whenScrollytellersLoaded = new Promise((resolve, reject) =>
  whenOdysseyLoaded.then(odyssey => {
    const scrollyNames = [...document.querySelectorAll(prefixedMountSelector('scrollytellerNAME'))].map(
      mountEl => acto(getTrailingMountValue(mountEl, 'scrollyteller')).name
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

function renderAll(scrollyDatas, placesData, placesTestingData) {
  renderCasesGraphics(placesData);
  renderTestingGraphics(placesTestingData);
  scrollyDatas.forEach(scrollyData =>
    render(<App scrollyData={scrollyData} placesData={placesData} />, scrollyData.mountNode)
  );
}

document.documentElement.style.setProperty('--bg', '#f3fcfc');

Promise.all([whenScrollytellersLoaded, whenPlacesDataFetched, whenPlacesTestingDataFetched])
  .then(results => renderAll.apply(null, results))
  .catch(console.error);
