import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import { COUNTRY_TOTALS_URL } from './constants';

const PROJECT_NAME = 'interactive-coronavirus-spread';
const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function renderApp(scrollyData, countryTotals) {
  render(<App scrollyData={scrollyData} countryTotals={countryTotals} />, scrollyData.mountNode);
}

const whenOdysseyLoaded = new Promise(resolve =>
  window.__ODYSSEY__
    ? resolve(window.__ODYSSEY__)
    : window.addEventListener('odyssey:api', () => resolve(window.__ODYSSEY__))
);

const whenScrollytellerLoaded = new Promise((resolve, reject) =>
  whenOdysseyLoaded.then(odyssey => {
    let scrollyData;

    try {
      scrollyData = loadScrollyteller('one', 'u-full');
    } catch (err) {
      reject(err);
    }

    // Keep the DOM tidy.
    if (scrollyData && scrollyData.mountNode) {
      while (scrollyData.mountNode.nextElementSibling.tagName === 'A') {
        odyssey.utils.dom.detach(scrollyData.mountNode.nextElementSibling);
      }
    }

    resolve(scrollyData);
  })
);

const whenCountryTotalsFetched = fetch(COUNTRY_TOTALS_URL).then(response => response.json());

function renderAppWhenReady() {
  Promise.all([whenScrollytellerLoaded, whenCountryTotalsFetched])
    .then(results => renderApp.apply(null, results))
    .catch(console.error);
}

renderAppWhenReady();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      renderAppWhenReady();
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