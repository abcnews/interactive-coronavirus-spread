import * as a2o from '@abcnews/alternating-case-to-object';
import { loadScrollyteller } from '@abcnews/scrollyteller';
import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import { COUNTRY_TOTALS_URL, PRESETS } from './constants';

const whenOdysseyLoaded = new Promise(resolve =>
  window.__ODYSSEY__
    ? resolve(window.__ODYSSEY__)
    : window.addEventListener('odyssey:api', () => resolve(window.__ODYSSEY__))
);

export const selectCasesGraphicsRoots = () =>
  [...document.querySelectorAll(`a[name^=casesgraphicPRESET]`)].map(anchorEl => {
    const props = a2o(anchorEl.getAttribute('name'));
    const mountEl = document.createElement('div');

    mountEl.className = 'u-pull';

    Object.keys(props).forEach(propName => (mountEl.dataset[propName] = props[propName]));
    anchorEl.parentElement.insertBefore(mountEl, anchorEl);
    anchorEl.parentElement.removeChild(anchorEl);

    return mountEl;
  });

export const fetchCountryTotals = () =>
  fetch(COUNTRY_TOTALS_URL)
    .then(response => response.json())
    .then(data => {
      // A bit of renaming & clean up
      data['S. Korea'] = data['Korea, South'] || data['South Korea'];
      data['Taiwan'] = data['Taiwan*'] || data['Taiwan'];
      data['UK'] = data['United Kingdom'] || data['UK'];
      data['US'] = data['United States'] || data['US'];

      delete data['Korea, South'];
      delete data['South Korea'];
      delete data['Taiwan*'];
      delete data['United Kingdom'];
      delete data['United States'];
      delete data['International'];
      delete data['World'];

      return Promise.resolve(data);
    });

export const loadScrollytellers = () =>
  new Promise((resolve, reject) =>
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

export const renderScrollytellerApps = (scrollyDatas, countryTotals) =>
  scrollyDatas.forEach(scrollyData =>
    render(<App scrollyData={scrollyData} countryTotals={countryTotals} />, scrollyData.mountNode)
  );

export const renderCasesGraphics = (casesGraphicsRoots, countryTotals) =>
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