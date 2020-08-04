import { Checkbox } from '@atlaskit/checkbox';
import { RadioGroup } from '@atlaskit/radio';
import Textfield from '@atlaskit/textfield';
import React, { useMemo, useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { PLACES_DATA_URL, TRENDS } from '../../constants';
import { usePlacesData } from '../../data-loader';
import { decodeVersionedProps, encodeVersionedProps, updateLegacyProps } from '../../utils';
import CasesGraphic, {
  DEFAULT_CASES_CAP,
  DEFAULT_PROPS,
  UNDERLYING_PROPS_PATTERN,
  UNDERLYING_PROPS_FOR_X_SCALE_TYPES,
  X_SCALE_TYPES,
  Y_SCALE_TYPES,
  Y_SCALE_PROPS
} from '../CasesGraphic';
import InlineGraphic from '../InlineGraphic';
import styles from './styles.css';

const placeTypeBG = type =>
  type === 'aggregate'
    ? 'peachpuff'
    : type === 'other'
    ? 'thistle'
    : type === 'ship'
    ? 'paleturquoise'
    : type === 'region'
    ? 'lavender'
    : undefined;

const X_AXIS_TYPES_FOR_UNDERLYING_PROPS = {
  cases: 'daysSince100Cases',
  deaths: 'daysSince1Death',
  recoveries: 'daysSince1Recovery'
};
const SELECT_STYLES = {
  multiValueLabel: (provided, { data: { _type } }) => {
    return {
      ...provided,
      fontFamily: 'ABCSans',
      backgroundColor: placeTypeBG(_type)
    };
  },
  multiValueRemove: (provided, { data: { _type } }) => {
    return {
      ...provided,
      backgroundColor: placeTypeBG(_type)
    };
  }
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

export default () => {
  const initialProps = updateLegacyProps(decodeEncodedUrlParam() || DEFAULT_PROPS);

  const [placesDataURL, setPlacesDataURL] = useState(PLACES_DATA_URL);
  const [title, setTitle] = useState(initialProps.title);
  const [hasFootnotes, setHasFootnotes] = useState(initialProps.hasFootnotes);
  const [xScaleType, setXScaleType] = useState(initialProps.xScaleType);
  const [yScaleType, setYScaleType] = useState(initialProps.yScaleType);
  const [yScaleProp, setYScaleProp] = useState(initialProps.yScaleProp);
  const [xScaleDaysCap, setXScaleDaysCap] = useState(initialProps.xScaleDaysCap);
  const [yScaleCap, setYScaleCap] = useState(initialProps.yScaleCap);
  const [visiblePlaces, setVisiblePlaces] = useState(initialProps.places);
  const [highlightedPlaces, setHighlightedPlaces] = useState(initialProps.highlightedPlaces);
  const [fromDate, setFromDate] = useState(initialProps.fromDate || null);
  const [toDate, setToDate] = useState(initialProps.toDate || null);
  const [visibleTrends, setVisibleTrends] = useState(initialProps.trends);
  const [highlightedTrends, setHighlightedTrends] = useState([]);
  const [
    { isLoading: isExplorerPlacesDataLoading, error: explorerPlacesDataError, data: explorerPlacesData },
    setExplorerPlacesDataURL
  ] = usePlacesData(placesDataURL);

  const casesGraphicProps = {
    ...initialProps,
    placesDataURL,
    title,
    hasFootnotes,
    xScaleType,
    yScaleType,
    yScaleProp,
    yScaleCap,
    xScaleDaysCap,
    places: visiblePlaces,
    highlightedPlaces,
    fromDate,
    toDate,
    trends: visibleTrends,
    highlightedTrends
  };

  history.replaceState(casesGraphicProps, document.title, `?encoded=${encodeVersionedProps(casesGraphicProps)}`);

  const isDailyFigures = yScaleProp.indexOf('new') === 0;
  const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;
  const areTrendsAllowed = yScaleProp === 'cases' && xScaleType === 'daysSince100Cases';

  const xScaleTypeOptions = X_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScalePropOptions = Y_SCALE_PROPS.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const [placesSelectOptions, availableDates] = useMemo(() => {
    if (!explorerPlacesData) {
      return [[], null];
    }

    const placesSelectOptions = Object.keys(explorerPlacesData).map(place => ({
      label: place,
      value: place,
      _type: explorerPlacesData[place].type
    }));
    const availableDates = Object.keys(explorerPlacesData).reduce((memo, place) => {
      const dates = Object.keys(explorerPlacesData[place].dates);

      return dates.length > memo.length ? dates : memo;
    }, []);

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
          <CasesGraphic preset={Math.random()} {...casesGraphicProps} />
        </InlineGraphic>
      </div>
      <div className={styles.controls}>
        {/* <div key="places-data-url">
          <label>Places Data URL</label>
          <button
            onClick={() => {
              const query = Math.random();
              setVisiblePlaces([]);
              setHighlightedPlaces([]);
              setFromDate(null);
              setToDate(null);
              setPlacesDataURL(`${PLACES_DATA_URL}?${query}`);
              setExplorerPlacesDataURL(`${PLACES_DATA_URL}?${query}`);
            }}
          >
            Update to random
          </button>
        </div> */}
        <div key="title">
          <label>Chart Title</label>
          <Textfield name="title" value={title || ''} onChange={event => setTitle(event.currentTarget.value)} />
        </div>
        <div key="hasfootnotes">
          <label>Footnotes</label>
          <Checkbox
            name="hasfootnotes"
            label="Show data sources &amp; story link"
            value="Show data sources &amp; story link"
            isChecked={hasFootnotes}
            onChange={event => setHasFootnotes(event.target.checked)}
          />
        </div>
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

              // Remove date boxing, in case we later switch back to dates
              if (xScaleType !== 'dates') {
                setFromDate(null);
                setToDate(null);
              }
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
        {xScaleType === 'dates' && (
          <div key="dates">
            <label>X-axis (dates-based) Extents</label>
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
