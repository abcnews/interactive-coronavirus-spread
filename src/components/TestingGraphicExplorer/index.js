import { RadioGroup } from '@atlaskit/radio';
import React, { useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { decodeVersionedProps, encodeVersionedProps, updateLegacyProps } from '../../utils';
import TestingGraphic, {
  DEFAULT_CASES_CAP,
  DEFAULT_PROPS,
  UNDERLYING_PROPS_PATTERN,
  UNDERLYING_PROPS_FOR_X_SCALE_TYPES,
  X_SCALE_TYPES,
  Y_SCALE_TYPES,
  Y_SCALE_PROPS
} from '../TestingGraphic';
import InlineGraphic from '../InlineGraphic';
import styles from '../CasesGraphicExplorer/styles.css'; // borrow styles from CasesGaphicExplorer (they're visually the same)

const X_AXIS_TYPES_FOR_UNDERLYING_PROPS = {
  cases: 'daysSince100Cases',
  deaths: 'daysSince1Death',
  recoveries: 'daysSince1Recovery'
};
const SELECT_STYLES = {
  multiValueLabel: (provided, state) => ({
    ...provided,
    fontFamily: 'ABCSans'
  })
};
const RADIO_LABELS = {
  cases: 'Cumulative cases',
  casespmp: 'Cumulative cases / million people',
  dates: 'Date',
  daysSince100Cases: 'Days since 100th case',
  daysSince1Death: 'Days since 1st death',
  daysSince1Recovery: 'Days since 1st recovery',
  deaths: 'Cumulative deaths',
  deathspmp: 'Cumulative deaths / million people',
  linear: 'Linear',
  logarithmic: 'Logarithmic',
  newcases: 'Daily new cases',
  newcasespmp: 'Daily new cases / million people',
  newdeaths: 'Daily new deaths',
  newdeathspmp: 'Daily new deaths / million people',
  newrecoveries: 'Daily new recoveries',
  newrecoveriespmp: 'Daily new recoveries / million people',
  recoveries: 'Cumulative recoveries',
  recoveriespmp: 'Cumulative recoveries / million people'
};
const Y_SCALE_CAP_OPTIONS = {
  '1000': '1k',
  '5000': '5k',
  '10000': '10k',
  '50000': '50k',
  '100000': '100k',
  '': 'None'
};
const DAYS_CAP_OPTIONS = {
  '10': '10 days',
  '20': '20 days',
  '30': '30 days',
  '40': '40 days',
  '': 'None'
};

const animatedComponents = makeAnimated();
const optionsValues = options => options.map(option => option.value);

const decodeEncodedUrlParam = () => {
  const result = /[?&]encoded=([^&#]*)/i.exec(String(window.location));

  return result ? decodeVersionedProps(result[1]) : null;
};

export default ({ placesData }) => {
  const initialProps = updateLegacyProps(decodeEncodedUrlParam() || DEFAULT_PROPS);

  const [xScaleType, setXScaleType] = useState(initialProps.xScaleType);
  const [yScaleType, setYScaleType] = useState(initialProps.yScaleType);
  const [yScaleProp, setYScaleProp] = useState(initialProps.yScaleProp);
  const [xScaleDaysCap, setXScaleDaysCap] = useState(initialProps.xScaleDaysCap);
  const [yScaleCap, setYScaleCap] = useState(initialProps.yScaleCap);
  const [visiblePlaces, setVisiblePlaces] = useState(initialProps.places);
  const [highlightedPlaces, setHighlightedPlaces] = useState(initialProps.highlightedPlaces);

  const testingGraphicProps = {
    ...initialProps,
    xScaleType,
    yScaleType,
    yScaleProp,
    yScaleCap,
    xScaleDaysCap,
    places: visiblePlaces,
    highlightedPlaces
  };

  history.replaceState(testingGraphicProps, document.title, `?encoded=${encodeVersionedProps(testingGraphicProps)}`);

  const isDailyFigures = yScaleProp.indexOf('new') === 0;
  const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

  const xScaleTypeOptions = X_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
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
        <div key="xscaletype">
          <label>X-axis</label>
          <RadioGroup
            name="xscaletype"
            defaultValue={initialProps.xScaleType}
            value={xScaleType}
            options={xScaleTypeOptions}
            onChange={event => {
              const xScaleType = event.currentTarget.value;

              // Update x-scale type
              setXScaleType(xScaleType);

              // Update y-scale prop if the underlying prop doesn't fit the x-scale
              const underlyingProp = UNDERLYING_PROPS_FOR_X_SCALE_TYPES[xScaleType];
              if (underlyingProp && yScaleProp.indexOf(underlyingProp) === -1) {
                setYScaleProp(yScaleProp.replace(UNDERLYING_PROPS_PATTERN, underlyingProp));
              }

              // if (xScaleType === 'dates') {
              //   setYScaleType('linear');
              // }
            }}
          />
        </div>
        {xScaleType.indexOf('days') === 0 && (
          <div key="dayscap">
            <label>X-axis (days-based) Cap</label>
            <div className={styles.flexRow}>
              <RadioGroup
                name="dayscap"
                defaultValue={initialProps.xScaleDaysCap ? String(initialProps.xScaleDaysCap) : ''}
                value={xScaleDaysCap ? String(xScaleDaysCap) : ''}
                options={Object.keys(DAYS_CAP_OPTIONS).map(value => ({
                  label: DAYS_CAP_OPTIONS[value],
                  value
                }))}
                onChange={event => {
                  const xScaleDaysCap = event.currentTarget.value;

                  setXScaleDaysCap(xScaleDaysCap ? +xScaleDaysCap : false);
                }}
              />
            </div>
          </div>
        )}
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

              if (isPerCapitaFigures || isDailyFigures) {
                setYScaleCap(false);
              }

              // if (yScaleType === 'logarithmic' && isDailyFigures) {
              //   setXScaleType('daysSince100Cases');
              // }

              // If we're not looking at dates on the x-axis, set it to a "Days since..."
              // prop relative to the new y-axis prop
              if (UNDERLYING_PROPS_FOR_X_SCALE_TYPES[xScaleType]) {
                setXScaleType(X_AXIS_TYPES_FOR_UNDERLYING_PROPS[yScaleProp.match(UNDERLYING_PROPS_PATTERN)[0]]);
              }
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

                // if (yScaleType === 'logarithmic' && yScaleProp.indexOf('new') === -1) {
                //   setXScaleType('daysSince100Cases');
                // }
              }}
            />
          </div>
        </div>
        {!(isDailyFigures || isPerCapitaFigures) && (
          <div>
            <label>Y-axis Cap</label>
            <div className={styles.flexRow}>
              <RadioGroup
                name="casescap"
                defaultValue={initialProps.yScaleCap ? String(initialProps.yScaleCap) : ''}
                value={yScaleCap ? String(yScaleCap) : ''}
                options={Object.keys(Y_SCALE_CAP_OPTIONS).map(value => ({
                  label: Y_SCALE_CAP_OPTIONS[value],
                  value
                }))}
                onChange={event => {
                  const yScaleCap = event.currentTarget.value;

                  setYScaleCap(yScaleCap ? +yScaleCap : false);
                }}
              />
            </div>
          </div>
        )}
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
