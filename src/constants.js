export const DATA_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/data.json';
export const COUNTRY_TOTALS_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json';
export const AFTER_100_CASES_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/after-100-cases.json';

export const KEY_COUNTRIES = ['Australia', 'China', 'Italy', 'Korea, South', 'Singapore', 'United Kingdom', 'US'];

export const ALIASES = {
  'Korea, South': 'South Korea',
  'United Kingdom': 'UK'
};

export const ABBREVIATIONS = {
  Australia: 'Aus',
  'United Kingdom': 'UK'
};

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
    countries: ['China'],
    highlightedCountries: true,
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
