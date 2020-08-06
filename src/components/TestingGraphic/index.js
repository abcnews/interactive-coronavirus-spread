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
import { KEY_PLACES, KEY_EUROPEAN_PLACES } from '../../constants';
import { usePlacesTestingData } from '../../data-loader';
import { generateColorAllocator, last } from '../../misc-utils';
import styles from '../CasesGraphic/styles.css'; // borrow styles from CasesGaphic (they're visually the same)

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
export const Y_SCALE_TYPES = ['logarithmic', 'linear'];
const Y_SCALE_TOTAL_PROPS = ['tests', 'testspcc']; // pcc props shouldn't have pmp added
const Y_SCALE_TOTAL_INCLUDING_PMP_PROPS = Y_SCALE_TOTAL_PROPS.concat(
  Y_SCALE_TOTAL_PROPS.filter(x => x.indexOf('pcc') === -1).map(x => `${x}pmp`)
);
export const Y_SCALE_PROPS = Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.concat(
  Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.map(x => `new${x}`)
);
export const DEFAULT_PROPS = {
  yScaleType: Y_SCALE_TYPES[0],
  yScaleProp: Y_SCALE_PROPS[0],
  hasLineSmoothing: true,
  places: KEY_PLACES,
  highlightedPlaces: KEY_PLACES
};
const KEYING_FN = d => d.key;

const calculateDoublingTimePeriods = increasePerPeriod => Math.log(2) / Math.log(increasePerPeriod + 1);
const calculateIncreasePerPeriod = doublingTimePeriods => Math.exp(Math.log(2) / doublingTimePeriods) - 1;
const calculatePeriodsToIncrease = (increasePerPeriod, startingValue, endingValue) =>
  Math.log(endingValue / startingValue) / Math.log(increasePerPeriod + 1);
const inclusionCheckGenerator = (collection, itemPropName) => d =>
  typeof collection === 'boolean' ? collection : Array.isArray(collection) && collection.indexOf(d[itemPropName]) > -1;

function checkScaleTypes(yScaleType) {
  if (Y_SCALE_TYPES.indexOf(yScaleType) === -1) {
    throw new Error(`Unrecognised yScaleType: ${yScaleType}`);
  }
}

function checkScaleProps(yScaleProp) {
  if (Y_SCALE_PROPS.indexOf(yScaleProp) === -1) {
    throw new Error(`Unrecognised yScaleProp: ${yScaleProp}`);
  }
}

let transformedPlacesDataCache = {};

function transformPlacesData(placesData, cacheKey) {
  if (!transformedPlacesDataCache[cacheKey]) {
    transformedPlacesDataCache[cacheKey] = Object.keys(placesData)
      .map(place => {
        const placeDates = Object.keys(placesData[place].dates);
        const population = placesData[place].population || null;
        let dates = placeDates
          .reduce((memo_dates, placeDate, placeDatesIndex) => {
            const placeDatesTotals = placesData[place].dates[placeDate];
            const placeDatesTotalsProps = Object.keys(placeDatesTotals);
            const placeDatesTotalsIncludingPerMillionPeople =
              typeof population === 'number'
                ? {
                    ...placeDatesTotals,
                    ...placeDatesTotalsProps.reduce((memo_totals, prop) => {
                      if (prop.indexOf('pcc') > -1) {
                        return memo_totals;
                      }

                      memo_totals[`${prop}pmp`] = (placeDatesTotals[prop] / population) * 1e6;

                      return memo_totals;
                    }, {})
                  }
                : placeDatesTotals;
            const placeDatesTotalsIncludingPerMillionPeopleProps = Object.keys(
              placeDatesTotalsIncludingPerMillionPeople
            );

            return memo_dates.concat([
              {
                date: new Date(placeDate),
                ...placeDatesTotalsIncludingPerMillionPeople,
                ...placeDatesTotalsIncludingPerMillionPeopleProps.reduce((memo_totals, prop) => {
                  const newProp = `new${prop}`;

                  if (placeDatesIndex === 0) {
                    memo_totals[newProp] = placeDatesTotalsIncludingPerMillionPeople[prop];
                  } else {
                    const previousDateTotals = memo_dates[memo_dates.length - 1];

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
          .filter(({ tests, date }) => tests >= 1); // TODO: Do we want to show zero? If so, remove this filter

        return {
          key: place,
          type: placesData[place].type,
          population,
          dates,
          ...Y_SCALE_PROPS.reduce((memo, propName) => {
            memo[`${propName}Max`] = Math.max.apply(null, [0].concat(dates.map(t => t[propName])));

            return memo;
          }, {})
        };
      })
      .sort((a, b) => b.tests - a.tests);
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

const TestingGraphic = props => {
  const renderId = generateRenderId();

  const { placesDataURL, yScaleType } = {
    ...DEFAULT_PROPS,
    ...props
  };

  checkScaleTypes(yScaleType);

  const rootRef = useRef();
  const svgRef = useRef();
  const svgTitleRef = useRef();
  const svgDescRef = useRef();
  const [idIndex, svgID, titleID, descID] = useMemo(
    () => [
      nextIDIndex,
      `CasesGraphic${nextIDIndex}SVG`,
      `CasesGraphic${nextIDIndex}Title`,
      `CasesGraphic${nextIDIndex++}Desc`
    ],
    []
  );
  const [
    { isLoading: isPlacesDataLoading, error: placesDataError, data: untransformedPlacesData },
    setPlacesDataURL
  ] = usePlacesTestingData(placesDataURL);
  const [placesData, earliestDate, latestDate] = useMemo(() => {
    if (!untransformedPlacesData) {
      return [];
    }

    const placesData = transformPlacesData(untransformedPlacesData, placesDataURL);
    const earliestDate = placesData.reduce((memo, d) => {
      const candidate = d.dates[0].date;

      if (candidate < memo) {
        return candidate;
      }

      return memo;
    }, placesData[0].dates[0].date);
    const latestDate = placesData.reduce((memo, d) => {
      const candidate = last(d.dates).date;

      if (candidate > memo) {
        return candidate;
      }

      return memo;
    }, last(placesData[0].dates).date);

    return [placesData, earliestDate, latestDate];
  }, [untransformedPlacesData]);
  const [state, setState] = useState({
    width: null,
    height: null
  });
  const prevProps = usePrevious(props);
  const prevUntransformedPlacesData = usePrevious(untransformedPlacesData);
  const prevState = usePrevious(state);

  function debug(message) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[TestingGraphic ${idIndex}:${renderId}] ${message}`);
    }
  }

  function measureAndSetDimensions(client) {
    if (client && !client.hasChanged) {
      return;
    }

    const { width, height } = rootRef.current.getBoundingClientRect();

    setState({ width, height });
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

    let { places, highlightedPlaces, preset, yScaleType, yScaleProp, hasLineSmoothing, fromDate, toDate } = {
      ...DEFAULT_PROPS,
      ...props
    };

    if (placesDataURL !== prevProps.placesDataURL) {
      debug('Places data URL change requires reload');

      return setPlacesDataURL(placesDataURL);
    }

    const { width, height } = state;
    const wasResize = width !== prevState.width || height !== prevState.height;

    if (preset === prevProps.preset && untransformedPlacesData === prevUntransformedPlacesData && !wasResize) {
      debug("No changes to preset or untransformedPlacesData and wasn't resized");
      return;
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

    checkScaleTypes(yScaleType);
    checkScaleProps(yScaleProp);

    if (typeof places === 'function') {
      // Apply a filter
      places = placesData.filter(places).map(x => x.key);
    }

    const timeLowerExtent = fromDate ? new Date(fromDate) : earliestDate;
    const timeUpperExtent = toDate ? new Date(toDate) : latestDate;
    const timeRangeDays = Math.round((timeUpperExtent - timeLowerExtent) / ONE_DAY);
    const timeRangeFilter = d => d.date >= timeLowerExtent && d.date <= timeUpperExtent;

    // Filter placesData to just visible places, and create visible/highlighted comparison utils
    const isPlaceVisible = inclusionCheckGenerator(places, 'key');
    const isPlaceHighlighted = inclusionCheckGenerator(highlightedPlaces, 'key');
    const visiblePlacesData = placesData.filter(isPlaceVisible).filter(d => d.dates.filter(timeRangeFilter).length > 0);

    const isDailyFigures = yScaleProp.indexOf('new') === 0;
    const isCasesFactoredIn = yScaleProp.indexOf('pcc') > -1;
    const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

    const logarithmicLowerExtent = 1 / (isDailyFigures ? 10 : 1) / (isCasesFactoredIn || isPerCapitaFigures ? 10 : 1);

    const yScaleCap = visiblePlacesData.reduce((memo, d) => {
      return Math.max.apply(null, [memo].concat(d.dates.filter(timeRangeFilter).map(t => t[yScaleProp])));
    }, 0);

    const xAxisLabel = 'Date';
    const yAxisLabelValue = `${isDailyFigures ? 'Daily' : 'Cumulative'} ${yScaleProp
      .replace('new', 'new ')
      .replace('pcc', '')
      .replace('pmp', '')}`;
    const yAxisLabelFactor = isPerCapitaFigures ? 'per million people' : isCasesFactoredIn ? 'per confirmed case' : '';
    const yAxisLabel = `${yAxisLabelValue}${yAxisLabelFactor ? ` ${yAxisLabelFactor}` : ''}`;

    const opacityTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.opacity;
    const transformTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.transform;
    const chartWidth = width - MARGIN.right - MARGIN.left;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;
    const xScale = scaleTime()
      .domain([timeLowerExtent, timeUpperExtent])
      .range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic'
      ? scaleLog().domain([logarithmicLowerExtent, yScaleCap], true)
      : scaleLinear().domain([0, yScaleCap], true)
    ).range([chartHeight, 0]);
    const safe_yScale = x =>
      yScale(yScaleType === 'logarithmic' && x <= logarithmicLowerExtent ? logarithmicLowerExtent : x);
    const getUncappedDataCollection = d => d.dates;
    const getDataCollection = d =>
      getUncappedDataCollection(d).filter(item => item[yScaleProp] <= yScaleCap && timeRangeFilter(item));
    const generateLinePath = d =>
      line()
        .x(d => xScale(d.date))
        .y(d => safe_yScale(d[yScaleProp]))
        .curve(hasLineSmoothing ? curveMonotoneX : curveLinear)(getDataCollection(d));
    const plotPointTransformGenerator = d =>
      d ? `translate(${xScale(d.date)}, ${safe_yScale(d[yScaleProp])})` : 'none';
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
    const getAllocatedColor = generateColorAllocator(visiblePlacesData);
    const xAxisGenerator = axisBottom(xScale)
      // .ticks(timeRangeDays < 10 ? timeDay.every(1) : timeRangeDays < 60 ? timeWeek.every(1) : timeWeek.every(2))
      .ticks(width < 640 ? 4 : 8)
      .tickFormat(timeFormat('%-d/%-m'));
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
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Rendering > 2: Update accessible title and description
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
          selection.html(
            yAxisLabelFactor && chartWidth <= 640
              ? `<tspan x="0" dy="-0.75em">${yAxisLabelValue}</tspan><tspan x="0" dy="1.25em">${yAxisLabelFactor}</tspan>`
              : `<tspan>${yAxisLabel}</tspan>`
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

    // Rendering > 8. Add/remove/update plot lines
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
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    plotLines // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
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
      .data(visiblePlacesData, KEYING_FN);
    const plotDotsEnter = plotDots // Enter
      .enter()
      .append('circle')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotDot, true)
      .classed(styles.highlighted, isPlaceHighlighted)
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

    // Rendering > 10. Add/remove/update plot labels (near ends of lines)
    const labelledPlacesData = visiblePlacesData.filter(
      d =>
        isPlaceHighlighted(d) || KEY_PLACES.concat(preset === 'europe' ? KEY_EUROPEAN_PLACES : []).indexOf(d.key) > -1
    );
    const plotLabelForceNodes = labelledPlacesData.map(d => ({
      fx: 0,
      targetY: safe_yScale(last(getDataCollection(d))[yScaleProp])
    }));
    const plotLabelsForceSimulation = forceSimulation()
      .nodes(plotLabelForceNodes)
      .force('collide', forceCollide(PLOT_LABEL_HEIGHT / 2))
      .force('y', forceY(d => d.targetY).strength(1))
      .force('clamp', labelForceClamp(0, chartHeight))
      .stop();
    for (let i = 0; i < 300; i++) {
      plotLabelsForceSimulation.tick();
    }
    const plotLabelsData = labelledPlacesData.map((d, i) => ({
      key: d.key,
      text: d.key,
      x: 6 + xScale(last(getDataCollection(d)).date),
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
  }, [renderId]);

  return (
    <div ref={rootRef} className={styles.root}>
      <svg ref={svgRef} className={styles.svg} id={svgID} role="img" aria-labelledby={`${titleID} ${descID}`}>
        <title ref={svgTitleRef} id={titleID} />
        <desc ref={svgDescRef} id={descID} />
        <g className={styles.yAxisGridlines} />
        <g className={styles.plotLines} />
        <g className={styles.plotDots} />
        <g className={styles.xAxis} />
        <text className={styles.xAxisLabel} />
        <g className={styles.yAxis} />
        <text className={styles.yAxisLabel} />
        <g className={styles.plotLabels} />
      </svg>
    </div>
  );
};

TestingGraphic.displayName = 'TestingGraphic';

export default TestingGraphic;
