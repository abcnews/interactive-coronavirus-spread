import * as a2o from '@abcnews/alternating-case-to-object';
import { decode, encode } from '@abcnews/base-36-props';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import { PLACES_DATA_URL, PRESETS } from './constants';

export const encodeVersionedProps = props => encode({ version: process.env.npm_package_version, ...props });

export const decodeVersionedProps = encoded => {
  let decoded = null;
  try {
    decoded = decode(encoded);
  } catch (err) {
    console.error(err);
  }
  return decoded;
};

const PLACE_NAME_REPLACEMENTS = [
  [/^([A-Z])\w+\s([A-Z])\w+\s([A-Z])\w+$/, '$1$2$3'],
  [/\sand(\sthe)?\s/, ' & '],
  [/^East\s/, 'E. '],
  [/ew\sZealand$/, 'Z'],
  [/^North\s/, 'N. '],
  [/^Saint\s/, 'St. '],
  [/^South\s/, 'S. '],
  [/^(\w+),\sSouth/, 'S. $1'],
  [/\*$/, ''],
  [/nited\s([A-Z])\w+$/, '$1'],
  [/^West\s/, 'W. ']
];

export const fetchPlacesData = () =>
  fetch(PLACES_DATA_URL)
    .then(response => response.json())
    .then(data => {
      Object.keys(data).forEach(key => {
        let currentPlaceName = key;
        let wasReplaced = false;

        PLACE_NAME_REPLACEMENTS.forEach(pnr => {
          const [pattern, replacement] = pnr;

          if (pattern.test(currentPlaceName)) {
            const nextPlaceName = currentPlaceName.replace(pattern, replacement);
            data[nextPlaceName] = data[currentPlaceName];
            delete data[currentPlaceName];
            currentPlaceName = nextPlaceName;
          }
        });
      });

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

      return Promise.resolve(data);
    });

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};

export const renderCasesGraphics = placesData =>
  [...document.querySelectorAll(`a[id^=casesgraphic],a[name^=casesgraphic]`)].map(anchorEl => {
    const props = a2o(anchorEl.getAttribute('id') || anchorEl.getAttribute('name'));
    const mountEl = document.createElement('div');

    mountEl.className = 'u-pull';

    Object.keys(props).forEach(propName => (mountEl.dataset[propName] = props[propName]));
    anchorEl.parentElement.insertBefore(mountEl, anchorEl);
    anchorEl.parentElement.removeChild(anchorEl);

    const casesGraphicPresetProp = props.encoded || props.preset;
    const casesGraphicOtherProps = props.encoded
      ? decodeVersionedProps(props.encoded)
      : props.preset
      ? PRESETS[props.preset]
      : null;

    render(
      <InlineGraphic>
        {casesGraphicOtherProps && (
          <CasesGraphic
            preset={casesGraphicPresetProp}
            placesData={placesData}
            maxDate={getInclusiveDateFromYYYYMMDD(mountEl.dataset.maxdate)}
            {...casesGraphicOtherProps}
          />
        )}
      </InlineGraphic>,
      mountEl
    );
  });
