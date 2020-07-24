import {
  ensureBlockMount,
  exactMountSelector,
  getMountValue,
  getTrailingMountValue,
  prefixedMountSelector
} from '@abcnews/mount-utils';
import * as acto from '@abcnews/alternating-case-to-object';
import { decode, encode } from '@abcnews/base-36-props';
import React from 'react';
import { render } from 'react-dom';
import CasesGraphic from './components/CasesGraphic';
import InlineGraphic from './components/InlineGraphic';
import TestingGraphic from './components/TestingGraphic';
import { OTHER_PLACES, PLACES_DATA_URL, PLACES_TESTING_DATA_URL, PRESETS, SHIPS } from './constants';
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

const CASES_GRAPHIC_MOUNT_PREFIX = 'casesgraphic';
const TESTING_GRAPHIC_MOUNT_PREFIX = 'testinggraphic';
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

export const fetchPlacesTestingData = () => {
  return Promise.all([fetch(PLACES_TESTING_DATA_URL).then(response => response.json()), fetchPlacesData()]).then(
    results => {
      const [data, supplementaryData] = results;

      Object.keys(data).forEach(place => {
        const supplementaryDataPlace = supplementaryData[place];

        Object.keys(data[place]).forEach(date => {
          const tests = data[place][date];
          const supplementaryDataPlaceDate = supplementaryDataPlace.dates[date];
          const cases = supplementaryDataPlaceDate ? supplementaryDataPlaceDate.cases : 0;

          data[place][date] = {
            tests,
            cases,
            testspcc: cases ? tests / cases : 0
          };
        });

        data[place] = {
          type: supplementaryDataPlace.type,
          population: supplementaryDataPlace.population,
          dates: data[place]
        };
      });

      return Promise.resolve(data);
    }
  );
};

export const fetchPlacesData = () =>
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

          data[place][date] = {
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

const prepareMountAndResolveProps = (mountEl, props) => {
  const presetProp = props.encoded || props.preset;

  mountEl.className = 'u-pull';
  Object.keys(props).forEach(propName => {
    mountEl.dataset[propName] = props[propName];
  });

  // Look for longform encoded props elsewhere (assuming only a hint is currently used)
  if (props.encoded) {
    const longformMountEl = document.querySelector(prefixedMountSelector(props.encoded));

    if (longformMountEl) {
      props.encoded = getMountValue(longformMountEl);
    }
  }

  const otherProps = updateLegacyProps(
    props.encoded ? decodeVersionedProps(props.encoded) : props.preset ? PRESETS[props.preset] : null
  );

  return [presetProp, otherProps];
};

export const renderCasesGraphics = placesData =>
  [...document.querySelectorAll(prefixedMountSelector(CASES_GRAPHIC_MOUNT_PREFIX))]
    .map(ensureBlockMount)
    .map(mountEl => {
      const props = acto(getTrailingMountValue(mountEl, CASES_GRAPHIC_MOUNT_PREFIX));
      const [presetProp, otherProps] = prepareMountAndResolveProps(mountEl, props);

      render(
        <InlineGraphic>
          {otherProps && (
            <CasesGraphic
              preset={presetProp}
              placesData={placesData}
              maxDate={getInclusiveDateFromYYYYMMDD(props.maxdate)}
              {...otherProps}
            />
          )}
        </InlineGraphic>,
        mountEl
      );
    });

export const renderTestingGraphics = placesData =>
  [...document.querySelectorAll(prefixedMountSelector(TESTING_GRAPHIC_MOUNT_PREFIX))]
    .map(ensureBlockMount)
    .map(mountEl => {
      const props = acto(getTrailingMountValue(mountEl, TESTING_GRAPHIC_MOUNT_PREFIX));
      const [presetProp, otherProps] = prepareMountAndResolveProps(mountEl, props);

      render(
        <InlineGraphic>
          {otherProps && (
            <TestingGraphic
              preset={presetProp}
              placesData={placesData}
              maxDate={getInclusiveDateFromYYYYMMDD(props.maxdate)}
              {...otherProps}
            />
          )}
        </InlineGraphic>,
        mountEl
      );
    });
