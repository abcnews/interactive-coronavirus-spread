import { ALIASES_PLACES } from './constants';

export function clone(value, areDatesExpected) {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (areDatesExpected && value instanceof Date) {
    return new Date(value);
  }

  const _value = Array.isArray(value) ? [] : {};

  for (const key in value) {
    _value[key] = clone(value[key], areDatesExpected);
  }

  return _value;
}

const COLORS = [
  'teal',
  'orange',
  'cyan',
  'purple',
  'red',
  'blue',
  'brown',
  'green',
  'copy' /* copy = black/white, depending on preferred color scheme */
];

const COLOR_DIBS = {
  China: 'teal',
  Italy: 'orange',
  Singapore: 'cyan',
  'Korea, South': 'purple',
  'United Kingdom': 'red',
  US: 'blue',
  'Taiwan*': 'brown',
  Japan: 'green',
  Australia: 'copy'
};

export function generateColorAllocator(placesData) {
  const colorAllocation = {};
  let colorsUnallocated = [].concat(COLORS);

  // Pre-allocate places with dibs, then allocate remaining.
  placesData
    .filter(({ key }) => {
      const preferredColor = COLOR_DIBS[key];

      if (preferredColor && colorsUnallocated.indexOf(preferredColor) > -1) {
        colorAllocation[key] = preferredColor;
        colorsUnallocated = colorsUnallocated.filter(color => color !== preferredColor);

        return false;
      }

      return true;
    })
    .forEach(({ key }) => {
      if (!colorsUnallocated.length) {
        return;
      }

      colorAllocation[key] = colorsUnallocated.shift();
    });

  return key => {
    return colorAllocation[key] || 'none';
  };
}

export const last = x => x[x.length - 1];

export const movingAverage = (data, smoothing = 1, accessor = d => d, storer = v => v) =>
  data.reduce(
    (acc, d, i, arr) =>
      i < smoothing - 1
        ? acc
        : acc.concat(storer(arr.slice(i - smoothing + 1, i + 1).reduce((t, d) => t + accessor(d), 0) / smoothing, d)),
    []
  );

export const generateRenderId = () => (Math.random() * 0xfffff * 1000000).toString(16).slice(0, 8);

export const resolvePlacesAliasesInGraphicProps = props => {
  const resolver = place => ALIASES_PLACES[place] || place;

  ['places', 'highlightedPlaces'].forEach(propName => {
    if (!props[propName] || typeof props[propName] === 'function') {
      // Ignore undefined or filter functions
      return;
    }

    const places = props[propName].map(resolver);

    // We have to splice to avoid React's error on re-assigning a prop
    props[propName].splice(0, places.length, ...places);
  });
};
