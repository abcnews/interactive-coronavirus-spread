import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  OTHER_PLACES,
  EXCLUDED_PLACES,
  PLACES_ALIASES,
  ALIASES_PLACES,
  PLACES_LOOKUP_URL,
  PLACES_DATA_ENDPOINT,
  PLACES_TESTING_DATA_URL,
  SHIPS
} from './constants';
import { clone } from './misc-utils';
import PLACES_POPULATIONS from './population';

const fetchCache = {};

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

const useDataLoader = url => {
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
  }, []);

  return state;
};

const dataMultiFetchReducer = (state, action) => {
  switch (action.type) {
    case 'MULTI_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        error: null,
        data: null
      };
    case 'MULTI_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        data: action.payload
      };
    case 'MULTI_FETCH_FAILURE':
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

const useDataMultiLoader = urls => {
  const [state, dispatch] = useReducer(dataMultiFetchReducer, {
    isLoading: false,
    error: null,
    data: null
  });

  useEffect(() => {
    let wasCancelled = false;

    if (urls.length > 0) {
      dispatch({ type: 'MULTI_FETCH_INIT' });

      Promise.all(
        urls.map(url => {
          if (!fetchCache[url]) {
            fetchCache[url] = fetch(url)
              .then(response => response.json())
              .catch(error => {
                if (!wasCancelled) {
                  dispatch({ type: 'MULTI_FETCH_FAILURE', payload: error });
                }
              });
          }

          return fetchCache[url];
        })
      )
        .then(data => {
          if (!wasCancelled) {
            dispatch({ type: 'MULTI_FETCH_SUCCESS', payload: data });
          }
        })
        .catch(error => {
          if (!wasCancelled) {
            dispatch({ type: 'MULTI_FETCH_FAILURE', payload: error });
          }
        });
    }

    return () => {
      wasCancelled = true;
    };
  }, [urls.length]);

  return state;
};

export const usePlacesLookupData = () => useDataLoader(PLACES_LOOKUP_URL);

const placesDataCache = {};

export const usePlacesData = places => {
  const placesDataCacheKey = places ? places.join('') : '*';

  const {
    isLoading: isPlacesLookupDataLoading,
    error: placesLookupDataError,
    data: lookupData
  } = usePlacesLookupData();

  const { isLoading: isPlacesDataLoading, error: placesDataError, data: placesData } = useDataMultiLoader(
    lookupData
      ? // ? places.reduce((urls, place) => {
        (places || Object.keys(lookupData)).reduce((urls, place) => {
          const lookupDataKey = ALIASES_PLACES[place] || place;
          const lookupDataValue = lookupData[lookupDataKey];

          if (lookupDataValue) {
            urls.push(`${PLACES_DATA_ENDPOINT}${lookupDataValue}`);
          }

          return urls;
        }, [])
      : []
  );

  return {
    isLoading: isPlacesLookupDataLoading || isPlacesDataLoading,
    error: placesLookupDataError || placesDataError,
    data: useMemo(() => {
      if (placesData === null) {
        return null;
      }

      if (!placesDataCache[placesDataCacheKey]) {
        let data = clone(
          placesData.reduce(
            (memo, placeData) => ({
              ...memo,
              [placeData.name]: placeData
            }),
            {}
          )
        );

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

        placesDataCache[placesDataCacheKey] = data;
      }

      return clone(placesDataCache[placesDataCacheKey]);
    }, [placesData])
  };
};

let placesTestingDataCache = null;

const TESTING_PLACES = ['Australia', 'Germany', 'Korea, South', 'United Kingdom', 'US'];

export const usePlacesTestingData = () => {
  const { isLoading: isPlacesTestingLoading, error: placesTestingError, data: placesTestingData } = useDataLoader(
    PLACES_TESTING_DATA_URL
  );
  const { isLoading: isSupplementaryLoading, error: supplementaryError, data: supplementaryData } = usePlacesData(
    TESTING_PLACES
  );

  return {
    isLoading: isSupplementaryLoading || isPlacesTestingLoading,
    error: supplementaryError || placesTestingError,
    data: useMemo(() => {
      if (placesTestingData == null || supplementaryData == null) {
        return null;
      }

      if (!placesTestingDataCache) {
        const data = clone(placesTestingData);

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

        placesTestingDataCache = data;
      }

      return clone(placesTestingDataCache);
    }, [placesTestingData, supplementaryData])
  };
};
