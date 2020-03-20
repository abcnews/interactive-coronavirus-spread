import * as a2o from '@abcnews/alternating-case-to-object';
import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import { COUNTRY_TOTALS_URL } from './constants';

const PROJECT_NAME = 'interactive-coronavirus-spread';
const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function renderApps(scrollyDatas, countryTotals) {
  scrollyDatas.forEach(scrollyData =>
    render(<App scrollyData={scrollyData} countryTotals={countryTotals} />, scrollyData.mountNode)
  );
}

const whenOdysseyLoaded = new Promise(resolve =>
  window.__ODYSSEY__
    ? resolve(window.__ODYSSEY__)
    : window.addEventListener('odyssey:api', () => resolve(window.__ODYSSEY__))
);

const whenScrollytellersLoaded = new Promise((resolve, reject) =>
  whenOdysseyLoaded.then(odyssey => {
    const scrollyNames = [...document.querySelectorAll(`[name^="scrollyteller"]`)].map(
      el => a2o(el.getAttribute('name')).name
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
        while (scrollyData.mountNode.nextElementSibling.tagName === 'A') {
          odyssey.utils.dom.detach(scrollyData.mountNode.nextElementSibling);
        }
      }

      scrollyDatas.push(scrollyData);
    }

    resolve(scrollyDatas);
  })
);

const whenCountryTotalsFetched = fetch(COUNTRY_TOTALS_URL).then(response => response.json());

function renderAppsWhenReady() {
  Promise.all([whenScrollytellersLoaded, whenCountryTotalsFetched])
    .then(results => renderApps.apply(null, results))
    .catch(console.error);
}

renderAppsWhenReady();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      renderAppsWhenReady();
    } catch (err) {
      import('./components/ErrorBox').then(exports => {
        const ErrorBox = exports.default;
        render(<ErrorBox error={err} />, root);
      });
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
