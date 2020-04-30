// import { Checkbox } from '@atlaskit/checkbox';
import { RadioGroup } from '@atlaskit/radio';
import React, { useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { TRENDS } from '../../constants';
import { decodeVersionedProps, encodeVersionedProps } from '../../utils';
import CasesGraphic, {
  DEFAULT_CASES_CAP,
  DEFAULT_PROPS,
  X_SCALE_TYPES,
  Y_SCALE_TYPES,
  Y_SCALE_PROPS
} from '../CasesGraphic';
import InlineGraphic from '../InlineGraphic';
import styles from './styles.css';

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
  days: 'Days since 100th case',
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
  const initialProps = decodeEncodedUrlParam() || DEFAULT_PROPS;

  const [xScaleType, setXScaleType] = useState(initialProps.xScaleType);
  const [yScaleType, setYScaleType] = useState(initialProps.yScaleType);
  const [yScaleProp, setYScaleProp] = useState(initialProps.yScaleProp);
  const [xScaleDaysCap, setXScaleDaysCap] = useState(initialProps.xScaleDaysCap);
  const [yScaleCap, setYScaleCap] = useState(initialProps.yScaleCap);
  const [visiblePlaces, setVisiblePlaces] = useState(initialProps.places);
  const [highlightedPlaces, setHighlightedPlaces] = useState(initialProps.highlightedPlaces);
  const [visibleTrends, setVisibleTrends] = useState(initialProps.trends);
  const [highlightedTrends, setHighlightedTrends] = useState([]);

  const casesGraphicProps = {
    ...initialProps,
    xScaleType,
    yScaleType,
    yScaleProp,
    yScaleCap,
    xScaleDaysCap,
    places: visiblePlaces,
    highlightedPlaces,
    trends: visibleTrends,
    highlightedTrends
  };

  history.replaceState(casesGraphicProps, document.title, `?encoded=${encodeVersionedProps(casesGraphicProps)}`);

  const isDailyFigures = yScaleProp.indexOf('new') === 0;
  const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;
  const areTrendsAllowed = yScaleProp === 'cases' && xScaleType === 'days';

  const xScaleTypeOptions = X_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScalePropOptions = Y_SCALE_PROPS.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const placesSelectOptions = Object.keys(placesData).map(place => ({ label: place, value: place }));
  const trendsSelectOptions = TRENDS.map(({ name, doublingTimePeriods }) => ({
    label: `Every ${name}`,
    value: doublingTimePeriods
  }));

  const casesGraphicPropsJSON = JSON.stringify(casesGraphicProps, 2, 2);
  const encodedCasesGraphicProps = encodeVersionedProps(casesGraphicProps);
  const encodedMarkerText = `#casesgraphicENCODED${encodedCasesGraphicProps}`;

  return (
    <div className={styles.root}>
      <div className={styles.graphic}>
        <InlineGraphic>
          <CasesGraphic preset={Math.random()} placesData={placesData} {...casesGraphicProps} />
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
        {areTrendsAllowed && (
          <div key="highlightedtrends">
            <label>
              Highlighted Trends{' '}
              <button
                onClick={() => setHighlightedTrends(Array.from(new Set(visibleTrends.concat(highlightedTrends))))}
                disabled={visibleTrends.sort().join() === highlightedTrends.sort().join()}
              >
                Highlight all visible trends
              </button>
            </label>
            <Select
              components={animatedComponents}
              styles={SELECT_STYLES}
              isMulti
              options={trendsSelectOptions}
              value={trendsSelectOptions.filter(option => highlightedTrends.indexOf(option.value) > -1)}
              onChange={selectedOptions => {
                const nextHighlightedTrends = optionsValues(selectedOptions || []);

                setVisibleTrends(Array.from(new Set(visibleTrends.concat(nextHighlightedTrends))));
                setHighlightedTrends(nextHighlightedTrends);
              }}
            />
          </div>
        )}
        {areTrendsAllowed && (
          <div key="visibletrends">
            <label>Visible Trends</label>
            <Select
              components={animatedComponents}
              styles={SELECT_STYLES}
              defaultValue={trendsSelectOptions.filter(option => initialProps.trends.indexOf(option.value) > -1)}
              value={trendsSelectOptions.filter(option => visibleTrends.indexOf(option.value) > -1)}
              isMulti
              options={trendsSelectOptions}
              onChange={selectedOptions => {
                const nextVisibleTrends = optionsValues(selectedOptions || []);

                setVisibleTrends(nextVisibleTrends);
                setHighlightedTrends(highlightedTrends.filter(trend => nextVisibleTrends.indexOf(trend) > -1));
              }}
            />
          </div>
        )}

        <div key="xscaletype">
          <label>X-axis Scale</label>
          <div className={styles.flexRow}>
            <RadioGroup
              name="xscaletype"
              defaultValue={initialProps.xScaleType}
              value={xScaleType}
              options={xScaleTypeOptions}
              onChange={event => {
                const xScaleType = event.currentTarget.value;

                setXScaleType(xScaleType);

                if (xScaleType === 'dates') {
                  setYScaleType('linear');
                }
              }}
            />
          </div>
        </div>
        {xScaleType === 'days' && (
          <div key="dayscap">
            <label>X-axis (days) Cap</label>
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

              if (yScaleType === 'logarithmic' && isDailyFigures) {
                setXScaleType('days');
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

                if (yScaleType === 'logarithmic' && yScaleProp.indexOf('new') === -1) {
                  setXScaleType('days');
                }
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
            <button onClick={() => navigator.clipboard.writeText(casesGraphicPropsJSON)}>Copy to clipboard</button>
          </summary>
          <pre>{casesGraphicPropsJSON}</pre>
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
