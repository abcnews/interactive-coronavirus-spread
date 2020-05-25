import {
  axisBottom,
  axisLeft,
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
  timeWeek,
  timeFormat
} from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import React, { Component, createRef } from 'react';
import { KEY_PLACES, KEY_EUROPEAN_PLACES, KEY_TRENDS, TRENDS } from '../../constants';
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
const COLORS = [
  'teal',
  'orange',
  'cyan',
  'purple',
  'red',
  'blue',
  'brown',
  'green',
  'copy' /* copy = black/white, depending on preferred color scheme */
];
const COLOR_DIBS = {
  China: 'teal',
  Italy: 'orange',
  Singapore: 'cyan',
  'S. Korea': 'purple',
  UK: 'red',
  US: 'blue',
  Taiwan: 'brown',
  Japan: 'green',
  Australia: 'copy'
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
  title: null,
  hasFootnotes: false,
  xScaleType: X_SCALE_TYPES[0],
  yScaleType: Y_SCALE_TYPES[0],
  yScaleProp: Y_SCALE_PROPS[0],
  xScaleDaysCap: false,
  yScaleCap: DEFAULT_CASES_CAP,
  places: KEY_PLACES,
  highlightedPlaces: KEY_PLACES,
  trends: KEY_TRENDS,
  highlightedTrends: false
};
const KEYING_FN = d => d.key;
const FOOTNOTES_MARKUP = `<small><a href="https://abc.net.au/news/12107500">Data sources: Johns Hopkins Coronavirus Resource Center, Our World in Data, ABC</a></small>`;

const calculateDoublingTimePeriods = increasePerPeriod => Math.log(2) / Math.log(increasePerPeriod + 1);
const calculateIncreasePerPeriod = doublingTimePeriods => Math.exp(Math.log(2) / doublingTimePeriods) - 1;
const calculatePeriodsToIncrease = (increasePerPeriod, startingValue, endingValue) =>
  Math.log(endingValue / startingValue) / Math.log(increasePerPeriod + 1);
const last = x => x[x.length - 1];
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

function generateTrendsData(trends, startDate, numDays, yScaleCap) {
  const dates = [];
  let currentDate = new Date(startDate);

  for (let i = 0, len = numDays - 1; i < numDays; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends.reduce((memo, trend) => {
    const increasePerPeriod = calculateIncreasePerPeriod(trend.doublingTimePeriods);
    const casesData = createTrendCasesData(increasePerPeriod, numDays, 100).filter(count => count <= yScaleCap);
    const item = {
      key: trend.name,
      doublingTimePeriods: trend.doublingTimePeriods,
      dataAs: {
        dates: casesData.map((cases, i) => ({ date: dates[i], cases })),
        daysSince100Cases: casesData.map((cases, i) => ({ day: i, cases }))
      }
    };

    const daysToYScaleCap = calculatePeriodsToIncrease(increasePerPeriod, 100, yScaleCap);
    const daysDiff = Math.min(1, daysToYScaleCap - casesData.length + 1);

    if (daysDiff > 0) {
      const lastItem = last(item.dataAs.dates);

      if (daysDiff < 1) {
        // Meet extent of y-scale
        let fractionalDate = new Date(lastItem.date.valueOf() + ONE_DAY * daysDiff);

        item.dataAs.dates.push({ date: fractionalDate, cases: yScaleCap });
        item.dataAs.daysSince100Cases.push({ day: daysToYScaleCap, cases: yScaleCap });
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

function generateColorAllocator(placesData) {
  const colorAllocation = {};
  let colorsUnallocated = [].concat(COLORS);

  // Pre-allocate places with dibs, then allocate remaining.
  placesData
    .filter(({ key }) => {
      const preferredColor = COLOR_DIBS[key];

      if (preferredColor && colorsUnallocated.indexOf(preferredColor) > -1) {
        colorAllocation[key] = preferredColor;
        colorsUnallocated = colorsUnallocated.filter(color => color !== preferredColor);

        return false;
      }

      return true;
    })
    .forEach(({ key }) => {
      if (!colorsUnallocated.length) {
        return;
      }

      colorAllocation[key] = colorsUnallocated.shift();
    });

  return key => {
    return colorAllocation[key] || 'none';
  };
}

function setTruncatedLineDashArray(node) {
  const pathLength = node.getTotalLength();

  node.setAttribute('stroke-dasharray', `${pathLength - 32} 2 6 2 6 2 6 2 6`);
}

let nextIDIndex = 0;

export default class CasesGraphic extends Component {
  constructor(props) {
    super(props);

    const { placesData, maxDate, xScaleType, yScaleType } = { ...DEFAULT_PROPS, ...props };

    checkScaleTypes(xScaleType, yScaleType);

    this.idIndex = nextIDIndex++;

    this.rootRef = createRef();
    this.titleRef = createRef();
    this.svgRef = createRef();
    this.svgTitleRef = createRef();
    this.svgDescRef = createRef();
    this.footnotesRef = createRef();

    this.measureAndSetDimensions = this.measureAndSetDimensions.bind(this);
    this.nonOdysseyMeasureAndSetDimensions = this.nonOdysseyMeasureAndSetDimensions.bind(this);

    this.placesData = Object.keys(placesData)
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
          .filter(({ cases, date }) => cases >= 1 && (!maxDate || date <= maxDate)); // should this be filtered on maxDate at render time?

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

    this.earliestDate = this.placesData.reduce((memo, d) => {
      const candidate = d.dataAs.dates[0].date;

      if (candidate < memo) {
        return candidate;
      }

      return memo;
    }, this.placesData[0].dataAs.dates[0].date);
    this.latestDate = this.placesData.reduce((memo, d) => {
      const candidate = last(d.dataAs.dates).date;

      if (candidate > memo) {
        return candidate;
      }

      return memo;
    }, last(this.placesData[0].dataAs.dates).date);
    this.numDates = Math.round((this.latestDate - this.earliestDate) / ONE_DAY);

    this.state = {
      width: 0,
      height: 0
    };
  }

  measureAndSetDimensions(client) {
    if (client && !client.hasChanged) {
      return;
    }

    const { width, height } = this.rootRef.current.getBoundingClientRect();
    const titleRect = this.titleRef.current.getBoundingClientRect();
    const footnotesRect = this.footnotesRef.current.getBoundingClientRect();

    this.setState({ width, height: height - (titleRect.height + footnotesRect.height) });
  }

  nonOdysseyMeasureAndSetDimensions() {
    this.measureAndSetDimensions({ hasChanged: true });
  }

  componentDidMount() {
    this.measureAndSetDimensions();

    if (window.__ODYSSEY__) {
      window.__ODYSSEY__.scheduler.subscribe(this.measureAndSetDimensions);
    } else {
      window.addEventListener('resize', this.nonOdysseyMeasureAndSetDimensions);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const prevProps = this.props;
    const prevState = this.state;

    let {
      title,
      hasFootnotes,
      places,
      yScaleCap,
      xScaleDaysCap,
      highlightedPlaces,
      highlightedTrends,
      preset,
      trends,
      xScaleType,
      yScaleType,
      yScaleProp
    } = {
      ...DEFAULT_PROPS,
      ...nextProps
    };
    const { width, height } = nextState;

    const wasResize = width !== prevState.width || height !== prevState.height;

    if (preset === prevProps.preset && !wasResize) {
      return false;
    }

    if (title !== prevProps.title || hasFootnotes !== prevProps.hasFootnotes) {
      setTimeout(() => this.measureAndSetDimensions());
    }

    this.rootRef.current.setAttribute('data-preset', preset);

    checkScaleTypes(xScaleType, yScaleType);
    checkScaleProps(yScaleProp);

    if (typeof places === 'function') {
      // Apply a filter
      places = this.placesData.filter(places).map(x => x.key);
    }

    // Filter placesData to just visible places, and create visible/highlighted comparison utils
    const isPlaceVisible = inclusionCheckGenerator(places, 'key');
    const isPlaceHighlighted = inclusionCheckGenerator(highlightedPlaces, 'key');
    const visiblePlacesData = this.placesData.filter(isPlaceVisible);

    // Only allow trend lines when we are showing cases since 100th case
    if (yScaleProp !== 'cases' || xScaleType !== 'daysSince100Cases') {
      trends = false;
      highlightedTrends = false;
    }

    const xScaleProp = xScaleType === 'dates' ? 'date' : 'day';

    const isDailyFigures = yScaleProp.indexOf('new') === 0;
    const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

    const underlyingProp = yScaleProp.match(UNDERLYING_PROPS_PATTERN)[0];
    const logarithmicLowerExtent =
      LOWER_LOGARITHMIC_EXTENTS[yScaleProp] || (isDailyFigures && isPerCapitaFigures ? 0.01 : 0.1);

    if (isDailyFigures || isPerCapitaFigures) {
      yScaleCap = false;
    }

    const largestVisibleYScaleValue = visiblePlacesData.reduce((memo, d) => {
      return Math.max.apply(null, [memo].concat(d.dataAs.dates.map(t => t[yScaleProp])));
    }, 0);

    // Y-scale cap should be the lower of the passed in prop and the largest value of the current Y-scale prop
    yScaleCap = yScaleCap === false ? largestVisibleYScaleValue : Math.min(yScaleCap, largestVisibleYScaleValue);

    const cappedNumDays =
      xScaleType.indexOf('dates') === 0
        ? null
        : visiblePlacesData.reduce((memo, d) => {
            const itemsWithinCaps = d.dataAs[xScaleType].filter(
              item => (xScaleDaysCap === false || item.day <= xScaleDaysCap) && item[yScaleProp] <= yScaleCap
            );

            if (!itemsWithinCaps.length) {
              return memo;
            }

            return Math.max(memo, last(itemsWithinCaps).day);
          }, 0);

    // TODO:
    // The yScaleCap may have potentially lowered due to cappedNumDays
    // filtering out some of our data. Before scales & axes are generated,
    // we could safely adjust yScaleCap now to the smaller of:
    // * Itself, and
    // * The largest dataAs[xScaleType]#yScaleProp value

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
    const chartHeight = height - MARGIN.top - MARGIN.bottom;
    const xScale = (xScaleType === 'dates'
      ? scaleTime().domain([new Date(this.earliestDate), new Date(this.latestDate)])
      : scaleLinear().domain([0, cappedNumDays])
    ).range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic'
      ? scaleLog().domain([logarithmicLowerExtent, yScaleCap], true)
      : scaleLinear().domain([0, yScaleCap], true)
    ).range([chartHeight, 0]);
    const safe_yScale = x =>
      yScale(yScaleType === 'logarithmic' && x <= logarithmicLowerExtent ? logarithmicLowerExtent : x);
    const getUncappedDataCollection = d =>
      d.dataAs[xScaleType].filter(item => item[underlyingProp] >= LOWER_LOGARITHMIC_EXTENTS[underlyingProp]);
    const getDataCollection = d =>
      getUncappedDataCollection(d).reduce(
        (memo, item) =>
          memo.concat(
            item[yScaleProp] <= yScaleCap &&
              (xScaleType.indexOf('days') === -1 || xScaleDaysCap === false || item.day <= xScaleDaysCap)
              ? [item]
              : []
          ),
        []
      );
    const generateLinePath = d =>
      line()
        .x(d => xScale(d[xScaleProp]))
        .y(d => safe_yScale(d[yScaleProp]))(getDataCollection(d));
    const isPlaceYCapped = d => last(getUncappedDataCollection(d))[yScaleProp] > yScaleCap;
    const generateLinePathLength = d => (isPlaceYCapped(d) ? 100 : 95.5);
    const plotPointTransformGenerator = d => `translate(${xScale(d[xScaleProp])}, ${safe_yScale(d[yScaleProp])})`;
    const lineEndTransformGenerator = d => plotPointTransformGenerator(last(getDataCollection(d)));
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
      this.earliestDate,
      xScaleType === 'dates' ? this.numDates : cappedNumDays,
      yScaleCap
    );
    const getAllocatedColor = generateColorAllocator(visiblePlacesData);
    const xAxisGenerator =
      xScaleType === 'dates'
        ? axisBottom(xScale)
            .ticks(timeWeek.every(2))
            .tickFormat(timeFormat('%-d/%-m'))
        : axisBottom(xScale).ticks(5);
    const yAxisGeneratorBase = () =>
      yScaleType === 'linear'
        ? axisLeft(yScale).ticks(5)
        : axisLeft(yScale).tickValues(
            TICK_VALUES['logarithmic'].filter(value => value >= logarithmicLowerExtent && value <= yScaleCap)
          );
    // const yAxisGenerator = yAxisGeneratorBase().tickFormat(format('~s'));
    const yAxisGenerator = yAxisGeneratorBase().tickFormat(value => (value >= 1 ? FORMAT_S(value) : value));
    const yAxisGridlinesGenerator = yAxisGeneratorBase()
      .tickSize(-chartWidth)
      .tickFormat('');

    // Rendering > 1: Update SVG dimensions
    const svg = select(this.svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Rendering > 2: Update accessible titles, description & footnotes
    this.titleRef.current.textContent = title || '';
    this.svgTitleRef.current.textContent = `${yAxisLabel} on a ${yScaleType} scale.`;
    this.svgDescRef.current.textContent = visiblePlacesData.length
      ? `A time-based line chart, plotting ${visiblePlacesData
          .map(x => x.key.replace(/,/g, ''))
          .join(', ')
          .replace(/,(?!.*,)/gim, ' and')} by ${xAxisLabel}.`
      : '';
    this.footnotesRef.current.innerHTML = hasFootnotes ? FOOTNOTES_MARKUP : '';

    // Rendering > 3: Add/update x-axis
    svg
      .select(`.${styles.xAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top + chartHeight})`)
      .call(xAxisGenerator);

    // Rendering > 4: Update x-axis label
    svg
      .select(`.${styles.xAxisLabel}`)
      .attr('transform', `translate(${MARGIN.left + chartWidth / 2} ${height - REM / 2})`)
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
    const plotLabelForceNodes = labelledPlacesData.map(d => ({
      fx: 0,
      targetY: safe_yScale(last(getDataCollection(d))[yScaleProp])
    }));
    if (chartWidth < 640 || xScaleType === 'dates' || yScaleType === 'logarithmic') {
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
    const plotLabelsData = labelledPlacesData.map((d, i) => ({
      key: d.key,
      text: d.key,
      x: 6 + xScale(last(getDataCollection(d))[xScaleProp]),
      y: plotLabelForceNodes[i].y || plotLabelForceNodes[i].targetY
    }));
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

    // Finally, stop React from updating the component (we've managed everything above)
    return false;
  }

  componentWillUnmount() {
    if (window.__ODYSSEY__) {
      window.__ODYSSEY__.scheduler.unsubscribe(this.measureAndSetDimensions);
    } else {
      window.removeEventListener('resize', this.nonOdysseyMeasureAndSetDimensions);
    }
  }

  render() {
    const { title, hasFootnotes } = this.props;
    const svgID = `CasesGraphic${this.idIndex}SVG`;
    const titleID = `CasesGraphic${this.idIndex}Title`;
    const descID = `CasesGraphic${this.idIndex}Desc`;

    return (
      <div ref={this.rootRef} className={styles.root}>
        <h3 ref={this.titleRef} className={styles.title}>
          {title || ''}
        </h3>
        <svg ref={this.svgRef} className={styles.svg} id={svgID} role="img" aria-labelledby={`${titleID} ${descID}`}>
          <title ref={this.svgTitleRef} id={titleID} />
          <desc ref={this.svgDescRef} id={descID} />
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
        <p ref={this.footnotesRef} className={styles.footnotes}>
          {hasFootnotes ? FOOTNOTES_MARKUP : ''}
        </p>
      </div>
    );
  }
}
