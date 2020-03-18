import {
  axisBottom,
  axisLeft,
  curveMonotoneX,
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
import { ABBREVIATIONS, ALIASES, KEY_COUNTRIES } from '../../constants';
import styles from './styles.css';

const REM = 16;
const MARGIN = {
  top: 3 * REM,
  right: 5 * REM,
  bottom: 3 * REM,
  left: 2 * REM
};
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

function checkScaleTypes(xScaleType, yScaleType) {
  if (X_SCALE_TYPES.indexOf(xScaleType) === -1) {
    throw new Error(`Unrecognised xScaleType: ${xScaleType}`);
  }

  if (Y_SCALE_TYPES.indexOf(yScaleType) === -1) {
    throw new Error(`Unrecognised yScaleType: ${yScaleType}`);
  }
}

export default class CasesGraphic extends Component {
  constructor(props) {
    super(props);

    const { countryTotals, xScaleType, yScaleType } = props;

    checkScaleTypes(xScaleType, yScaleType);

    this.rootRef = createRef();
    this.svgRef = createRef();

    this.measureAndSetDimensions = this.measureAndSetDimensions.bind(this);

    this.countriesData = Object.keys(countryTotals)
      .map(country => {
        const dailyTotals = Object.keys(countryTotals[country])
          .map(date => ({
            date: new Date(date),
            value: countryTotals[country][date]
          }))
          .filter(({ value }) => value >= 1);
        // .filter(({ value }) => value >= 100);
        const daysSince100CasesTotals = dailyTotals
          .filter(({ value }) => value >= 100)
          .map(({ value }, index) => ({ day: index, value }));

        return { key: country, dailyTotals, daysSince100CasesTotals };
      })
      // .filter(d => d.dailyTotals.length > 0)
      .filter(d => d.daysSince100CasesTotals.length > 0)
      .sort((a, b) => a.dailyTotals[a.dailyTotals.length - 1].value - b.dailyTotals[b.dailyTotals.length - 1].value)
      .sort((a, b) => (KEY_COUNTRIES.indexOf(a.key) > -1 ? -1 : 1));
    // console.debug(this.countriesData);
    this.earliestDate = this.countriesData.reduce((memo, d) => {
      const candidate = d.dailyTotals[0].date;

      if (new Date(candidate) < new Date(memo)) {
        return candidate;
      }

      return memo;
    }, this.countriesData[0].dailyTotals[0].date);
    this.latestDate = this.countriesData.reduce((memo, d) => {
      const candidate = d.dailyTotals[d.dailyTotals.length - 1].date;

      if (new Date(candidate) < new Date(memo)) {
        return candidate;
      }

      return memo;
    }, this.countriesData[0].dailyTotals[this.countriesData[0].dailyTotals.length - 1].date);
    this.mostDaysSince100Cases = this.countriesData.reduce((memo, d) => {
      return Math.max(memo, d.dailyTotals.length - 1);
    }, 0);
    this.mostCases = this.countriesData.reduce((memo, d) => {
      return Math.max.apply(null, [memo].concat(d.dailyTotals.map(t => t.value)));
    }, 0);

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

    const { countries, highlightedCountries, highlightedTrends, preset, trends, xScaleType, yScaleType } = nextProps;
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

    const svg = select(this.svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const xScale = (xScaleType === 'dates'
      ? scaleTime().domain([new Date(this.earliestDate), new Date(this.latestDate)])
      : scaleLinear().domain([0, this.mostDaysSince100Cases])
    ).range([0, chartWidth]);

    const yScale = (yScaleType === 'logarithmic' ? scaleLog().nice() : scaleLinear())
      .domain([100, Math.ceil(this.mostCases / 1e5) * 1e5])
      .range([chartHeight, 0]);

    const xAxisGenerator =
      xScaleType === 'dates' ? axisBottom(xScale).tickFormat(timeFormat('%d/%m')) : axisBottom(xScale);

    svg
      .select(`.${styles.xAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top + chartHeight})`)
      .call(xAxisGenerator);

    svg
      .select(`.${styles.xAxisLabel}`)
      .attr('transform', `translate(${MARGIN.left + chartWidth / 2} ${height - REM / 2})`)
      .text(xScaleType === 'dates' ? 'Date' : 'Number of days since the 100th case');

    const yAxisGenerator = axisLeft(yScale)
      .tickValues(TICK_VALUES[yScaleType])
      .tickFormat(format(',.1s'));

    svg
      .select(`.${styles.yAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGenerator);

    svg
      .select(`.${styles.yAxisLabel}`)
      .attr('transform', `translate(${0} ${MARGIN.top / 2})`)
      .html(
        yScaleType === 'linear'
          ? 'Total cases'
          : `<tspan x="0" dy="-0.75em">Cumulative number of</tspan><tspan x="0" dy="1.25em">cases since the 100th case</tspan>`
      );

    const yAxisGridlinesGenerator = axisLeft(yScale)
      .tickValues(TICK_VALUES[yScaleType])
      .tickSize(-chartWidth)
      .tickFormat('');

    svg
      .select(`.${styles.yAxisGridlines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGridlinesGenerator);

    const plot = svg.select(`.${styles.plot}`).attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`);

    const generateLinePath = d =>
      line()
        // .curve(curveMonotoneX)
        .x(d => xScale(d[xScaleType === 'dates' ? 'date' : 'day']))
        .y(d => yScale(d.value))(d[xScaleType === 'dates' ? 'dailyTotals' : 'daysSince100CasesTotals']);

    const isHighlighted = d =>
      highlightedCountries === true ||
      (Array.isArray(highlightedCountries) && highlightedCountries.indexOf(d.key) > -1);

    // Bind
    const plotLines = plot
      .select(`.${styles.plotLines}`)
      .selectAll(`.${styles.plotLine}`)
      .data(this.countriesData.filter(d => countries === true || countries.indexOf(d.key) > -1));

    // Enter
    const plotLinesEnter = plotLines
      .enter()
      .append('path')
      .attr('data-country', d => d.key)
      .classed(styles.plotLine, true)
      .classed(styles.highlighted, isHighlighted)
      .attr('d', generateLinePath)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', 1);

    // Update
    plotLines
      .classed(styles.highlighted, isHighlighted)
      .style('stroke-opacity', 1)
      .transition()
      .duration(transformTransitionDuration)

      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

        return interpolatePath(previousPath, currentPath);
      });

    // Exit
    plotLines
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', 0)
      .remove();

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
          <g className={styles.plot}>
            <g className={styles.plotLines} />
          </g>
          <g className={styles.xAxis} />
          <text className={styles.xAxisLabel} />
          <g className={styles.yAxis} />
          <text className={styles.yAxisLabel} />
        </svg>
      </div>
    );
  }
}
