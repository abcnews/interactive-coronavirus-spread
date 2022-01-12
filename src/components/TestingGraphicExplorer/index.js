import { Checkbox } from '@atlaskit/checkbox';
import { RadioGroup } from '@atlaskit/radio';
import React, { useMemo, useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { PLACES_TESTING_DATA_URL } from '../../constants';
import { usePlacesTestingData } from '../../data-loader';
import { decodeVersionedProps, encodeVersionedProps, updateLegacyProps } from '../../mount-utils';
import TestingGraphic, { DEFAULT_PROPS, Y_SCALE_TYPES, Y_SCALE_PROPS } from '../TestingGraphic';
import InlineGraphic from '../InlineGraphic';
import styles from '../CasesGraphicExplorer/styles.css'; // borrow styles from CasesGaphicExplorer (they're visually the same)

const SELECT_STYLES = {
  multiValueLabel: (provided, state) => ({
    ...provided,
    fontFamily: 'ABCSans'
  })
};
const RADIO_LABELS = {
  dates: 'Date',
  linear: 'Linear',
  logarithmic: 'Logarithmic',
  newtests: 'Daily new tests',
  newtestspcc: 'Daily new tests / confirmed case',
  newtestspmp: 'Daily new tests / million people',
  tests: 'Cumulative tests',
  testspcc: 'Cumulative tests / confirmed case',
  testspmp: 'Cumulative tests / million people'
};

const animatedComponents = makeAnimated();
const optionsValues = options => options.map(option => option.value);

const decodeEncodedUrlParam = () => {
  const result = /[?&]encoded=([^&#]*)/i.exec(String(window.location));

  return result ? decodeVersionedProps(result[1]) : null;
};

export default () => {
  const initialProps = updateLegacyProps(decodeEncodedUrlParam() || DEFAULT_PROPS);

  const [yScaleType, setYScaleType] = useState(initialProps.yScaleType);
  const [yScaleProp, setYScaleProp] = useState(initialProps.yScaleProp);
  const [hasLineSmoothing, setHasLineSmoothing] = useState(initialProps.hasLineSmoothing);
  const [visiblePlaces, setVisiblePlaces] = useState(initialProps.places);
  const [highlightedPlaces, setHighlightedPlaces] = useState(initialProps.highlightedPlaces);
  const [fromDate, setFromDate] = useState(initialProps.fromDate || null);
  const [toDate, setToDate] = useState(initialProps.toDate || null);
  const [
    { isLoading: isExplorerPlacesDataLoading, error: explorerPlacesDataError, data: explorerPlacesData }
  ] = usePlacesTestingData();

  const testingGraphicProps = {
    ...initialProps,
    yScaleType,
    yScaleProp,
    hasLineSmoothing,
    places: visiblePlaces,
    highlightedPlaces,
    fromDate,
    toDate
  };

  history.replaceState(testingGraphicProps, document.title, `?encoded=${encodeVersionedProps(testingGraphicProps)}`);

  const isDailyFigures = yScaleProp.indexOf('new') === 0;
  const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScalePropOptions = Y_SCALE_PROPS.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const [placesSelectOptions, availableDates] = useMemo(() => {
    if (!explorerPlacesData) {
      return [[], null];
    }

    const placesSelectOptions = Object.keys(explorerPlacesData).map(place => ({ label: place, value: place }));
    const availableDates = Object.keys(explorerPlacesData[Object.keys(explorerPlacesData)[0]].dates);

    requestAnimationFrame(() => {
      setFromDate(null);
      setToDate(null);
    });

    return [placesSelectOptions, availableDates];
  }, [explorerPlacesData]);
  const fromDateSelectOptions = [{ label: 'Earliest known', value: null }].concat(
    availableDates
      ? availableDates
          .filter((date, index) => index < (toDate ? availableDates.indexOf(toDate) : Infinity))
          .map(date => ({ label: date, value: date }))
      : []
  );
  const toDateSelectOptions = (availableDates
    ? availableDates
        .filter((date, index) => index > (fromDate ? availableDates.indexOf(fromDate) : -1))
        .map(date => ({ label: date, value: date }))
    : []
  ).concat([{ label: 'Latest known', value: null }]);
  const testingGraphicPropsJSON = JSON.stringify(testingGraphicProps, 2, 2);
  const encodedTestingGraphicProps = encodeVersionedProps(testingGraphicProps);
  const encodedMarkerText = `#testinggraphicENCODED${encodedTestingGraphicProps}`;

  return (
    <div className={styles.root}>
      <div className={styles.graphic}>
        <InlineGraphic>
          <TestingGraphic preset={Math.random()} {...testingGraphicProps} />
        </InlineGraphic>
      </div>
      <div className={styles.controls}>
        <div key="highlightedplaces">
          <label>
            Highlighted Places{' '}
            <button
              onClick={() => setHighlightedPlaces(Array.from(new Set(visiblePlaces.concat(highlightedPlaces))))}
              disabled={visiblePlaces.sort().join() === highlightedPlaces.sort().join()}
            >
              Highlight all visible places
            </button>
          </label>
          <Select
            components={animatedComponents}
            styles={SELECT_STYLES}
            defaultValue={placesSelectOptions.filter(
              option => initialProps.highlightedPlaces.indexOf(option.value) > -1
            )}
            isMulti
            options={placesSelectOptions}
            value={placesSelectOptions.filter(option => highlightedPlaces.indexOf(option.value) > -1)}
            onChange={selectedOptions => {
              const nextHighlightedPlaces = optionsValues(selectedOptions || []);

              setVisiblePlaces(Array.from(new Set(visiblePlaces.concat(nextHighlightedPlaces))));
              setHighlightedPlaces(nextHighlightedPlaces);
            }}
          />
        </div>
        <div key="visibleplaces">
          <label>Visible Places</label>
          <Select
            components={animatedComponents}
            styles={SELECT_STYLES}
            defaultValue={placesSelectOptions.filter(option => initialProps.places.indexOf(option.value) > -1)}
            value={placesSelectOptions.filter(option => visiblePlaces.indexOf(option.value) > -1)}
            isMulti
            options={placesSelectOptions}
            onChange={selectedOptions => {
              const nextVisiblePlaces = optionsValues(selectedOptions || []);

              setVisiblePlaces(nextVisiblePlaces);
              setHighlightedPlaces(highlightedPlaces.filter(place => nextVisiblePlaces.indexOf(place) > -1));
            }}
          />
        </div>

        <div key="dates">
          <label>Dates</label>
          <div className={styles.flexRow}>
            <Select
              components={animatedComponents}
              styles={SELECT_STYLES}
              defaultValue={fromDateSelectOptions.find(option => option.value === fromDate)}
              value={fromDateSelectOptions.find(option => option.value === fromDate)}
              options={fromDateSelectOptions}
              onChange={selectedOption => {
                const [nextFromDate] = optionsValues([selectedOption]);

                setFromDate(nextFromDate);
              }}
            />
            <span>to</span>
            <Select
              components={animatedComponents}
              styles={SELECT_STYLES}
              defaultValue={toDateSelectOptions.find(option => option.value === toDate)}
              value={toDateSelectOptions.find(option => option.value === toDate)}
              options={toDateSelectOptions}
              onChange={selectedOption => {
                const [nextToDate] = optionsValues([selectedOption]);

                setToDate(nextToDate);
              }}
            />
          </div>
        </div>
        <div key="yscaleprop">
          <label>Y-axis</label>
          <RadioGroup
            name="yscaleprop"
            defaultValue={initialProps.yScaleProp}
            value={yScaleProp}
            options={yScalePropOptions}
            onChange={event => {
              const yScaleProp = event.currentTarget.value;
              const isDailyFigures = yScaleProp.indexOf('new') === 0;
              const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

              setYScaleProp(yScaleProp);
            }}
          />
        </div>
        <div key="yscaletype">
          <label>Y-axis Scale</label>
          <div className={styles.flexRow}>
            <RadioGroup
              name="yscaletype"
              defaultValue={initialProps.yScaleType}
              value={yScaleType}
              options={yScaleTypeOptions}
              onChange={event => {
                const yScaleType = event.currentTarget.value;

                setYScaleType(yScaleType);
              }}
            />
          </div>
        </div>
        <div key="haslinesmoothing">
          <label>Line Smoothing</label>
          <Checkbox
            name="haslinesmoothing"
            label="Apply smoothing to lines"
            value="Apply smoothing to lines"
            isChecked={hasLineSmoothing}
            onChange={event => setHasLineSmoothing(event.target.checked)}
          />
        </div>
        <hr />
        <details>
          <summary>
            Encoded Marker
            <button onClick={() => navigator.clipboard.writeText(encodedMarkerText)}>Copy to clipboard</button>
          </summary>
          <pre>{encodedMarkerText}</pre>
        </details>
        <details>
          <summary>
            New Preset Code
            <button onClick={() => navigator.clipboard.writeText(testingGraphicPropsJSON)}>Copy to clipboard</button>
          </summary>
          <pre>{testingGraphicPropsJSON}</pre>
        </details>
        <p>
          <a
            href={`https://fallback-automation.drzax.now.sh/api?url=${document.location.href}&selector=%5Bdata-preset%5D&width=600`}
            download="fallback.png"
          >
            Download Fallback Image
          </a>
        </p>
        <hr />
        <div>
          <label>
            <button disabled={initialProps === DEFAULT_PROPS} onClick={() => (window.location = '?')}>
              Reset chart to default view
            </button>
          </label>
        </div>
      </div>
    </div>
  );
};
