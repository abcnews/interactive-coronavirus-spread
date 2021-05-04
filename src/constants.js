export const DATA_ENDPOINT = 'https://www.abc.net.au/dat/news/interactives/covid19-data/';
export const PLACES_DATA_URL = `${DATA_ENDPOINT}places-totals.json`;
export const GLOBAL_DATA_URL = `${DATA_ENDPOINT}places/global.json`;
export const PLACES_TESTING_DATA_URL = `${__webpack_public_path__}data/cumulative-testing-by-place-and-date.json`;
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
export const SHIPS = ['Diamond Princess', 'MS Zaandam'];
export const OTHER_PLACES = ['Holy See'];
export const EXCLUDED_PLACES = ['Western Sahara'];
export const KEY_TRENDS = [2, 3, 7];

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    yScaleCap: false,
    places: place => place.type === 'country',
    highlightedPlaces: KEY_PLACES.concat(['Spain', 'Germany', 'Iran', 'France'])
  },
  single: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    yScaleCap: false,
    places: ['China'],
    highlightedPlaces: true
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    yScaleCap: false,
    places: true
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    yScaleCap: false
  },
  hundred: {
    graphic: 'cases',
    yScaleType: 'linear',
    yScaleCap: false
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
    yScaleCap: false
  },
  trends: {
    graphic: 'cases',
    highlightedPlaces: false,
    highlightedTrends: true,
    yScaleCap: false,
    trends: KEY_TRENDS
  },
  logtrends: {
    graphic: 'cases',
    yScaleCap: false,
    trends: KEY_TRENDS
  },
  zoomin: {
    graphic: 'cases'
  },
  firstthirty: {
    graphic: 'cases',
    yScaleCap: false,
    xScaleDaysCap: 30
  },
  firstthirtyunderfiftyk: {
    graphic: 'cases',
    xScaleDaysCap: 30
  },
  trenditaly: {
    graphic: 'cases',
    highlightedPlaces: ['Italy'],
    trends: KEY_TRENDS,
    highlightedTrends: [2]
  },
  trendaustralia: {
    graphic: 'cases',
    highlightedPlaces: ['Australia'],
    trends: KEY_TRENDS,
    highlightedTrends: [3]
  },
  trendsingapore: {
    graphic: 'cases',
    highlightedPlaces: ['Singapore'],
    trends: KEY_TRENDS,
    highlightedTrends: [7]
  },
  australia: {
    graphic: 'cases',
    highlightedPlaces: ['Australia'],
    trends: KEY_TRENDS
  },
  china: {
    graphic: 'cases',
    yScaleCap: false,
    highlightedPlaces: ['China'],
    trends: KEY_TRENDS
  },
  singapore: {
    graphic: 'cases',
    highlightedPlaces: ['Singapore'],
    trends: KEY_TRENDS
  },
  singtotaiwan: {
    graphic: 'cases',
    highlightedPlaces: ['Singapore', 'Taiwan'],
    trends: KEY_TRENDS
  },
  taiwan: {
    graphic: 'cases',
    highlightedPlaces: ['Taiwan'],
    trends: KEY_TRENDS
  },
  taiwantokorea: {
    graphic: 'cases',
    highlightedPlaces: ['Taiwan', 'S. Korea'],
    trends: KEY_TRENDS
  },
  korea: {
    graphic: 'cases',
    highlightedPlaces: ['S. Korea'],
    trends: KEY_TRENDS
  },
  europe: {
    graphic: 'cases',
    places: KEY_PLACES.concat(KEY_EUROPEAN_PLACES),
    highlightedPlaces: KEY_EUROPEAN_PLACES,
    trends: KEY_TRENDS
  },
  koreatoitaly: {
    graphic: 'cases',
    highlightedPlaces: ['S. Korea', 'Italy'],
    trends: KEY_TRENDS
  },
  italy: {
    graphic: 'cases',
    highlightedPlaces: ['Italy'],
    trends: KEY_TRENDS
  },
  italytojapan: {
    graphic: 'cases',
    highlightedPlaces: ['Italy', 'Japan'],
    trends: KEY_TRENDS
  },
  unitedstates: {
    graphic: 'cases',
    yScaleCap: false,
    highlightedPlaces: ['US'],
    trends: KEY_TRENDS
  },
  australiantesting: {
    graphic: 'tests',
    highlightedPlaces: ['Australia']
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
