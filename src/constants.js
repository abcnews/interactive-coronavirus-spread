export const DATA_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/data.json';
export const COUNTRY_TOTALS_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json';

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear'
  },
  hundred: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'linear'
  },
  doubling: {
    graphic: 'doubling'
  },
  logarithmic: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic'
  }
};
