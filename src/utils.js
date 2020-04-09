import * as a2o from '@abcnews/alternating-case-to-object';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import { PLACES_DATA_URL, PRESETS } from './constants';

export const fetchPlacesData = () =>
  fetch(PLACES_DATA_URL)
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

      // Modify existing data format until we have the new format
      Object.keys(data).forEach(place => {
        Object.keys(data[place]).forEach(date => {
          data[place][date] = {
            cases: data[place][date].cases || 0,
            deaths: data[place][date].deaths || 0,
            recoveries: data[place][date].recoveries || data[place][date].recovered || 0
          };
        });
        data[place] = {
          type: place === 'Worldwide' ? 'aggregate' : 'country',
          dates: data[place]
        };
      });

      console.log(data);

      return Promise.resolve(data);
    });

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};

export const renderCasesGraphics = placesData =>
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
          placesData={placesData}
          maxDate={getInclusiveDateFromYYYYMMDD(mountEl.dataset.maxdate)}
          {...PRESETS[mountEl.dataset.preset]}
        />
      </InlineGraphic>,
      mountEl
    );
  });
