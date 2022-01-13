import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  OTHER_PLACES,
  EXCLUDED_PLACES,
  PLACES_ALIASES,
  ALIASES_PLACES,
  GLOBAL_DATA_URL,
  PLACES_LOOKUP_URL,
  PLACES_DATA_ENDPOINT,
  PLACES_DATA_URL,
  PLACES_TESTING_DATA_URL,
  SHIPS
} from './constants';
import { clone } from './misc-utils';
import PLACES_POPULATIONS from './population';

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
    url,
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

export const usePlacesData = (url = PLACES_DATA_URL) => {
  const [{ isLoading, error, data: loadedData }] = useDataLoader(url);

  return {
    isLoading,
    error,
    data: useMemo(() => {
      if (loadedData === null) {
        return null;
      }

      if (!placesDataCache[url]) {
        let data = clone(loadedData);

        // Global data is in a slightly different format, so lets correct that
        if ('name' in data && data.name === 'Global') {
          delete data.name;
          data = {
            Global: data
          };
        }

        // Remove places we want to exclude
        for (const place of EXCLUDED_PLACES) {
          if (data[EXCLUDED_PLACES]) {
            delete data[EXCLUDED_PLACES];
          }
        }

        // Add aliases
        for (const place in data) {
          if (PLACES_ALIASES[place]) {
            data[place].alias = PLACES_ALIASES[place];
          }
        }

        // Clean-up tasks
        for (const place in data) {
          // Remove `country` prop from regions
          delete data[place].country;

          // Re-type some places
          data[place].type =
            place === 'Worldwide'
              ? 'aggregate'
              : SHIPS.indexOf(place) > -1
              ? 'ship'
              : OTHER_PLACES.indexOf(place) > -1
              ? 'other'
              : data[place].type;

          // Add `population` to places we have local data for
          if (PLACES_POPULATIONS[place]) {
            data[place].population = PLACES_POPULATIONS[place];
          }

          const { dates } = data[place];

          for (const date in dates) {
            // Remove last Australian date if it's missing cumulative deaths
            if (place === 'Australia' && dates[date].deaths == null) {
              delete dates[date];
              continue;
            }

            // Fill in non-zeroed props
            dates[date].cases = dates[date].cases || 0;
            dates[date].deaths = dates[date].deaths || 0;
            dates[date].recoveries = dates[date].recoveries || 0;
          }
        }

        placesDataCache[url] = data;
      }

      return clone(placesDataCache[url]);
    }, [loadedData])
  };
};

const supplementaryURLs = {
  [PLACES_TESTING_DATA_URL]: PLACES_DATA_URL
};

function getSupplementaryURL(url) {
  return supplementaryURLs[url.split('?')[0]];
}

const placesTestingDataCache = {};

export const usePlacesTestingData = initialURL => {
  const [{ url, isLoading, error, data: loadedData }] = useDataLoader(initialURL || PLACES_TESTING_DATA_URL);
  const { isLoading: isSupplementaryLoading, error: supplementaryError, data: supplementaryData } = usePlacesData(
    getSupplementaryURL(initialURL || PLACES_TESTING_DATA_URL)
  );

  return {
    isLoading: isSupplementaryLoading || isLoading,
    error: supplementaryError || error,
    data: useMemo(() => {
      if (loadedData == null || supplementaryData == null) {
        return null;
      }

      if (!placesTestingDataCache[url]) {
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

        placesTestingDataCache[url] = data;
      }

      return clone(placesTestingDataCache[url]);
    }, [loadedData, supplementaryData])
  };
};
