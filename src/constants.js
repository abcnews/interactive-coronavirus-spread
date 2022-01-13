export const DATA_ENDPOINT = 'https://www.abc.net.au/dat/news/interactives/covid19-data/';
export const PLACES_DATA_ENDPOINT = `${DATA_ENDPOINT}places/`;
export const PLACES_LOOKUP_URL = `${DATA_ENDPOINT}places-lookup.json`;
export const PLACES_DATA_URL = `${DATA_ENDPOINT}places-totals.json`;
export const GLOBAL_DATA_URL = `${PLACES_DATA_ENDPOINT}global.json`;
export const PLACES_TESTING_DATA_URL = `${__webpack_public_path__}data/cumulative-testing-by-place-and-date.json`;

export const PLACES_ALIASES = {
  'Antigua and Barbuda': 'Antigua & Barbuda',
  'Australian Capital Territory': 'ACT',
  'Bonaire, Sint Eustatius and Saba': 'Bonaire, Sint Eustatius & Saba',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'British Virgin Islands': 'BVI',
  'Central African Republic': 'CAR',
  Connecticut: 'Conn.',
  'District Of Columbia': 'DC',
  'Korea, South': 'S. Korea',
  Massachusetts: 'Mass.',
  'New Hampshire': 'New Hamp.',
  'New South Wales': 'NSW',
  'New Zealand': 'NZ',
  'Newfoundland and Labrador': 'Newfoundland & Labrador',
  'North Carolina': 'N. Carolina',
  'North Dakota': 'N. Dakota',
  'North Macedonia': 'N. Macedonia',
  'Northern Mariana Islands': 'NMI',
  'Northern Territory': 'NT',
  'Papua New Guinea': 'PNG',
  'Prince Edward Island': 'PEI',
  Queensland: 'Qld',
  'Saint Barthelemy': 'St. Barthelemy',
  'Saint Helena, Ascension and Tristan da Cunha': 'St. Helena…',
  'Saint Kitts and Nevis': 'St. Kitts & Nevis',
  'Saint Lucia': 'St. Lucia',
  'Saint Pierre and Miquelon': 'St. Pierre & Miquelon',
  'Saint Vincent and the Grenadines': 'St. Vincent & Grenadines',
  'Sao Tome and Principe': 'Sao Tome & Principe',
  'South Africa': 'S. Africa',
  'South Australia': 'SA',
  'South Carolina': 'S. Carolina',
  'South Dakota': 'S. Dakota',
  'South Sudan': 'S. Sudan',
  'Taiwan*': 'Taiwan',
  Tasmania: 'Tas',
  'Trinidad and Tobago': 'Trinidad & Tobago',
  'Turks and Caicos Islands': 'Turks & Caicos Islands',
  'United Arab Emirates': 'UAE',
  'United Kingdom': 'UK',
  Victoria: 'Vic',
  'Wallis and Futuna': 'Wallis & Futuna',
  Washington: 'Wash.',
  'West Bank and Gaza': 'W. Bank & Gaza',
  'West Virginia': 'W. Virginia',
  'Western Australia': 'WA'
};
export const ALIASES_PLACES = Object.keys(PLACES_ALIASES).reduce((memo, place) => ({
  ...memo,
  [PLACES_ALIASES[place]]: place
}));

export const KEY_PLACES = [
  'Australia',
  'China',
  'Italy',
  'Japan',
  'Singapore',
  'Korea, South',
  'Taiwan*',
  'United Kingdom',
  'US'
];
export const KEY_EUROPEAN_PLACES = ['Denmark', 'France', 'Germany', 'Italy', 'Spain', 'United Kingdom'];
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
    highlightedPlaces: ['Singapore', 'Taiwan*'],
    trends: KEY_TRENDS
  },
  taiwan: {
    graphic: 'cases',
    highlightedPlaces: ['Taiwan'],
    trends: KEY_TRENDS
  },
  taiwantokorea: {
    graphic: 'cases',
    highlightedPlaces: ['Taiwan*', 'Korea, South'],
    trends: KEY_TRENDS
  },
  korea: {
    graphic: 'cases',
    highlightedPlaces: ['Korea, South'],
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
    highlightedPlaces: ['Korea, South', 'Italy'],
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
