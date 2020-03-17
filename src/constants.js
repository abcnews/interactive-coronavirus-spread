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
  doublinginit: {
    graphic: 'doubling',
    marker: 'doublinginit'
  },
  doublingweek1: {
    graphic: 'doubling',
    marker: 'doublingweek1'
  },
  doublingweek2: {
    graphic: 'doubling',
    marker: 'doublingweek2'
  },
  doublingmonth: {
    graphic: 'doubling',
    marker: 'doublingmonth'
  },
  logarithmic: {
    graphic: 'cases',
    booms: 100
  }
};
