import {
  axisBottom,
  axisLeft,
  curveLinear,
  curveMonotoneX,
  forceCollide,
  forceSimulation,
  forceY,
  format,
  line,
  range,
  scaleLinear,
  scaleLog,
  scaleTime,
  select,
  timeDay,
  timeWeek,
  timeFormat
} from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KEY_PLACES, KEY_EUROPEAN_PLACES, KEY_TRENDS, TRENDS } from '../../constants';
import { usePlacesData } from '../../data-loader';
import { clone, generateColorAllocator, last, movingAverage } from '../../misc-utils';
import styles from './styles.css';

const IS_TRIDENT = navigator.userAgent.indexOf('Trident') > -1;
const ONE_DAY = 864e5;
const REM = 16;
const MARGIN = {
  top: 3 * REM,
  right: 4.5 * REM,
  bottom: 3 * REM,
  left: 2.5 * REM
};
const PLOT_LABEL_HEIGHT = (REM / 4) * 3;
const TICK_VALUES = {
  logarithmic: [0.01, 0.1, 1, 10, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9]
};
const FORMAT_S = format('~s');
const TRANSITION_DURATIONS = {
  opacity: 250,
  transform: 1000
};
export const X_SCALE_TYPES = ['daysSince100Cases', 'daysSince1Death', 'daysSince1Recovery', 'dates'];
export const Y_SCALE_TYPES = ['logarithmic', 'linear'];
const Y_SCALE_TOTAL_PROPS = ['cases', 'deaths', 'recoveries'];
const Y_SCALE_TOTAL_INCLUDING_PMP_PROPS = Y_SCALE_TOTAL_PROPS.concat(Y_SCALE_TOTAL_PROPS.map(x => `${x}pmp`));
export const Y_SCALE_PROPS = Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.concat(
  Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.map(x => `new${x}`)
);
const LOWER_LOGARITHMIC_EXTENTS = {
  cases: 100,
  deaths: 1,
  recoveries: 1
};
export const UNDERLYING_PROPS_PATTERN = new RegExp(Y_SCALE_TOTAL_PROPS.join('|')); // matches all Y_SCALE_TOTAL_PROPS
export const UNDERLYING_PROPS_FOR_X_SCALE_TYPES = {
  daysSince100Cases: 'cases',
  daysSince1Death: 'deaths',
  daysSince1Recovery: 'recoveries'
};
const UNDERLYING_PROPS_LOWER_LOGARITHMIC_EXTENT_LABELS = {
  cases: '100th case',
  deaths: '1st death',
  recoveries: '1st recovery'
};
export const DEFAULT_CASES_CAP = 5e4; // 50k
export const DEFAULT_PROPS = {
  title: undefined,
  hasCredits: undefined,
  xScaleType: X_SCALE_TYPES[0],
  yScaleType: Y_SCALE_TYPES[0],
  yScaleProp: Y_SCALE_PROPS[0],
  xScaleDaysCap: false,
  yScaleCap: DEFAULT_CASES_CAP,
  hasLineSmoothing: true,
  rollingAverageDays: 1,
  places: KEY_PLACES,
  highlightedPlaces: KEY_PLACES,
  trends: KEY_TRENDS,
  highlightedTrends: false
};
const KEYING_FN = d => d.key;
const FOOTNOTES_CREDITS_MARKUP = `<small><a href="https://abc.net.au/news/12107500">Data sources: Johns Hopkins Coronavirus Resource Center, Our World in Data, The COVID Tracking Project, ABC</a></small>`;

const calculateDoublingTimePeriods = increasePerPeriod => Math.log(2) / Math.log(increasePerPeriod + 1);
const calculateIncreasePerPeriod = doublingTimePeriods => Math.exp(Math.log(2) / doublingTimePeriods) - 1;
const calculatePeriodsToIncrease = (increasePerPeriod, startingValue, endingValue) =>
  Math.log(endingValue / startingValue) / Math.log(increasePerPeriod + 1);
const inclusionCheckGenerator = (collection, itemPropName) => d =>
  typeof collection === 'boolean' ? collection : Array.isArray(collection) && collection.indexOf(d[itemPropName]) > -1;

function checkScaleTypes(xScaleType, yScaleType) {
  if (X_SCALE_TYPES.indexOf(xScaleType) === -1) {
    throw new Error(`Unrecognised xScaleType: ${xScaleType}`);
  }

  if (Y_SCALE_TYPES.indexOf(yScaleType) === -1) {
    throw new Error(`Unrecognised yScaleType: ${yScaleType}`);
  }
}

function checkScaleProps(yScaleProp) {
  if (Y_SCALE_PROPS.indexOf(yScaleProp) === -1) {
    throw new Error(`Unrecognised yScaleProp: ${yScaleProp}`);
  }
}

function createTrendCasesData(increasePerPeriod, daysToSimulate, startingValue) {
  const data = [startingValue];

  for (let i = 0; i < daysToSimulate - 1; i++) {
    data.push(data[i] * (1 + increasePerPeriod));
  }

  return data;
}

function generateTrendsData(trends, startDate, numDays, yUpperExtent) {
  if (numDays === 0) {
    return [];
  }
  const dates = [];
  let currentDate = new Date(startDate);

  for (let i = 0, len = numDays - 1; i < numDays; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends.reduce((memo, trend) => {
    const increasePerPeriod = calculateIncreasePerPeriod(trend.doublingTimePeriods);
    const casesData = createTrendCasesData(increasePerPeriod, numDays, 100).filter(count => count <= yUpperExtent);
    const item = {
      key: trend.name,
      doublingTimePeriods: trend.doublingTimePeriods,
      dataAs: {
        dates: casesData.map((cases, i) => ({ date: dates[i], cases })),
        daysSince100Cases: casesData.map((cases, i) => ({ day: i, cases }))
      }
    };

    const daysToYUpperExtent = calculatePeriodsToIncrease(increasePerPeriod, 100, yUpperExtent);
    const daysDiff = Math.min(1, daysToYUpperExtent - casesData.length + 1);

    if (daysDiff > 0) {
      const lastItem = last(item.dataAs.dates);

      if (daysDiff < 1) {
        // Meet extent of y-scale
        let fractionalDate = new Date(lastItem.date.valueOf() + ONE_DAY * daysDiff);

        item.dataAs.dates.push({ date: fractionalDate, cases: yUpperExtent });
        item.dataAs.daysSince100Cases.push({ day: daysToYUpperExtent, cases: yUpperExtent });
      } else {
        // Meet extent of x-scale
        let fractionalCases = lastItem.cases + lastItem.cases * increasePerPeriod;

        item.dataAs.dates.push({ date: new Date(lastItem.date.valueOf() + ONE_DAY), cases: fractionalCases });
        item.dataAs.daysSince100Cases.push({ day: casesData.length, cases: fractionalCases });
      }
    }

    return memo.concat([item]);
  }, []);
}

function setTruncatedLineDashArray(node) {
  const pathLength = node.getTotalLength();

  node.setAttribute('stroke-dasharray', `${pathLength - 32} 2 6 2 6 2 6 2 6`);
}

let transformedPlacesDataCache = {};

function transformPlacesData(placesData, cacheKey) {
  if (!transformedPlacesDataCache[cacheKey]) {
    transformedPlacesDataCache[cacheKey] = Object.keys(placesData)
      .map(place => {
        const placeDates = Object.keys(placesData[place].dates);
        const population = placesData[place].population || null;
        let dataAs_dates = placeDates
          .reduce((memo_dataAs_dates, placeDate, placeDatesIndex) => {
            const placeDatesTotals = placesData[place].dates[placeDate];
            const placeDatesTotalsProps = Object.keys(placeDatesTotals);
            const placeDatesTotalsIncludingPerMillionPeople =
              typeof population === 'number'
                ? {
                    ...placeDatesTotals,
                    ...placeDatesTotalsProps.reduce((memo_totals, prop) => {
                      memo_totals[`${prop}pmp`] = (placeDatesTotals[prop] / population) * 1e6;

                      return memo_totals;
                    }, {})
                  }
                : placeDatesTotals;
            const placeDatesTotalsIncludingPerMillionPeopleProps = Object.keys(
              placeDatesTotalsIncludingPerMillionPeople
            );

            return memo_dataAs_dates.concat([
              {
                date: new Date(placeDate),
                ...placeDatesTotalsIncludingPerMillionPeople,
                ...placeDatesTotalsIncludingPerMillionPeopleProps.reduce((memo_totals, prop) => {
                  const newProp = `new${prop}`;

                  if (placeDatesIndex === 0) {
                    memo_totals[newProp] = placeDatesTotalsIncludingPerMillionPeople[prop];
                  } else {
                    const previousDateTotals = memo_dataAs_dates[memo_dataAs_dates.length - 1];

                    memo_totals[newProp] = Math.max(
                      0,
                      placeDatesTotalsIncludingPerMillionPeople[prop] - previousDateTotals[prop]
                    );
                  }

                  return memo_totals;
                }, {})
              }
            ]);
          }, [])
          .filter(({ cases }) => cases >= 1);

        const dataAs_daysSince100Cases = dataAs_dates
          .filter(({ cases }) => cases >= 100)
          .map(({ date, ...otherProps }, index) => ({ day: index, ...otherProps }));

        const dataAs_daysSince1Death = dataAs_dates
          .filter(({ deaths }) => deaths >= 1)
          .map(({ date, ...otherProps }, index) => ({ day: index, ...otherProps }));

        const dataAs_daysSince1Recovery = dataAs_dates
          .filter(({ recoveries }) => recoveries >= 1)
          .map(({ date, ...otherProps }, index) => ({ day: index, ...otherProps }));

        return {
          key: place,
          type: placesData[place].type,
          population,
          dataAs: {
            dates: dataAs_dates,
            daysSince100Cases: dataAs_daysSince100Cases,
            daysSince1Death: dataAs_daysSince1Death,
            daysSince1Recovery: dataAs_daysSince1Recovery
          },
          ...Y_SCALE_PROPS.reduce((memo, propName) => {
            memo[`${propName}Max`] = Math.max.apply(null, [0].concat(dataAs_dates.map(t => t[propName])));

            return memo;
          }, {})
        };
      })
      .filter(d => d.casesMax >= 100) // Restrict to countries with at least 100 cases
      .sort((a, b) => b.cases - a.cases);
  }

  return transformedPlacesDataCache[cacheKey];
}

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

const generateRenderId = () => (Math.random() * 0xfffff * 1000000).toString(16).slice(0, 8);

let nextIDIndex = 0;

const CasesGraphic = props => {
  const renderId = generateRenderId();

  const { placesDataURL, xScaleType, yScaleType, rollingAverageDays, title, hasCredits } = {
    ...DEFAULT_PROPS,
    ...props
  };

  checkScaleTypes(xScaleType, yScaleType);

  const rootRef = useRef();
  const titleRef = useRef();
  const svgRef = useRef();
  const svgTitleRef = useRef();
  const svgDescRef = useRef();
  const footnotesRef = useRef();
  const [idIndex, svgID, titleID, descID] = useMemo(
    () => [
      nextIDIndex,
      `CasesGraphic${nextIDIndex}SVG`,
      `CasesGraphic${nextIDIndex}Title`,
      `CasesGraphic${nextIDIndex++}Desc`
    ],
    []
  );
  const footnotesMarkup = useMemo(() => {
    const footnotesMarkupParts = [];

    if (rollingAverageDays > 1) {
      footnotesMarkupParts.push(`<small>Values shown are ${rollingAverageDays} day averages.</small>`);
    }

    if (hasCredits) {
      footnotesMarkupParts.push(FOOTNOTES_CREDITS_MARKUP);
    }

    return footnotesMarkupParts.join(' ');
  }, [hasCredits, rollingAverageDays]);
  const [
    { isLoading: isPlacesDataLoading, error: placesDataError, data: untransformedPlacesData },
    setPlacesDataURL
  ] = usePlacesData(placesDataURL);
  const [placesData, earliestDate, latestDate] = useMemo(() => {
    if (!untransformedPlacesData) {
      return [];
    }

    const placesData = transformPlacesData(untransformedPlacesData, placesDataURL);
    const earliestDate = placesData.reduce((memo, d) => {
      const candidate = d.dataAs.dates[0].date;

      if (candidate < memo) {
        return candidate;
      }

      return memo;
    }, placesData[0].dataAs.dates[0].date);
    const latestDate = placesData.reduce((memo, d) => {
      const candidate = last(d.dataAs.dates).date;

      if (candidate > memo) {
        return candidate;
      }

      return memo;
    }, last(placesData[0].dataAs.dates).date);

    return [placesData, earliestDate, latestDate];
  }, [untransformedPlacesData]);
  const [state, setState] = useState({
    width: null,
    height: null,
    svgHeight: null
  });
  const prevProps = usePrevious(props);
  const prevUntransformedPlacesData = usePrevious(untransformedPlacesData);
  const prevState = usePrevious(state);

  function debug(message) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CasesGraphic ${idIndex}:${renderId}] ${message}`);
    }
  }

  function measureAndSetDimensions(client) {
    if (client && !client.hasChanged) {
      return;
    }

    if (!rootRef.current) {
      return;
    }

    const { width, height } = rootRef.current.getBoundingClientRect();
    const titleRect = titleRef.current.getBoundingClientRect();
    const footnotesRect = footnotesRef.current.getBoundingClientRect();

    setState({ width, height, svgHeight: height - (titleRect.height + footnotesRect.height) });
  }

  function nonOdysseyMeasureAndSetDimensions() {
    measureAndSetDimensions({ hasChanged: true });
  }

  useEffect(() => {
    measureAndSetDimensions();

    if (window.__ODYSSEY__) {
      window.__ODYSSEY__.scheduler.subscribe(measureAndSetDimensions);
    } else {
      window.addEventListener('resize', nonOdysseyMeasureAndSetDimensions);
    }

    return () => {
      if (window.__ODYSSEY__) {
        window.__ODYSSEY__.scheduler.unsubscribe(measureAndSetDimensions);
      } else {
        window.removeEventListener('resize', nonOdysseyMeasureAndSetDimensions);
      }
    };
  }, []);

  useEffect(() => {
    if (!prevProps) {
      // Dont update on initial render
      debug('After initial render');
      return;
    }

    let {
      title,
      hasCredits,
      places,
      yScaleCap,
      xScaleDaysCap,
      highlightedPlaces,
      highlightedTrends,
      preset,
      trends,
      xScaleType,
      yScaleType,
      yScaleProp,
      hasLineSmoothing,
      rollingAverageDays,
      fromDate,
      toDate
    } = {
      ...DEFAULT_PROPS,
      ...props
    };

    if (placesDataURL !== prevProps.placesDataURL) {
      debug('Places data URL change requires reload');

      return setPlacesDataURL(placesDataURL);
    }

    const { width, height, svgHeight } = state;
    const wasResize = width !== prevState.width || height !== prevState.height || svgHeight !== prevState.svgHeight;

    if (preset === prevProps.preset && untransformedPlacesData === prevUntransformedPlacesData && !wasResize) {
      debug("No changes to preset or untransformedPlacesData and wasn't resized");
      return;
    }

    if (
      title !== prevProps.title ||
      hasCredits !== prevProps.hasCredits ||
      rollingAverageDays !== prevProps.rollingAverageDays
    ) {
      debug('Title / footnotes change requires resize');
      requestAnimationFrame(() => measureAndSetDimensions());
    }

    if (isPlacesDataLoading) {
      debug('Places data is still loading');
      return;
    }

    if (placesDataError) {
      debug(`Error loading places data: ${placesDataError}`);
      return;
    }

    debug('Performing standard update');

    rootRef.current.setAttribute('data-preset', preset);

    checkScaleTypes(xScaleType, yScaleType);
    checkScaleProps(yScaleProp);

    if (typeof places === 'function') {
      // Apply a filter
      places = placesData.filter(places).map(x => x.key);
    }

    const timeLowerExtent = fromDate ? new Date(fromDate) : earliestDate;
    const timeUpperExtent = toDate ? new Date(toDate) : latestDate;
    const timeRangeDays = Math.round((timeUpperExtent - timeLowerExtent) / ONE_DAY);
    const timeRangeFilter = d => d.date >= timeLowerExtent && d.date <= timeUpperExtent;
    const daysCapFilter = d => xScaleDaysCap === false || d.day <= xScaleDaysCap;

    // Only allow trend lines when we are showing cases since 100th case
    if (yScaleProp !== 'cases' || xScaleType !== 'daysSince100Cases') {
      trends = false;
      highlightedTrends = false;
    }

    const xScaleProp = xScaleType === 'dates' ? 'date' : 'day';

    const isDailyFigures = yScaleProp.indexOf('new') === 0;
    const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

    if (isDailyFigures || isPerCapitaFigures) {
      yScaleCap = false;
    }

    const underlyingProp = yScaleProp.match(UNDERLYING_PROPS_PATTERN)[0];
    const logarithmicLowerExtent =
      LOWER_LOGARITHMIC_EXTENTS[yScaleProp] || (isDailyFigures && isPerCapitaFigures ? 0.01 : 0.1);
    const logarithmicLowerExtentFilter = d => d[underlyingProp] >= LOWER_LOGARITHMIC_EXTENTS[underlyingProp];

    // Filter placesData to just visible places, and create visible/highlighted comparison utils
    const isPlaceVisible = inclusionCheckGenerator(places, 'key');
    const isPlaceHighlighted = inclusionCheckGenerator(highlightedPlaces, 'key');

    let yUpperExtent = yScaleCap || 0;
    let xDaysUpperExtent = xScaleDaysCap || 0;

    // Get the subset of placesData we'll be binding to our graphic during this render
    const visiblePlacesData = placesData
      .filter(isPlaceVisible)
      .filter(place => !isPerCapitaFigures || place.population != null)
      .filter(
        place =>
          place.dataAs[xScaleType]
            .filter(d => (xScaleType !== 'dates' ? daysCapFilter(d) : timeRangeFilter(d)))
            .filter(d => typeof yScaleCap !== 'number' || d[yScaleProp] <= yScaleCap)
            .filter(d => yScaleType !== 'logarithmic' || logarithmicLowerExtentFilter(d))
            .map(d => {
              // Update dataset-limited extents for use in scales/filters later

              if (xScaleType !== 'dates') {
                xDaysUpperExtent = Math.max(xDaysUpperExtent, d[xScaleProp]);
              }

              if (typeof yScaleCap !== 'number') {
                yUpperExtent = Math.max(yUpperExtent, d[yScaleProp]);
              }

              return d;
            }).length > 0
      )
      .map(_place => {
        // Each props/state update, we work with clones of the places we need,
        // with optional moving averages applied to their data.
        const place = clone(_place, true);

        if (rollingAverageDays < 2) {
          return place;
        }

        place.dataAs[xScaleType] = movingAverage(
          place.dataAs[xScaleType],
          rollingAverageDays,
          d => d[yScaleProp],
          (yScalePropValue, d) => ({
            ...d,
            [yScaleProp]: yScalePropValue
          })
        );

        // Update yUpperExtent, taking into account the smoothing provided by the rolling average
        if (typeof yScaleCap !== 'number') {
          yUpperExtent = 0;
          place.dataAs[xScaleType].map(d => {
            yUpperExtent = Math.max(yUpperExtent, d[yScaleProp]);
          });
        }

        return place;
      });

    const xAxisLabel =
      xScaleProp === 'day' ? `Days since ${UNDERLYING_PROPS_LOWER_LOGARITHMIC_EXTENT_LABELS[underlyingProp]}` : 'Date';
    const yAxisLabel = `${isDailyFigures ? 'Daily' : 'Cumulative'} known ${yScaleProp
      .replace('new', 'new ')
      .replace('pmp', ' per million people')} since ${
      UNDERLYING_PROPS_LOWER_LOGARITHMIC_EXTENT_LABELS[yScaleProp.match(UNDERLYING_PROPS_PATTERN)[0]]
    }`;
    const opacityTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.opacity;
    const transformTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.transform;
    const chartWidth = width - MARGIN.right - MARGIN.left;
    const chartHeight = svgHeight - MARGIN.top - MARGIN.bottom;
    const xScale = (xScaleType === 'dates'
      ? scaleTime().domain([timeLowerExtent, timeUpperExtent])
      : scaleLinear().domain([0, xDaysUpperExtent])
    ).range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic'
      ? scaleLog().domain([logarithmicLowerExtent, yUpperExtent], true)
      : scaleLinear().domain([0, yUpperExtent], true)
    ).range([chartHeight, 0]);
    const safe_yScale = x =>
      yScale(yScaleType === 'logarithmic' && x <= logarithmicLowerExtent ? logarithmicLowerExtent : x);
    const getUncappedYDataCollection = d =>
      d.dataAs[xScaleType].filter(item =>
        xScaleType.indexOf('days') === 0 ? daysCapFilter(item) : timeRangeFilter(item)
      );
    const getDataCollection = d =>
      getUncappedYDataCollection(d).filter(
        item => item[yScaleProp] <= yUpperExtent && (yScaleType !== 'logarithmic' || logarithmicLowerExtentFilter(item))
      );
    const generateLinePath = d =>
      line()
        .x(d => xScale(d[xScaleProp]))
        .y(d => safe_yScale(d[yScaleProp]))
        .curve(hasLineSmoothing ? curveMonotoneX : curveLinear)(getDataCollection(d));
    const isPlaceYCapped = d =>
      typeof yScaleCap === 'number' && last(getUncappedYDataCollection(d))[yScaleProp] > yScaleCap;
    const generateLinePathLength = d => (isPlaceYCapped(d) ? 100 : 95.5);
    const plotPointTransformGenerator = d => `translate(${xScale(d[xScaleProp])}, ${safe_yScale(d[yScaleProp])})`;
    const lineEndTransformGenerator = d => {
      const dataCollection = getDataCollection(d);

      return dataCollection.length ? plotPointTransformGenerator(last(dataCollection)) : null;
    };
    const labelForceClamp = (min, max) => {
      let forceNodes;

      const force = () => {
        forceNodes.forEach(n => {
          if (n.y > max) {
            n.y = max;
          }

          if (n.y < min) {
            n.y = min;
          }
        });
      };

      force.initialize = _ => (forceNodes = _);

      return force;
    };
    const isTrendVisible = inclusionCheckGenerator(trends, 'doublingTimePeriods');
    const isTrendHighlighted = inclusionCheckGenerator(highlightedTrends, 'doublingTimePeriods');
    const visibleTrendsData = generateTrendsData(
      TRENDS.filter(isTrendVisible),
      earliestDate,
      xScaleType === 'dates' ? timeRangeDays : xDaysUpperExtent,
      yUpperExtent
    );
    const getAllocatedColor = generateColorAllocator(visiblePlacesData);
    const xAxisGenerator =
      xScaleType === 'dates'
        ? axisBottom(xScale)
            .ticks(timeRangeDays < 10 ? timeDay.every(1) : timeRangeDays < 60 ? timeWeek.every(1) : timeWeek.every(2))
            .tickFormat(timeFormat('%-d/%-m'))
        : axisBottom(xScale).ticks(5);
    const yAxisGeneratorBase = () =>
      yScaleType === 'linear'
        ? axisLeft(yScale).ticks(5)
        : axisLeft(yScale).tickValues(
            TICK_VALUES['logarithmic'].filter(value => value >= logarithmicLowerExtent && value <= yUpperExtent)
          );
    // const yAxisGenerator = yAxisGeneratorBase().tickFormat(format('~s'));
    const yAxisGenerator = yAxisGeneratorBase().tickFormat(value => (value >= 1 ? FORMAT_S(value) : value));
    const yAxisGridlinesGenerator = yAxisGeneratorBase()
      .tickSize(-chartWidth)
      .tickFormat('');

    // Rendering > 1: Update SVG dimensions
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', svgHeight);

    // Rendering > 2: Update accessible SVG title & description
    svgTitleRef.current.textContent = `${yAxisLabel} on a ${yScaleType} scale.`;
    svgDescRef.current.textContent = visiblePlacesData.length
      ? `A time-based line chart, plotting ${visiblePlacesData
          .map(x => x.key.replace(/,/g, ''))
          .join(', ')
          .replace(/,(?!.*,)/gim, ' and')} by ${xAxisLabel}.`
      : '';

    // Rendering > 3: Add/update x-axis
    svg
      .select(`.${styles.xAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top + chartHeight})`)
      .call(xAxisGenerator);

    // Rendering > 4: Update x-axis label
    svg
      .select(`.${styles.xAxisLabel}`)
      .attr('transform', `translate(${MARGIN.left + chartWidth / 2} ${svgHeight - REM / 2})`)
      .text(xAxisLabel);

    // Rendering > 5: Add/update y-axis
    svg
      .select(`.${styles.yAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGenerator);

    // Rendering > 6. Update y-axis label
    svg
      .select(`.${styles.yAxisLabel}`)
      .attr('transform', `translate(${0} ${MARGIN.top / 2})`)
      .call(selection => {
        if (IS_TRIDENT) {
          selection.text(yAxisLabel);
        } else {
          const words = yAxisLabel.split(' ');
          const halfWordsIndex = Math.floor(words.length / 2);

          selection.html(
            `<tspan x="0" dy="-0.75em">${words
              .slice(0, halfWordsIndex)
              .join(' ')}</tspan><tspan x="0" dy="1.25em">${words
              .slice(halfWordsIndex, words.length)
              .join(' ')}</tspan>`
          );
        }
      });

    // Rendering > 7. Add/Update y-axis gridlines
    svg
      .select(`.${styles.yAxisGridlines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGridlinesGenerator);

    // Rendering > 8. Add/remove/update trend lines
    const trendLines = svg // Bind
      .select(`.${styles.trendLines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.trendLine}`)
      .data(visibleTrendsData, KEYING_FN);
    const trendLinesEnter = trendLines // Enter
      .enter()
      .append('path')
      .attr('data-doubling-days', d => d.doublingTimePeriods)
      .classed(styles.trendLine, true)
      .classed(styles.highlighted, isTrendHighlighted)
      .attr('d', generateLinePath)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    trendLines // Update
      .classed(styles.highlighted, isTrendHighlighted)
      .style('stroke-opacity', null)
      .transition()
      .duration(transformTransitionDuration)
      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

        return interpolatePath(previousPath, currentPath);
      });
    trendLines // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', 0)
      .remove();

    // Rendering > 9. Add/remove/update plot lines
    const plotLines = svg // Bind
      .select(`.${styles.plotLines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLine}`)
      .data(visiblePlacesData, KEYING_FN);
    const plotLinesEnter = plotLines // Enter
      .enter()
      .append('path')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotLine, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .attr('d', generateLinePath)
      .attr('stroke-dasharray', function(d) {
        if (isPlaceYCapped(d)) {
          setTimeout(setTruncatedLineDashArray, 0, this);
        }

        return null;
      })
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    plotLines // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .style('stroke-opacity', null)
      .attr('stroke-dasharray', null)
      .transition()
      .duration(transformTransitionDuration)
      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

        if (isPlaceYCapped(d)) {
          setTimeout(setTruncatedLineDashArray, currentPath === previousPath ? 0 : 1000, this); // post transition
        }

        return interpolatePath(previousPath, currentPath);
      });
    plotLines // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', 0)
      .remove();

    // Rendering > 10. Add/remove/update plot dots (at ends of lines)
    const plotDots = svg // Bind
      .select(`.${styles.plotDots}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotDot}`)
      .data(visiblePlacesData, KEYING_FN);
    const plotDotsEnter = plotDots // Enter
      .enter()
      .append('circle')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotDot, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .classed(styles.yCapped, isPlaceYCapped)
      .attr('r', 2)
      .attr('transform', lineEndTransformGenerator)
      .style('fill-opacity', 0)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null)
      .style('stroke-opacity', null);
    plotDots // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .classed(styles.yCapped, isPlaceYCapped)
      .style('fill-opacity', null)
      .style('stroke-opacity', null)
      .transition()
      .duration(transformTransitionDuration)
      .attr('transform', lineEndTransformGenerator);
    plotDots // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .style('stroke-opacity', 0)
      .remove();

    // Rendering > 11. Add/remove/update trend labels (near ends of lines)
    const trendLabelForceNodes = visiblePlacesData.length
      ? visibleTrendsData.map((d, i) => {
          const dataCollection = getDataCollection(d);
          return {
            fx: 0,
            // targetY: safe_yScale(last(getDataCollection(d))[yScaleProp])
            targetY: safe_yScale(dataCollection[dataCollection.length - (i > 0 ? 4 : 2)][yScaleProp])
          };
        })
      : [];
    const trendLabelsForceSimulation = forceSimulation()
      .nodes(trendLabelForceNodes)
      .force('collide', forceCollide(PLOT_LABEL_HEIGHT * 2))
      .force('y', forceY(d => d.targetY).strength(1))
      .force('clamp', labelForceClamp(0, chartHeight))
      .stop();
    for (let i = 0; i < 300; i++) {
      trendLabelsForceSimulation.tick();
    }
    const trendLabelsData = visiblePlacesData.length
      ? visibleTrendsData.map((d, i) => ({
          key: d.key,
          text: `${i === 0 ? `Number of cases ` : '...'}doubles every ${d.key}`,
          html: `<tspan>${
            i === 0
              ? `Number of</tspan><tspan x="0" dx="-0.33em" dy="1em">cases doubles</tspan><tspan x="0" dx="-0.67em" dy="1em">`
              : '...doubles</tspan><tspan x="0" dx="-0.33em" dy="1em">'
          }every ${d.key}</tspan>`,
          doublingTimePeriods: d.doublingTimePeriods,
          x: 6 + xScale(last(getDataCollection(d))[xScaleProp]),
          y: trendLabelForceNodes[i].y
        }))
      : [];
    const trendLabels = svg // Bind
      .select(`.${styles.trendLabels}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.trendLabel}`)
      .data(trendLabelsData, KEYING_FN);
    const trendLabelsEnter = trendLabels // Enter
      .enter()
      .append('text')
      .attr('data-doubling-days', d => d.doublingTimePeriods)
      .classed(styles.trendLabel, true)
      .classed(styles.highlighted, isTrendHighlighted)
      .attr('text-anchor', (d, i) => (i === 0 || IS_TRIDENT ? 'end' : 'start'))
      .attr('alignment-baseline', 'middle')
      .call(selection => {
        if (IS_TRIDENT) {
          selection.text(d => d.text);
        } else {
          selection.html(d => d.html);
        }
      })
      .attr(
        'transform',
        (d, i) => `translate(${d.x - (i < 2 || IS_TRIDENT ? (chartWidth > 640 ? 40 : 20) : 0)}, ${d.y})`
      )
      .style('fill-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null);
    trendLabels // Update
      .classed(styles.highlighted, isTrendHighlighted)
      .style('fill-opacity', null)
      .call(selection => {
        if (IS_TRIDENT) {
          selection.text(d => d.text);
        } else {
          selection.html(d => d.html);
        }
      })
      .transition()
      .duration(transformTransitionDuration)
      .attr(
        'transform',
        (d, i) => `translate(${d.x - (i < 2 || IS_TRIDENT ? (chartWidth > 640 ? 40 : 20) : 0)}, ${d.y})`
      );
    trendLabels // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .remove();

    // Rendering > 12. Add/remove/update plot labels (near ends of lines)
    const labelledPlacesData = visiblePlacesData.filter(
      d =>
        isPlaceHighlighted(d) || KEY_PLACES.concat(preset === 'europe' ? KEY_EUROPEAN_PLACES : []).indexOf(d.key) > -1
    );
    const plotLabelForceNodes = labelledPlacesData.map(d => {
      const dataCollection = getDataCollection(d);

      return {
        fx: 0,
        targetY: safe_yScale(dataCollection.length ? last(dataCollection)[yScaleProp] : 0)
      };
    });
    if (chartWidth < 640 || xScaleType === 'dates' || xScaleDaysCap || yScaleType === 'logarithmic') {
      const plotLabelsForceSimulation = forceSimulation()
        .nodes(plotLabelForceNodes)
        .force('collide', forceCollide(PLOT_LABEL_HEIGHT / 2))
        .force('y', forceY(d => d.targetY).strength(1))
        .force('clamp', labelForceClamp(0, chartHeight))
        .stop();
      for (let i = 0; i < 300; i++) {
        plotLabelsForceSimulation.tick();
      }
    }
    const plotLabelsData = labelledPlacesData.map((d, i) => {
      const dataCollection = getDataCollection(d);

      return {
        key: d.key,
        text: d.key,
        x: 6 + xScale(dataCollection.length ? last(dataCollection)[xScaleProp] : 0),
        y: plotLabelForceNodes[i].y || plotLabelForceNodes[i].targetY
      };
    });
    const plotLabels = svg // Bind
      .select(`.${styles.plotLabels}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLabel}`)
      .data(plotLabelsData, KEYING_FN);
    const plotLabelsEnter = plotLabels // Enter
      .enter()
      .append('text')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotLabel, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .attr('alignment-baseline', 'middle')
      .text(d => d.text)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('fill-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null);
    plotLabels // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .style('fill-opacity', null)
      .text(d => d.text)
      .transition()
      .duration(transformTransitionDuration)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
    plotLabels // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .remove();
  }, [renderId]); // Run every time state/props change

  return (
    <div ref={rootRef} className={styles.root}>
      <h3 ref={titleRef} className={styles.title}>
        {title || ''}
      </h3>
      <svg ref={svgRef} className={styles.svg} id={svgID} role="img" aria-labelledby={`${titleID} ${descID}`}>
        <title ref={svgTitleRef} id={titleID} />
        <desc ref={svgDescRef} id={descID} />
        <g className={styles.yAxisGridlines} />
        <g className={styles.trendLines} />
        <g className={styles.plotLines} />
        <g className={styles.plotDots} />
        <g className={styles.xAxis} />
        <text className={styles.xAxisLabel} />
        <g className={styles.yAxis} />
        <text className={styles.yAxisLabel} />
        <g className={styles.trendLabels} />
        <g className={styles.plotLabels} />
      </svg>
      <p ref={footnotesRef} className={styles.footnotes} dangerouslySetInnerHTML={{ __html: footnotesMarkup }}></p>
    </div>
  );
};

CasesGraphic.displayName = 'CasesGraphic';

export default CasesGraphic;
