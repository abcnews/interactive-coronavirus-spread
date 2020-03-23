import * as a2o from '@abcnews/alternating-case-to-object';
import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import { COUNTRY_TOTALS_URL, PRESETS } from './constants';

const PROJECT_NAME = 'interactive-coronavirus-spread';
const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);
const casesGraphicsRoots = [...document.querySelectorAll(`a[name^=casesgraphicPRESET]`)].map(anchorEl => {
  const props = a2o(anchorEl.getAttribute('name'));
  const mountEl = document.createElement('div');

  mountEl.className = 'u-pull';

  Object.keys(props).forEach(propName => (mountEl.dataset[propName] = props[propName]));
  anchorEl.parentElement.insertBefore(mountEl, anchorEl);
  anchorEl.parentElement.removeChild(anchorEl);

  return mountEl;
});

function renderApps(scrollyDatas, countryTotals) {
  scrollyDatas.forEach(scrollyData =>
    render(<App scrollyData={scrollyData} countryTotals={countryTotals} />, scrollyData.mountNode)
  );
  casesGraphicsRoots.forEach(casesGraphicRoot =>
    render(
      <InlineGraphic>
        <CasesGraphic
          preset={casesGraphicRoot.dataset.preset}
          countryTotals={countryTotals}
          {...PRESETS[casesGraphicRoot.dataset.preset]}
        />
      </InlineGraphic>,
      casesGraphicRoot
    )
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

const whenCountryTotalsFetched = fetch(COUNTRY_TOTALS_URL)
  .then(response => response.json())
  .then(data => {
    // Convert old item-based WHO format to match key-based John Hopkins format (combining Province/State data)
    data = Array.isArray(data)
      ? data
          .sort((a, b) =>
            a['Country/Region'] > b['Country/Region'] ? 1 : b['Country/Region'] > a['Country/Region'] ? -1 : 0
          )
          .reduce((memo, item) => {
            memo[item['Country/Region']] = item.Cases.reduce((memo, item) => {
              memo[item.Date] = (memo[item.Date] || 0) + item.Confirmed;

              return memo;
            }, memo[item['Country/Region']] || {});

            return memo;
          }, {})
      : data;

    // Rename countries / remove unused
    data['South Korea'] = data['Korea, South'] || data['South Korea'];
    data['Taiwan'] = data['Taiwan*'] || data['Taiwan'];
    data['UK'] = data['United Kingdom'] || data['UK'];
    data['US'] = data['United States'] || data['US'];
    delete data['Korea, South'];
    delete data['Taiwan*'];
    delete data['United Kingdom'];
    delete data['United States'];
    delete data['World'];

    return Promise.resolve(data);
  });

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
