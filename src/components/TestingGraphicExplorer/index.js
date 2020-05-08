import { RadioGroup } from '@atlaskit/radio';
import React, { useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { decodeVersionedProps, encodeVersionedProps, updateLegacyProps } from '../../utils';
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

export default ({ placesData }) => {
  const initialProps = updateLegacyProps(decodeEncodedUrlParam() || DEFAULT_PROPS);

  const [yScaleType, setYScaleType] = useState(initialProps.yScaleType);
  const [yScaleProp, setYScaleProp] = useState(initialProps.yScaleProp);
  const [visiblePlaces, setVisiblePlaces] = useState(initialProps.places);
  const [highlightedPlaces, setHighlightedPlaces] = useState(initialProps.highlightedPlaces);

  const testingGraphicProps = {
    ...initialProps,
    yScaleType,
    yScaleProp,
    places: visiblePlaces,
    highlightedPlaces
  };

  history.replaceState(testingGraphicProps, document.title, `?encoded=${encodeVersionedProps(testingGraphicProps)}`);

  const isDailyFigures = yScaleProp.indexOf('new') === 0;
  const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScalePropOptions = Y_SCALE_PROPS.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const placesSelectOptions = Object.keys(placesData).map(place => ({ label: place, value: place }));

  const testingGraphicPropsJSON = JSON.stringify(testingGraphicProps, 2, 2);
  const encodedTestingGraphicProps = encodeVersionedProps(testingGraphicProps);
  const encodedMarkerText = `#testinggraphicENCODED${encodedTestingGraphicProps}`;

  return (
    <div className={styles.root}>
      <div className={styles.graphic}>
        <InlineGraphic>
          <TestingGraphic preset={Math.random()} placesData={placesData} {...testingGraphicProps} />
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
