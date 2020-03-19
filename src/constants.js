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
    highlightedCountries: KEY_COUNTRIES,
    trends: true
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
    highlightedCountries: KEY_COUNTRIES,
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
    trends: true
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
    highlightedTrends: [7]
  }
};

export const TRENDS = [
  // { name: 'Number of cases doubles every day', doublingTimePeriods: 1 },
  { name: 'Number of cases doubles every 2 days', doublingTimePeriods: 2 },
  { name: 'Number of cases doubles every 3 days', doublingTimePeriods: 3 },
  // { name: 'Number of cases doubles every 4 days', doublingTimePeriods: 4 },
  // { name: 'Number of cases doubles every 5 days', doublingTimePeriods: 5 },
  // { name: 'Number of cases doubles every 6 days', doublingTimePeriods: 6 },
  { name: 'Number of cases doubles every week', doublingTimePeriods: 7 }
  // { name: 'Number of cases doubles every 2 weeks', doublingTimePeriods: 14 },
  // { name: 'Number of cases doubles every month', doublingTimePeriods: 28 }
];
