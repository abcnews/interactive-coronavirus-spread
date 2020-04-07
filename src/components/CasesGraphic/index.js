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
import { KEY_COUNTRIES, KEY_EUROPEAN_COUNTRIES, KEY_TRENDS, TRENDS } from '../../constants';
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
  logarithmic: [1, 10, 1e2, 1e3, 1e4, 1e5]
};
const TRANSITION_DURATIONS = {
  opacity: 250,
  transform: 1000
};
export const X_SCALE_TYPES = ['dates', 'days'];
export const Y_SCALE_TYPES = ['linear', 'logarithmic'];
const Y_SCALE_TOTAL_PROPS = ['cases', 'deaths', 'recoveries'];
const Y_SCALE_NEW_PROPS = ['newcases', 'newdeaths', 'newrecoveries'];
export const Y_SCALE_PROPS = Y_SCALE_TOTAL_PROPS.concat(Y_SCALE_NEW_PROPS);
export const DEFAULT_CASES_CAP = 5e4; // 50k
export const DEFAULT_PROPS = {
  xScaleType: X_SCALE_TYPES[1],
  yScaleType: Y_SCALE_TYPES[1],
  yScaleProp: Y_SCALE_PROPS[0],
  daysCap: false,
  casesCap: DEFAULT_CASES_CAP,
  countries: KEY_COUNTRIES,
  highlightedCountries: KEY_COUNTRIES,
  trends: KEY_TRENDS,
  highlightedTrends: false
};
const KEYING_FN = d => d.key;

const calculateDoublingTimePeriods = increasePerPeriod => Math.log(2) / Math.log(increasePerPeriod + 1);
const calculateIncreasePerPeriod = doublingTimePeriods => Math.exp(Math.log(2) / doublingTimePeriods) - 1;
const calculatePeriodsToIncrease = (increasePerPeriod, startingValue, endingValue) =>
  Math.log(endingValue / startingValue) / Math.log(increasePerPeriod + 1);
const last = x => x[x.length - 1];

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
      dailyTotals: casesData.map((cases, i) => ({ date: dates[i], cases })),
      daysSince100CasesTotals: casesData.map((cases, i) => ({ day: i, cases }))
    };

    const daysToYScaleCap = calculatePeriodsToIncrease(increasePerPeriod, 100, yScaleCap);
    const daysDiff = Math.min(1, daysToYScaleCap - casesData.length + 1);

    if (daysDiff > 0) {
      const lastItem = last(item.dailyTotals);

      if (daysDiff < 1) {
        // Meet extent of y-scale
        let fractionalDate = new Date(lastItem.date.valueOf() + ONE_DAY * daysDiff);

        item.dailyTotals.push({ date: fractionalDate, cases: yScaleCap });
        item.daysSince100CasesTotals.push({ day: daysToYScaleCap, cases: yScaleCap });
      } else {
        // Meet extent of x-scale
        let fractionalCases = lastItem.cases + lastItem.cases * increasePerPeriod;

        item.dailyTotals.push({ date: new Date(lastItem.date.valueOf() + ONE_DAY), cases: fractionalCases });
        item.daysSince100CasesTotals.push({ day: casesData.length, cases: fractionalCases });
      }
    }

    return memo.concat([item]);
  }, []);
}

function setTruncatedLineDashArray(node) {
  const pathLength = node.getTotalLength();

  node.setAttribute('stroke-dasharray', `${pathLength - 32} 2 6 2 6 2 6 2 6`);
}

export default class CasesGraphic extends Component {
  constructor(props) {
    super(props);

    const { countryTotals, maxDate, xScaleType, yScaleType } = { ...DEFAULT_PROPS, ...props };

    checkScaleTypes(xScaleType, yScaleType);

    this.rootRef = createRef();
    this.svgRef = createRef();

    this.measureAndSetDimensions = this.measureAndSetDimensions.bind(this);
    this.nonOdysseyMeasureAndSetDimensions = this.nonOdysseyMeasureAndSetDimensions.bind(this);

    this.countriesData = Object.keys(countryTotals)
      .map(country => {
        const countryDates = Object.keys(countryTotals[country]);
        let dailyTotals = countryDates
          .map((countryDate, countryDatesIndex) => {
            const countryDateTotals = countryTotals[country][countryDate];
            const countryDateTotalsProps = Object.keys(countryDateTotals);

            return {
              date: new Date(countryDate),
              ...countryDateTotals,
              ...countryDateTotalsProps.reduce((memo, prop) => {
                const newProp = `new${prop}`;

                if (countryDatesIndex === 0) {
                  memo[newProp] = countryDateTotals[prop];
                } else {
                  memo[newProp] = Math.max(
                    0,
                    countryDateTotals[prop] - countryTotals[country][countryDates[countryDatesIndex - 1]][prop]
                  );
                }

                return memo;
              }, {})
            };
          })
          .filter(({ cases, date }) => cases >= 1 && (!maxDate || date <= maxDate));
        dailyTotals = dailyTotals.map((x, i) => ({ ...x, isMostRecent: i === dailyTotals.length - 1 }));

        const daysSince100CasesTotals = dailyTotals
          .filter(({ cases }) => cases >= 100)
          .map(({ date, ...otherProps }, index) => ({ day: index, ...otherProps }));

        return {
          key: country,
          cases: dailyTotals.length ? last(dailyTotals).cases : 0,
          deaths: dailyTotals.length ? last(dailyTotals).deaths : 0,
          recoveries: dailyTotals.length ? last(dailyTotals).recoveries : 0,
          dailyTotals,
          daysSince100CasesTotals
        };
      })
      .filter(d => d.daysSince100CasesTotals.length > 0)
      .sort((a, b) => b.cases - a.cases);

    this.earliestDate = this.countriesData.reduce((memo, d) => {
      const candidate = d.dailyTotals[0].date;

      if (candidate < memo) {
        return candidate;
      }

      return memo;
    }, this.countriesData[0].dailyTotals[0].date);
    this.latestDate = this.countriesData.reduce((memo, d) => {
      const candidate = last(d.dailyTotals).date;

      if (candidate > memo) {
        return candidate;
      }

      return memo;
    }, last(this.countriesData[0].dailyTotals).date);
    this.numDates = Math.round((this.latestDate - this.earliestDate) / ONE_DAY);

    this.most = Y_SCALE_PROPS.reduce((memo, propName) => {
      memo[propName] = this.countriesData.reduce((memo, d) => {
        return Math.max.apply(null, [memo].concat(d.dailyTotals.map(t => t[propName])));
      }, 0);

      return memo;
    }, {});

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

    this.setState({ width, height });
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
      countries,
      casesCap,
      daysCap,
      highlightedCountries,
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

    this.rootRef.current.setAttribute('data-preset', preset);

    checkScaleTypes(xScaleType, yScaleType);
    checkScaleProps(yScaleProp);

    const isDailyFigures = yScaleProp.indexOf('new') === 0;

    if (isDailyFigures) {
      casesCap = false;
    }

    // Only allow trend lines when we are showing cases since 100th case
    if (yScaleProp !== 'cases' || xScaleType !== 'days') {
      trends = false;
      highlightedTrends = false;
    }

    const yScaleCap = casesCap === false ? this.most[yScaleProp] : Math.min(casesCap, this.most[yScaleProp]);
    const cappedDaysSince100Cases = this.countriesData.reduce((memo, d) => {
      return Math.max(
        memo,
        d.daysSince100CasesTotals.filter(
          item => item[yScaleProp] <= yScaleCap && (daysCap === false || item.day <= daysCap)
        ).length - 1
      );
    }, 0);
    const opacityTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.opacity;
    const transformTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.transform;
    const chartWidth = width - MARGIN.right - MARGIN.left;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;
    const xScaleProp = xScaleType === 'dates' ? 'date' : 'day';
    const xScale = (xScaleType === 'dates'
      ? scaleTime().domain([new Date(this.earliestDate), new Date(this.latestDate)])
      : scaleLinear().domain([0, cappedDaysSince100Cases])
    ).range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic'
      ? scaleLog()
          .nice()
          .domain([yScaleProp === 'cases' ? 100 : 0.1, yScaleCap], true)
      : scaleLinear().domain([0, yScaleCap], true)
    ).range([chartHeight, 0]);
    const safe_yScale = x => yScale(yScaleType === 'logarithmic' && x < 1 ? 0.1 : x);
    const getDataCollection = d =>
      d[xScaleType === 'dates' ? 'dailyTotals' : 'daysSince100CasesTotals'].reduce(
        (memo, item) =>
          memo.concat(
            item[yScaleProp] <= yScaleCap && (xScaleType === 'dates' || daysCap === false || item.day <= daysCap)
              ? [item]
              : []
          ),
        []
      );
    const generateLinePath = d =>
      line()
        .x(d => xScale(d[xScaleProp]))
        .y(d => safe_yScale(d[yScaleProp]))(getDataCollection(d));
    const isCountryTruncated = d => !last(getDataCollection(d)).isMostRecent;
    const generateLinePathLength = d => (isCountryTruncated(d) ? 100 : 95.5);
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
    const inclusionCheckGenerator = (collection, itemPropName) => d =>
      typeof collection === 'boolean'
        ? collection
        : Array.isArray(collection) && collection.indexOf(d[itemPropName]) > -1;
    const isCountryVisible = inclusionCheckGenerator(countries, 'key');
    const isCountryHighlighted = inclusionCheckGenerator(highlightedCountries, 'key');
    const isTrendVisible = inclusionCheckGenerator(trends, 'doublingTimePeriods');
    const isTrendHighlighted = inclusionCheckGenerator(highlightedTrends, 'doublingTimePeriods');
    const visibleCountriesData = this.countriesData.filter(isCountryVisible);
    const visibleTrendsData = generateTrendsData(
      TRENDS.filter(isTrendVisible),
      this.earliestDate,
      xScaleType === 'dates' ? this.numDates : cappedDaysSince100Cases,
      yScaleCap
    );
    const xAxisGenerator =
      xScaleType === 'dates'
        ? axisBottom(xScale)
            .ticks(timeWeek.every(2))
            .tickFormat(timeFormat('%-d/%-m'))
        : axisBottom(xScale).ticks(5);
    const yAxisGenerator = (yScaleType === 'linear'
      ? axisLeft(yScale.nice()).ticks(5)
      : axisLeft(yScale).tickValues(
          TICK_VALUES['logarithmic']
            .filter(value => value < yScaleCap)
            .concat(casesCap ? [casesCap] : [])
            .sort()
        )
    ).tickFormat(format('~s'));
    const yAxisGridlinesGenerator = (yScaleType === 'linear'
      ? axisLeft(yScale.nice()).ticks(5)
      : axisLeft(yScale).tickValues(
          TICK_VALUES['logarithmic']
            .filter(value => value < yScaleCap)
            .concat(casesCap ? [casesCap] : [])
            .sort()
        )
    )
      .tickSize(-chartWidth)
      .tickFormat('');

    // Rendering > 1: Update SVG dimensions
    const svg = select(this.svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Rendering > 2: Add/update x-axis
    svg
      .select(`.${styles.xAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top + chartHeight})`)
      .call(xAxisGenerator);

    // Rendering > 3: Update x-axis label
    svg
      .select(`.${styles.xAxisLabel}`)
      .attr('transform', `translate(${MARGIN.left + chartWidth / 2} ${height - REM / 2})`)
      .text(xScaleType === 'dates' ? 'Date' : `${chartWidth > 640 ? 'Number of d' : 'D'}ays since the 100th case`);

    // Rendering > 4: Add/update y-axis
    svg
      .select(`.${styles.yAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGenerator);

    // Rendering > 5. Update y-axis label
    svg
      .select(`.${styles.yAxisLabel}`)
      .attr('transform', `translate(${0} ${MARGIN.top / 2})`)
      .call(selection => {
        if (IS_TRIDENT) {
          selection.text(
            yScaleType === 'linear'
              ? `Known ${yScaleProp.replace('new', 'daily new ')}`
              : `${isDailyFigures ? 'Daily' : 'Cumulative'} number of known ${yScaleProp.replace(
                  'new',
                  'new '
                )} since the 100th case`
          );
        } else {
          selection.html(
            yScaleType === 'linear'
              ? `Known ${yScaleProp.replace('new', 'daily new ')}`
              : `<tspan x="0" dy="-0.75em">${isDailyFigures ? 'Daily' : 'Cumulative'} number of known${
                  isDailyFigures ? ' new' : ''
                }</tspan><tspan x="0" dy="1.25em">${yScaleProp.replace('new', '')} since the 100th case</tspan>`
          );
        }
      });

    // Rendering > 6. Add/Update y-axis gridlines
    svg
      .select(`.${styles.yAxisGridlines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGridlinesGenerator);

    // Rendering > 7. Add/remove/update trend lines
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

    // Rendering > 8. Add/remove/update plot lines
    const plotLines = svg // Bind
      .select(`.${styles.plotLines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLine}`)
      .data(visibleCountriesData, KEYING_FN);
    const plotLinesEnter = plotLines // Enter
      .enter()
      .append('path')
      .attr('data-country', d => d.key)
      .classed(styles.plotLine, true)
      .classed(styles.highlighted, isCountryHighlighted)
      .attr('d', generateLinePath)
      .attr('stroke-dasharray', function(d) {
        if (isCountryTruncated(d)) {
          setTimeout(setTruncatedLineDashArray, 0, this);
        }

        return null;
      })
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    plotLines // Update
      .attr('data-country', d => d.key)
      .classed(styles.highlighted, isCountryHighlighted)
      .style('stroke-opacity', null)
      .attr('stroke-dasharray', null)
      .transition()
      .duration(transformTransitionDuration)
      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

        if (isCountryTruncated(d)) {
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

    // Rendering > 9. Add/remove/update plot dots (at ends of lines)
    const plotDots = svg // Bind
      .select(`.${styles.plotDots}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotDot}`)
      .data(visibleCountriesData, KEYING_FN);
    const plotDotsEnter = plotDots // Enter
      .enter()
      .append('circle')
      .attr('data-country', d => d.key)
      .classed(styles.plotDot, true)
      .classed(styles.highlighted, isCountryHighlighted)
      .classed(styles.truncated, isCountryTruncated)
      .attr('r', 2)
      .attr('transform', lineEndTransformGenerator)
      .style('fill-opacity', 0)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null)
      .style('stroke-opacity', null);
    plotDots // Update
      .attr('data-country', d => d.key)
      .classed(styles.highlighted, isCountryHighlighted)
      .classed(styles.truncated, isCountryTruncated)
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

    // Rendering > 10. Add/remove/update trend labels (near ends of lines)
    const trendLabelForceNodes = visibleTrendsData.map((d, i) => {
      const dataCollection = getDataCollection(d);
      return {
        fx: 0,
        // targetY: safe_yScale(last(getDataCollection(d))[yScaleProp])
        targetY: safe_yScale(dataCollection[dataCollection.length - (i > 0 ? 4 : 2)][yScaleProp])
      };
    });
    const trendLabelsForceSimulation = forceSimulation()
      .nodes(trendLabelForceNodes)
      .force('collide', forceCollide(PLOT_LABEL_HEIGHT * 2))
      .force('y', forceY(d => d.targetY).strength(1))
      .force('clamp', labelForceClamp(0, chartHeight))
      .stop();
    for (let i = 0; i < 300; i++) {
      trendLabelsForceSimulation.tick();
    }
    const trendLabelsData = visibleTrendsData.map((d, i) => ({
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
    }));
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

    // Rendering > 11. Add/remove/update plot labels (near ends of lines)
    const labelledCountriesData = visibleCountriesData.filter(
      d =>
        isCountryHighlighted(d) ||
        KEY_COUNTRIES.concat(preset === 'europe' ? KEY_EUROPEAN_COUNTRIES : []).indexOf(d.key) > -1
    );
    const plotLabelForceNodes = labelledCountriesData.map(d => ({
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
    const plotLabelsData = labelledCountriesData.map((d, i) => ({
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
      .attr('data-country', d => d.key)
      .classed(styles.plotLabel, true)
      .classed(styles.highlighted, isCountryHighlighted)
      .attr('alignment-baseline', 'middle')
      .text(d => d.text)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('fill-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null);
    plotLabels // Update
      .attr('data-country', d => d.key)
      .classed(styles.highlighted, isCountryHighlighted)
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
    return (
      <div ref={this.rootRef} className={styles.root}>
        <svg ref={this.svgRef} className={styles.svg}>
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
      </div>
    );
  }
}
