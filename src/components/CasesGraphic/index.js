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
  timeFormat
} from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import React, { Component, createRef } from 'react';
import { ALIASES, KEY_COUNTRIES, KEY_TRENDS, TRENDS } from '../../constants';
import styles from './styles.css';

const IS_TRIDENT = navigator.userAgent.indexOf('Trident') > -1;
const REM = 16;
const MARGIN = {
  top: 3 * REM,
  right: 5 * REM,
  bottom: 3 * REM,
  left: 2 * REM
};
const PLOT_LABEL_HEIGHT = (REM / 4) * 3;
const TICK_VALUES = {
  linear: [0, 1e4, 2e4, 3e4, 4e4, 5e4, 6e4, 7e4, 8e4, 9e4, 1e5],
  logarithmic: [1e2, 1e3, 1e4, 1e5]
};
const TRANSITION_DURATIONS = {
  opacity: 250,
  transform: 1000
};
const X_SCALE_TYPES = ['dates', 'days'];
const Y_SCALE_TYPES = ['linear', 'logarithmic'];
const DEFAULT_PROPS = {
  xScaleType: X_SCALE_TYPES[1],
  yScaleType: Y_SCALE_TYPES[1],
  countries: KEY_COUNTRIES,
  highlightedCountries: KEY_COUNTRIES,
  trends: KEY_TRENDS,
  highlightedTrends: false
};

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

function createTrendCasesData(increasePerPeriod, daysToSimulate, startingValue) {
  const data = [startingValue];

  for (let i = 0; i < daysToSimulate - 1; i++) {
    data.push(data[i] * (1 + increasePerPeriod));
  }

  return data;
}

function generateTrendsData(trends, startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends.reduce((memo, trend) => {
    const increasePerPeriod = calculateIncreasePerPeriod(trend.doublingTimePeriods);
    const casesData = createTrendCasesData(increasePerPeriod, dates.length, 100).filter(count => count <= 100000);
    const item = {
      key: trend.name,
      doublingTimePeriods: trend.doublingTimePeriods,
      dailyTotals: casesData.map((cases, i) => ({ date: dates[i], cases })),
      daysSince100CasesTotals: casesData.map((cases, i) => ({ day: i, cases }))
    };

    const daysToHundredKCases = calculatePeriodsToIncrease(increasePerPeriod, 100, 100000);

    if (daysToHundredKCases < dates.length) {
      let fractionalDate = new Date(last(item.dailyTotals).date);

      fractionalDate.setDate(fractionalDate.getDate() + daysToHundredKCases - item.dailyTotals.length + 2);

      item.dailyTotals.push({ date: fractionalDate, cases: 100000 });
      item.daysSince100CasesTotals.push({ day: daysToHundredKCases, cases: 100000 });
    }

    return memo.concat([item]);
  }, []);
}

export default class CasesGraphic extends Component {
  constructor(props) {
    super(props);

    const { countryTotals, xScaleType, yScaleType } = { ...DEFAULT_PROPS, ...props };

    checkScaleTypes(xScaleType, yScaleType);

    this.rootRef = createRef();
    this.svgRef = createRef();

    this.measureAndSetDimensions = this.measureAndSetDimensions.bind(this);

    this.countriesData = Object.keys(countryTotals)
      .map(country => {
        const dailyTotals = Object.keys(countryTotals[country])
          .map(date => ({
            date: new Date(date),
            cases: countryTotals[country][date]
          }))
          .filter(({ cases }) => cases >= 1);
        // .filter(({ cases }) => cases >= 100);
        const daysSince100CasesTotals = dailyTotals
          .filter(({ cases }) => cases >= 100)
          .map(({ cases }, index) => ({ day: index, cases }));

        return { key: country, cases: last(dailyTotals).cases, dailyTotals, daysSince100CasesTotals };
      })
      .filter(d => d.daysSince100CasesTotals.length > 0)
      .sort((a, b) => b.cases - a.cases);

    this.countriesData = this.countriesData
      .filter(x => KEY_COUNTRIES.indexOf(x.key) > -1)
      .concat(this.countriesData.filter(x => KEY_COUNTRIES.indexOf(x.key) === -1));

    this.earliestDate = this.countriesData.reduce((memo, d) => {
      const candidate = d.dailyTotals[0].date;

      if (new Date(candidate) < new Date(memo)) {
        return candidate;
      }

      return memo;
    }, this.countriesData[0].dailyTotals[0].date);
    this.latestDate = this.countriesData.reduce((memo, d) => {
      const candidate = last(d.dailyTotals).date;

      if (new Date(candidate) < new Date(memo)) {
        return candidate;
      }

      return memo;
    }, last(this.countriesData[0].dailyTotals).date);
    this.mostDaysSince100Cases = this.countriesData.reduce((memo, d) => {
      return Math.max(memo, d.dailyTotals.length - 1);
    }, 0);
    this.mostCases = this.countriesData.reduce((memo, d) => {
      return Math.max.apply(null, [memo].concat(d.dailyTotals.map(t => t.cases)));
    }, 0);
    this.trendsData = generateTrendsData(TRENDS, this.earliestDate, this.latestDate);

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

  componentDidMount() {
    this.measureAndSetDimensions();
    window.__ODYSSEY__.scheduler.subscribe(this.measureAndSetDimensions);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const prevProps = this.props;
    const prevState = this.state;

    const { countries, highlightedCountries, highlightedTrends, preset, trends, xScaleType, yScaleType } = {
      ...DEFAULT_PROPS,
      ...nextProps
    };
    const { width, height } = nextState;

    const wasResize = width !== prevState.width || height !== prevState.height;

    if (preset === prevProps.preset && !wasResize) {
      return false;
    }

    checkScaleTypes(xScaleType, yScaleType);

    const opacityTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.opacity;
    const transformTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.transform;
    const chartWidth = width - MARGIN.right - MARGIN.left;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;
    const xPropName = xScaleType === 'dates' ? 'date' : 'day';
    const xScale = (xScaleType === 'dates'
      ? scaleTime().domain([new Date(this.earliestDate), new Date(this.latestDate)])
      : scaleLinear().domain([0, this.mostDaysSince100Cases])
    ).range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic' ? scaleLog().nice() : scaleLinear())
      .domain([100, Math.ceil(this.mostCases / 1e5) * 1e5])
      .range([chartHeight, 0]);
    const getDataCollection = d => d[xScaleType === 'dates' ? 'dailyTotals' : 'daysSince100CasesTotals'];
    const generateLinePath = d =>
      line()
        .x(d => xScale(d[xPropName]))
        .y(d => yScale(d.cases))(getDataCollection(d));
    const plotPointTransformGenerator = d => `translate(${xScale(d[xPropName])}, ${yScale(d.cases)})`;
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
    const visibleTrendsData = this.trendsData.filter(isTrendVisible);
    const xAxisGenerator =
      xScaleType === 'dates' ? axisBottom(xScale).tickFormat(timeFormat('%d/%m')) : axisBottom(xScale);
    const yAxisGenerator = axisLeft(yScale)
      .tickValues(TICK_VALUES[yScaleType])
      .tickFormat(format(',.1s'));
    const yAxisGridlinesGenerator = axisLeft(yScale)
      .tickValues(TICK_VALUES[yScaleType])
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
      .text(xScaleType === 'dates' ? 'Date' : 'Number of days since the 100th case');

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
          selection.text(yScaleType === 'linear' ? 'Total cases' : `Cumulative number of cases since the 100th case`);
        } else {
          selection.html(
            yScaleType === 'linear'
              ? 'Total cases'
              : `<tspan x="0" dy="-0.75em">Cumulative number of</tspan><tspan x="0" dy="1.25em">cases since the 100th case</tspan>`
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
      .data(visibleTrendsData);
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
      .data(visibleCountriesData);
    const plotLinesEnter = plotLines // Enter
      .enter()
      .append('path')
      .attr('data-country', d => d.key)
      .classed(styles.plotLine, true)
      .classed(styles.highlighted, isCountryHighlighted)
      .attr('d', generateLinePath)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    plotLines // Update
      .attr('data-country', d => d.key)
      .classed(styles.highlighted, isCountryHighlighted)
      .style('stroke-opacity', null)
      .transition()
      .duration(transformTransitionDuration)
      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

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
      .data(visibleCountriesData);
    const plotDotsEnter = plotDots // Enter
      .enter()
      .append('circle')
      .attr('data-country', d => d.key)
      .classed(styles.plotDot, true)
      .classed(styles.highlighted, isCountryHighlighted)
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
    const trendLabelForceNodes = visibleTrendsData.map(d => {
      const dataCollection = getDataCollection(d);
      return {
        fx: 0,
        // targetY: yScale(last(getDataCollection(d)).cases)
        targetY: yScale(dataCollection[dataCollection.length - 2].cases)
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
      x: 6 + xScale(last(getDataCollection(d))[xPropName]),
      y: trendLabelForceNodes[i].y
    }));
    const trendLabels = svg // Bind
      .select(`.${styles.trendLabels}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.trendLabel}`)
      .data(trendLabelsData);
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
        (d, i) => `translate(${d.x - (i === 0 || IS_TRIDENT ? (chartWidth > 640 ? 40 : 20) : 0)}, ${d.y})`
      )
      .style('fill-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null);
    trendLabels // Update
      .classed(styles.highlighted, isTrendHighlighted)
      .style('fill-opacity', null)
      .transition()
      .duration(transformTransitionDuration)
      .attr(
        'transform',
        (d, i) => `translate(${d.x - (i === 0 || IS_TRIDENT ? (chartWidth > 640 ? 40 : 20) : 0)}, ${d.y})`
      );
    trendLabels // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .remove();

    // Rendering > 11. Add/remove/update plot labels (near ends of lines)
    const labelledCountriesData = visibleCountriesData.filter(d => KEY_COUNTRIES.indexOf(d.key) > -1);
    const plotLabelForceNodes = labelledCountriesData.map(d => {
      return {
        fx: 0,
        targetY: yScale(last(getDataCollection(d)).cases)
      };
    });
    const plotLabelsForceSimulation = forceSimulation()
      .nodes(plotLabelForceNodes)
      .force('collide', forceCollide(PLOT_LABEL_HEIGHT / 2))
      .force('y', forceY(d => d.targetY).strength(1))
      .force('clamp', labelForceClamp(0, chartHeight))
      .stop();
    for (let i = 0; i < 300; i++) {
      plotLabelsForceSimulation.tick();
    }
    const plotLabelsData = labelledCountriesData.map((d, i) => ({
      key: d.key,
      text: ALIASES[d.key] || d.key,
      x: 6 + xScale(last(getDataCollection(d))[xPropName]),
      y: plotLabelForceNodes[i].y
    }));
    const plotLabels = svg // Bind
      .select(`.${styles.plotLabels}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLabel}`)
      .data(plotLabelsData);
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
    window.__ODYSSEY__.scheduler.unsubscribe(this.measureAndSetDimensions);
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
