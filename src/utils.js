import * as a2o from '@abcnews/alternating-case-to-object';
import { decode, encode } from '@abcnews/base-36-props';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import TestingGraphic from './components/TestingGraphic';
import { OTHER_PLACES, PLACES_DATA_URL, PRESETS, SHIPS } from './constants';
import COUNTRIES_POPULATIONS from './population';

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

export const fetchPlacesData = shouldMockTestsData =>
  fetch(PLACES_DATA_URL)
    .then(response => response.json())
    .then(data => {
      Object.keys(data).forEach(key => {
        let currentPlaceName = key;

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

      if (data['Western Sahara']) {
        delete data['Western Sahara'];
      }

      // Modify existing data format until we have the new format
      Object.keys(data).forEach(place => {
        Object.keys(data[place]).forEach(date => {
          // Remove last Australian date if it's missing cumulative deaths
          if (place === 'Australia' && data[place][date].deaths == null) {
            delete data[place][date];
            return;
          }

          data[place][date] = shouldMockTestsData // TODO: make this real data, not a hack
            ? {
                tests: (data[place][date].cases || 0) * 20
              }
            : {
                cases: data[place][date].cases || 0,
                deaths: data[place][date].deaths || 0,
                recoveries: data[place][date].recoveries || data[place][date].recovered || 0
              };
        });

        data[place] = {
          type:
            place === 'Worldwide'
              ? 'aggregate'
              : SHIPS.indexOf(place) > -1
              ? 'ship'
              : OTHER_PLACES.indexOf(place) > -1
              ? 'other'
              : 'country',
          dates: data[place]
        };

        if (data[place].type === 'country') {
          data[place].population = COUNTRIES_POPULATIONS[place];
        }
      });

      return Promise.resolve(data);
    });

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};

export const updateLegacyProps = props => {
  // Support legacy configs (when the "daysSince100Cases" xScaleType was called "days")
  if (props && props.xScaleType === 'days') {
    props.xScaleType = 'daysSince100Cases';
  }

  return props;
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

    // Look for longform encoded props elsewhere (assuming only a hint is currently used)
    if (props.encoded) {
      const longformAnchorEl = document.querySelector(`a[id^="${props.encoded}"],a[name^="${props.encoded}"]`);

      if (longformAnchorEl) {
        props.encoded = longformAnchorEl.getAttribute('id') || longformAnchorEl.getAttribute('name');
      }
    }

    const casesGraphicOtherProps = updateLegacyProps(
      props.encoded ? decodeVersionedProps(props.encoded) : props.preset ? PRESETS[props.preset] : null
    );

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

export const renderTestingGraphics = placesData =>
  [...document.querySelectorAll(`a[id^=testinggraphic],a[name^=testinggraphic]`)].map(anchorEl => {
    const props = a2o(anchorEl.getAttribute('id') || anchorEl.getAttribute('name'));
    const mountEl = document.createElement('div');

    mountEl.className = 'u-pull';

    Object.keys(props).forEach(propName => (mountEl.dataset[propName] = props[propName]));
    anchorEl.parentElement.insertBefore(mountEl, anchorEl);
    anchorEl.parentElement.removeChild(anchorEl);

    const testingGraphicPresetProp = props.encoded || props.preset;

    // Look for longform encoded props elsewhere (assuming only a hint is currently used)
    if (props.encoded) {
      const longformAnchorEl = document.querySelector(`a[id^="${props.encoded}"],a[name^="${props.encoded}"]`);

      if (longformAnchorEl) {
        props.encoded = longformAnchorEl.getAttribute('id') || longformAnchorEl.getAttribute('name');
      }
    }

    const testingGraphicOtherProps = updateLegacyProps(
      props.encoded ? decodeVersionedProps(props.encoded) : props.preset ? PRESETS[props.preset] : null
    );

    render(
      <InlineGraphic>
        {testingGraphicOtherProps && (
          <TestingGraphic
            preset={testingGraphicPresetProp}
            placesData={placesData}
            maxDate={getInclusiveDateFromYYYYMMDD(mountEl.dataset.maxdate)}
            {...testingGraphicOtherProps}
          />
        )}
      </InlineGraphic>,
      mountEl
    );
  });
