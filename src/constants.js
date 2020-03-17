export const DATA_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/data.json';
export const COUNTRY_TOTALS_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json';

export const PRESETS = {
  initial: {
    graphic: 'cases',
    booms: 1
  },
  hundred: {
    graphic: 'cases',
    booms: 10
  },
  doubling: {
    graphic: 'doubling',
    marker: 'doubling'
  },
  doublinginit: {
    graphic: 'doubling',
    marker: 'doublinginit'
  },
  logarithmic: {
    graphic: 'cases',
    booms: 100
  }
};
