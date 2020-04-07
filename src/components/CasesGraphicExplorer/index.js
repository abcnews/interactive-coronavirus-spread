// import { Checkbox } from '@atlaskit/checkbox';
import { RadioGroup } from '@atlaskit/radio';
import React, { useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { TRENDS } from '../../constants';
import CasesGraphic, { DEFAULT_CASES_CAP, DEFAULT_PROPS, X_SCALE_TYPES, Y_SCALE_TYPES } from '../CasesGraphic';
import InlineGraphic from '../InlineGraphic';
import styles from './styles.css';

const SELECT_STYLES = {
  multiValueLabel: (provided, state) => ({
    ...provided,
    fontFamily: 'ABCSans'
  })
};
const RADIO_LABELS = {
  dates: 'Date',
  days: 'Days since 100th case',
  linear: 'Linear (0-?)',
  logarithmic: 'Logarithmic (100-?)'
};
const CASES_CAP_OPTIONS = {
  '1000': '1k',
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

export default ({ countryTotals }) => {
  const [xScaleType, setXScaleType] = useState(DEFAULT_PROPS.xScaleType);
  const [yScaleType, setYScaleType] = useState(DEFAULT_PROPS.yScaleType);
  const [visibleCountries, setVisibleCountries] = useState(DEFAULT_PROPS.countries);
  const [highlightedCountries, setHighlightedCountries] = useState(DEFAULT_PROPS.highlightedCountries);
  const [visibleTrends, setVisibleTrends] = useState(DEFAULT_PROPS.trends);
  const [highlightedTrends, setHighlightedTrends] = useState([]);
  const [casesCap, setCasesCap] = useState(DEFAULT_PROPS.casesCap);
  const [daysCap, setDaysCap] = useState(DEFAULT_PROPS.daysCap);

  const casesGraphicProps = {
    ...DEFAULT_PROPS,
    xScaleType,
    yScaleType,
    casesCap,
    daysCap,
    countries: visibleCountries,
    highlightedCountries,
    trends: visibleTrends,
    highlightedTrends
  };

  const xScaleTypeOptions = X_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ label: RADIO_LABELS[type], value: type }));
  const countriesSelectOptions = Object.keys(countryTotals).map(country => ({ label: country, value: country }));
  const trendsSelectOptions = TRENDS.map(({ name, doublingTimePeriods }) => ({
    label: `Every ${name}`,
    value: doublingTimePeriods
  }));

  return (
    <div className={styles.root}>
      <div className={styles.graphic}>
        <InlineGraphic>
          <CasesGraphic preset={Math.random()} countryTotals={countryTotals} {...casesGraphicProps} />
        </InlineGraphic>
      </div>
      <div className={styles.controls}>
        <label>
          Highlighted Countries{' '}
          <button
            onClick={() => setHighlightedCountries(Array.from(new Set(visibleCountries.concat(highlightedCountries))))}
            disabled={visibleCountries.sort().join() === highlightedCountries.sort().join()}
          >
            Highlight all visible countries
          </button>
        </label>
        <Select
          components={animatedComponents}
          styles={SELECT_STYLES}
          defaultValue={countriesSelectOptions.filter(
            option => DEFAULT_PROPS.highlightedCountries.indexOf(option.value) > -1
          )}
          isMulti
          options={countriesSelectOptions}
          value={countriesSelectOptions.filter(option => highlightedCountries.indexOf(option.value) > -1)}
          onChange={selectedOptions => {
            const nextHighlightedCountries = optionsValues(selectedOptions || []);

            setVisibleCountries(Array.from(new Set(visibleCountries.concat(nextHighlightedCountries))));
            setHighlightedCountries(nextHighlightedCountries);
          }}
        />
        <label>Visible Countries</label>
        <Select
          components={animatedComponents}
          styles={SELECT_STYLES}
          defaultValue={countriesSelectOptions.filter(option => DEFAULT_PROPS.countries.indexOf(option.value) > -1)}
          value={countriesSelectOptions.filter(option => visibleCountries.indexOf(option.value) > -1)}
          isMulti
          options={countriesSelectOptions}
          onChange={selectedOptions => {
            const nextVisibleCountries = optionsValues(selectedOptions || []);

            setVisibleCountries(nextVisibleCountries);
            setHighlightedCountries(highlightedCountries.filter(country => nextVisibleCountries.indexOf(country) > -1));
          }}
        />
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
        <label>Visible Trends</label>
        <Select
          components={animatedComponents}
          styles={SELECT_STYLES}
          defaultValue={trendsSelectOptions.filter(option => DEFAULT_PROPS.trends.indexOf(option.value) > -1)}
          value={trendsSelectOptions.filter(option => visibleTrends.indexOf(option.value) > -1)}
          isMulti
          options={trendsSelectOptions}
          onChange={selectedOptions => {
            const nextVisibleTrends = optionsValues(selectedOptions || []);

            setVisibleTrends(nextVisibleTrends);
            setHighlightedTrends(highlightedTrends.filter(trend => nextVisibleTrends.indexOf(trend) > -1));
          }}
        />
        <label>X-axis Scale</label>
        <RadioGroup
          name="xscaletype"
          defaultValue={DEFAULT_PROPS.xScaleType}
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
        <label>X-axis (days) Cap</label>
        <RadioGroup
          name="dayscap"
          defaultValue={DEFAULT_PROPS.daysCap ? String(DEFAULT_PROPS.daysCap) : ''}
          value={daysCap ? String(daysCap) : ''}
          options={Object.keys(DAYS_CAP_OPTIONS).map(value => ({
            label: DAYS_CAP_OPTIONS[value],
            value
          }))}
          onChange={event => {
            const daysCap = event.currentTarget.value;

            setDaysCap(daysCap ? +daysCap : false);
          }}
        />
        <label>Y-axis Scale</label>
        <RadioGroup
          name="yscaletype"
          defaultValue={DEFAULT_PROPS.yScaleType}
          value={yScaleType}
          options={yScaleTypeOptions}
          onChange={event => {
            const yScaleType = event.currentTarget.value;

            setYScaleType(yScaleType);

            if (yScaleType === 'logarithmic') {
              setXScaleType('days');
            }
          }}
        />
        <label>Y-axis Cap</label>
        <RadioGroup
          name="casescap"
          defaultValue={DEFAULT_PROPS.casesCap ? String(DEFAULT_PROPS.casesCap) : ''}
          value={casesCap ? String(casesCap) : ''}
          options={Object.keys(CASES_CAP_OPTIONS).map(value => ({
            label: CASES_CAP_OPTIONS[value],
            value
          }))}
          onChange={event => {
            const casesCap = event.currentTarget.value;

            setCasesCap(casesCap ? +casesCap : false);
          }}
        />
        <hr />
        <details>
          <summary>
            Preset Code
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(casesGraphicProps, 2, 2))}>
              Copy to clipboard
            </button>
          </summary>
          <pre>{JSON.stringify(casesGraphicProps, 2, 2)}</pre>
        </details>
      </div>
    </div>
  );
};
