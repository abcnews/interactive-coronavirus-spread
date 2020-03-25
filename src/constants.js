export const DATA_ENDPOINT = 'https://www.abc.net.au/dat/news/interactives/covid19-data/';
export const JOHN_HOPKINS_DATA_URL = `${DATA_ENDPOINT}data.json`;
export const JOHN_HOPKINS_COUNTRY_TOTALS_URL = `${DATA_ENDPOINT}country-totals.json`;
export const WHO_COUNTRY_TOTALS_URL = `${DATA_ENDPOINT}/who-country-totals.json`;
export const ECDC_COUNTRY_TOTALS_URL = `${DATA_ENDPOINT}/ecdc-country-totals.json`;
export const COUNTRY_TOTALS_URL = ECDC_COUNTRY_TOTALS_URL;
export const ECDC_AFTER_100_CASES_URL = `${DATA_ENDPOINT}ecdc-after-100-cases.json`;
export const AFTER_100_CASES_URL = ECDC_AFTER_100_CASES_URL;
export const KEY_COUNTRIES = ['Australia', 'China', 'Italy', 'Japan', 'Singapore', 'S. Korea', 'Taiwan', 'UK', 'US'];
export const KEY_EUROPEAN_COUNTRIES = [
  // 'Albania',
  // 'Andorra',
  // 'Armenia',
  // 'Austria',
  // 'Azerbaijan',
  // 'Belarus',
  // 'Belgium',
  // 'Bosnia and Herzegovina',
  // 'Bulgaria',
  // 'Croatia',
  // 'Cyprus',
  // 'Czech Republic',
  'Denmark',
  // 'Estonia',
  // 'Finland',
  'France',
  // 'Georgia',
  'Germany',
  // 'Greece',
  // 'Hungary',
  // 'Iceland',
  // 'Ireland',
  'Italy',
  // 'Kazakhstan',
  // 'Latvia',
  // 'Liechtenstein',
  // 'Lithuania',
  // 'Luxembourg',
  // 'Macedonia',
  // 'Malta',
  // 'Moldova',
  // 'Monaco',
  // 'Montenegro',
  // 'Netherlands',
  // 'Norway',
  // 'Poland',
  // 'Portugal',
  // 'Romania',
  // 'Russia',
  // 'San Marino',
  // 'Serbia',
  // 'Slovakia',
  // 'Slovenia',
  'Spain',
  // 'Sweden',
  // 'Switzerland',
  // 'Turkey',
  // 'Ukraine',
  'UK'
  // 'Vatican City'
];
export const KEY_TRENDS = [2, 3, 7];

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: 1e5,
    countries: true,
    trends: false
  },
  single: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: 1e5,
    countries: ['China'],
    highlightedCountries: true,
    trends: false
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: 1e5,
    countries: true,
    trends: false
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: 1e5,
    trends: false
  },
  hundred: {
    graphic: 'cases',
    yScaleType: 'linear',
    casesCap: 1e5,
    trends: false
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
  doublingweek3: {
    graphic: 'doubling',
    marker: 'doublingweek3'
  },
  logarithmic: {
    graphic: 'cases',
    casesCap: 1e5,
    trends: false
  },
  trends: {
    graphic: 'cases',
    highlightedCountries: false,
    highlightedTrends: true,
    casesCap: 1e5
  },
  logtrends: {
    graphic: 'cases',
    casesCap: 1e5
  },
  zoomin: {
    graphic: 'cases',
    trends: false
  },
  thirtyk: {
    graphic: 'cases',
    casesCap: 3e4,
    trends: false
  },
  fortyk: {
    graphic: 'cases',
    casesCap: 4e4,
    trends: false
  },
  fiftyk: {
    graphic: 'cases',
    casesCap: 5e4,
    trends: false
  },
  trenditaly: {
    graphic: 'cases',
    highlightedCountries: ['Italy'],
    highlightedTrends: [2]
  },
  trendaustralia: {
    graphic: 'cases',
    highlightedCountries: ['Australia'],
    highlightedTrends: [3]
  },
  trendsingapore: {
    graphic: 'cases',
    highlightedCountries: ['Singapore'],
    highlightedTrends: [7]
  },
  australia: {
    graphic: 'cases',
    highlightedCountries: ['Australia']
  },
  china: {
    graphic: 'cases',
    highlightedCountries: ['China']
  },
  singapore: {
    graphic: 'cases',
    highlightedCountries: ['Singapore']
  },
  singtotaiwan: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Singapore', 'Taiwan']
  },
  taiwan: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Taiwan']
  },
  taiwantokorea: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Taiwan', 'S. Korea']
  },
  korea: {
    graphic: 'cases',
    highlightedCountries: ['S. Korea']
  },
  europe: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(KEY_EUROPEAN_COUNTRIES),
    highlightedCountries: KEY_EUROPEAN_COUNTRIES
  },
  koreatoitaly: {
    graphic: 'cases',
    highlightedCountries: ['S. Korea', 'Italy']
  },
  italy: {
    graphic: 'cases',
    highlightedCountries: ['Italy']
  },
  italytojapan: {
    graphic: 'cases',
    highlightedCountries: ['Italy', 'Japan']
  },
  unitedstates: {
    graphic: 'cases',
    highlightedCountries: ['US']
  }
};

export const TRENDS = [
  { name: 'day', doublingTimePeriods: 1 },
  { name: '2 days', doublingTimePeriods: 2 },
  { name: '3 days', doublingTimePeriods: 3 },
  { name: '4 days', doublingTimePeriods: 4 },
  { name: '5 days', doublingTimePeriods: 5 },
  { name: '6 days', doublingTimePeriods: 6 },
  { name: 'week', doublingTimePeriods: 7 },
  { name: '2 weeks', doublingTimePeriods: 14 },
  { name: 'month', doublingTimePeriods: 28 }
];
