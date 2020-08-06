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
  'S. Korea': 'purple',
  UK: 'red',
  US: 'blue',
  Taiwan: 'brown',
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
