import { useEffect, useMemo, useReducer, useState } from 'react';
import { OTHER_PLACES, PLACES_DATA_URL, PLACES_TESTING_DATA_URL, SHIPS } from './constants';
import COUNTRIES_POPULATIONS from './population';

const PLACE_NAME_REPLACEMENTS = [
  [/^([A-Z])\w+\s([A-Z])\w+\s([A-Z])\w+$/, '$1$2$3'],
  [/\sand(\sthe)?\s/, ' & '],
  [/^East\s/, 'E. '],
  [/ew\sZealand$/, 'Z'],
  [/^North\s/, 'N. '],
  [/^Saint\s/, 'St. '],
  [/^South\s/, 'S. '],
  [/^(\w+),\sSouth/, 'S. $1'],
  [/\*$/, ''],
  [/nited\s([A-Z])\w+$/, '$1'],
  [/^West\s/, 'W. ']
];

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        error: null,
        data: null
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        data: action.payload
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        data: null
      };
    default:
      throw new Error(`Invalid action type: ${action.type}`);
  }
};

const fetchCache = {};

const useDataLoader = initialURL => {
  const [url, setURL] = useState(initialURL);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    error: null,
    data: null
  });

  useEffect(() => {
    let wasCancelled = false;

    dispatch({ type: 'FETCH_INIT' });

    if (!fetchCache[url]) {
      fetchCache[url] = fetch(url).then(response => response.json());
    }

    fetchCache[url]
      .then(data => {
        if (!wasCancelled) {
          dispatch({ type: 'FETCH_SUCCESS', payload: data });
        }
      })
      .catch(error => {
        if (!wasCancelled) {
          dispatch({ type: 'FETCH_FAILURE', payload: error });
        }
      });

    return () => {
      wasCancelled = true;
    };
  }, [url]);

  return [state, setURL];
};

function clone(value) {
  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(clone);
  }

  const _value = {};

  for (const key in value) {
    _value[key] = clone(value[key]);
  }

  return _value;
}

export const usePlacesData = initialURL => {
  const [{ isLoading, error, data: loadedData }, setURL] = useDataLoader(initialURL || PLACES_DATA_URL);

  return [
    {
      isLoading,
      error,
      data: useMemo(() => {
        if (loadedData === null) {
          return null;
        }

        const data = clone(loadedData);

        for (const originalPlaceName in data) {
          let nextPlaceName = originalPlaceName;

          PLACE_NAME_REPLACEMENTS.forEach(pnr => {
            const [pattern, replacement] = pnr;

            if (pattern.test(nextPlaceName)) {
              nextPlaceName = nextPlaceName.replace(pattern, replacement);
            }
          });

          if (nextPlaceName !== originalPlaceName) {
            data[nextPlaceName] = data[originalPlaceName];
            delete data[originalPlaceName];
          }
        }

        if (data['Western Sahara']) {
          delete data['Western Sahara'];
        }

        // Modify existing data format until we have the new format
        for (const place in data) {
          for (const date in data[place]) {
            // Remove last Australian date if it's missing cumulative deaths
            if (place === 'Australia' && data[place][date].deaths == null) {
              delete data[place][date];
              continue;
            }

            data[place][date] = {
              cases: data[place][date].cases || 0,
              deaths: data[place][date].deaths || 0,
              recoveries: data[place][date].recoveries || data[place][date].recovered || 0
            };
          }

          data[place] = {
            type:
              place === 'Worldwide'
                ? 'aggregate'
                : SHIPS.indexOf(place) > -1
                ? 'ship'
                : OTHER_PLACES.indexOf(place) > -1
                ? 'other'
                : 'country',
            dates: data[place]
          };

          if (data[place].type === 'country') {
            data[place].population = COUNTRIES_POPULATIONS[place];
          }
        }

        return data;
      }, [loadedData])
    },
    setURL
  ];
};

const supplementaryURLs = {
  [PLACES_TESTING_DATA_URL]: PLACES_DATA_URL
};

function getSupplementaryURL(url) {
  return supplementaryURLs[url.split('?')[0]];
}

export const usePlacesTestingData = initialURL => {
  const [{ isLoading, error, data: loadedData }, setPlacesTestingDataURL] = useDataLoader(
    initialURL || PLACES_TESTING_DATA_URL
  );
  const [
    { isLoading: isSupplementaryLoading, error: supplementaryError, data: supplementaryData },
    setPlacesDataURL
  ] = usePlacesData(getSupplementaryURL(initialURL || PLACES_TESTING_DATA_URL));

  return [
    {
      isLoading: isSupplementaryLoading || isLoading,
      error: supplementaryError || error,
      data: useMemo(() => {
        if (loadedData == null || supplementaryData == null) {
          return null;
        }

        const data = clone(loadedData);

        for (const place in data) {
          const supplementaryDataPlace = supplementaryData[place];

          for (const date in data[place]) {
            const tests = data[place][date];
            const supplementaryDataPlaceDate = supplementaryDataPlace.dates[date];
            const cases = supplementaryDataPlaceDate ? supplementaryDataPlaceDate.cases : 0;

            data[place][date] = {
              tests,
              cases,
              testspcc: cases ? tests / cases : 0
            };
          }

          data[place] = {
            type: supplementaryDataPlace.type,
            population: supplementaryDataPlace.population,
            dates: data[place]
          };
        }

        return data;
      }, [loadedData, supplementaryData])
    },
    url => {
      setPlacesTestingDataURL(url || PLACES_TESTING_DATA_URL);
      setPlacesDataURL(getSupplementaryURL(url || PLACES_TESTING_DATA_URL));
    }
  ];
};
