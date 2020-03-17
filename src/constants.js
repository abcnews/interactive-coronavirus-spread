export const DATA_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/data.json';
export const COUNTRY_TOTALS_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json';

const KEY_COUNTRIES = ['Australia', 'China', 'Italy', 'Singapore', 'South Korea', 'UK', 'US'];

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true,
    trends: false
  },
  china: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true,
    highlightedCountries: ['China'],
    trends: true
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true,
    trends: true
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: true
  },
  hundred: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'linear',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: true
  },
  doubling: {
    graphic: 'doubling'
  },
  logarithmic: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: false
  },
  trends: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    trends: true,
    highlightedTrends: true
  },
  lowtrend: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    trends: true,
    highlightedTrends: ['low']
  }
};
