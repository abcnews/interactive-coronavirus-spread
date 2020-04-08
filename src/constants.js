export const DATA_ENDPOINT = 'https://www.abc.net.au/dat/news/interactives/covid19-data/';
// export const PLACES_TOTALS_URL = `${DATA_ENDPOINT}places-totals.json`;
export const PLACES_TOTALS_URL = `${DATA_ENDPOINT}country-totals-extra.json`;
export const KEY_PLACES = ['Australia', 'China', 'Italy', 'Japan', 'Singapore', 'S. Korea', 'Taiwan', 'UK', 'US'];
export const KEY_EUROPEAN_PLACES = [
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
    casesCap: false,
    places: true,
    highlightedPlaces: KEY_PLACES.concat(['Spain', 'Germany', 'Iran', 'France']),
    trends: false
  },
  single: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: false,
    places: ['China'],
    highlightedPlaces: true,
    trends: false
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: false,
    places: true,
    trends: false
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    casesCap: false,
    trends: false
  },
  hundred: {
    graphic: 'cases',
    yScaleType: 'linear',
    casesCap: false,
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
    casesCap: false,
    trends: false
  },
  trends: {
    graphic: 'cases',
    highlightedPlaces: false,
    highlightedTrends: true,
    casesCap: false
  },
  logtrends: {
    graphic: 'cases',
    casesCap: false
  },
  zoomin: {
    graphic: 'cases',
    trends: false
  },
  firstthirty: {
    graphic: 'cases',
    casesCap: false,
    daysCap: 30,
    trends: false
  },
  firstthirtyunderfiftyk: {
    graphic: 'cases',
    daysCap: 30,
    trends: false
  },
  trenditaly: {
    graphic: 'cases',
    highlightedPlaces: ['Italy'],
    highlightedTrends: [2]
  },
  trendaustralia: {
    graphic: 'cases',
    highlightedPlaces: ['Australia'],
    highlightedTrends: [3]
  },
  trendsingapore: {
    graphic: 'cases',
    highlightedPlaces: ['Singapore'],
    highlightedTrends: [7]
  },
  australia: {
    graphic: 'cases',
    highlightedPlaces: ['Australia']
  },
  china: {
    graphic: 'cases',
    casesCap: false,
    highlightedPlaces: ['China']
  },
  singapore: {
    graphic: 'cases',
    highlightedPlaces: ['Singapore']
  },
  singtotaiwan: {
    graphic: 'cases',
    places: KEY_PLACES.concat(['Taiwan']),
    highlightedPlaces: ['Singapore', 'Taiwan']
  },
  taiwan: {
    graphic: 'cases',
    places: KEY_PLACES.concat(['Taiwan']),
    highlightedPlaces: ['Taiwan']
  },
  taiwantokorea: {
    graphic: 'cases',
    places: KEY_PLACES.concat(['Taiwan']),
    highlightedPlaces: ['Taiwan', 'S. Korea']
  },
  korea: {
    graphic: 'cases',
    highlightedPlaces: ['S. Korea']
  },
  europe: {
    graphic: 'cases',
    places: KEY_PLACES.concat(KEY_EUROPEAN_PLACES),
    highlightedPlaces: KEY_EUROPEAN_PLACES
  },
  koreatoitaly: {
    graphic: 'cases',
    highlightedPlaces: ['S. Korea', 'Italy']
  },
  italy: {
    graphic: 'cases',
    highlightedPlaces: ['Italy']
  },
  italytojapan: {
    graphic: 'cases',
    highlightedPlaces: ['Italy', 'Japan']
  },
  unitedstates: {
    graphic: 'cases',
    casesCap: false,
    highlightedPlaces: ['US']
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
