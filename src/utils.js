import * as a2o from '@abcnews/alternating-case-to-object';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import { COUNTRY_TOTALS_URL, PRESETS } from './constants';

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

      // Temporary transform to simulate multiple properties
      Object.keys(data).forEach(country => {
        Object.keys(data[country]).forEach(date => {
          data[country][date] = {
            cases: data[country][date],
            deaths: Math.round(data[country][date] * 0.02)
          };
        });
      });

      return Promise.resolve(data);
    });

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};

export const renderCasesGraphics = countryTotals =>
  [...document.querySelectorAll(`a[id^=casesgraphicPRESET],a[name^=casesgraphicPRESET]`)].map(anchorEl => {
    const props = a2o(anchorEl.getAttribute('id') || anchorEl.getAttribute('name'));
    const mountEl = document.createElement('div');

    mountEl.className = 'u-pull';

    Object.keys(props).forEach(propName => (mountEl.dataset[propName] = props[propName]));
    anchorEl.parentElement.insertBefore(mountEl, anchorEl);
    anchorEl.parentElement.removeChild(anchorEl);

    render(
      <InlineGraphic>
        <CasesGraphic
          preset={mountEl.dataset.preset}
          countryTotals={countryTotals}
          maxDate={getInclusiveDateFromYYYYMMDD(mountEl.dataset.maxdate)}
          {...PRESETS[mountEl.dataset.preset]}
        />
      </InlineGraphic>,
      mountEl
    );
  });
