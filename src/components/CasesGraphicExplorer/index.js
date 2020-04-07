import { RadioGroup } from '@atlaskit/radio';
import React, { useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import CasesGraphic, { DEFAULT_PROPS, X_SCALE_TYPES, Y_SCALE_TYPES } from '../CasesGraphic';
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
const animatedComponents = makeAnimated();
const optionsValues = options => options.map(option => option.value);

export default ({ countryTotals }) => {
  const [xScaleType, setXScaleType] = useState(DEFAULT_PROPS.xScaleType);
  const [yScaleType, setYScaleType] = useState(DEFAULT_PROPS.yScaleType);
  const [visibleCountries, setVisibleCountries] = useState(DEFAULT_PROPS.countries);
  const [highlightedCountries, setHighlightedCountries] = useState(DEFAULT_PROPS.highlightedCountries);

  const casesGraphicProps = {
    ...DEFAULT_PROPS,
    xScaleType,
    yScaleType,
    countries: visibleCountries,
    highlightedCountries
  };

  const countries = Object.keys(countryTotals);
  const countriesSelectOptions = countries.map(country => ({ label: country, value: country }));
  const xScaleTypeOptions = X_SCALE_TYPES.map(type => ({ name: 'xscale', label: RADIO_LABELS[type], value: type }));
  const yScaleTypeOptions = Y_SCALE_TYPES.map(type => ({ name: 'yscale', label: RADIO_LABELS[type], value: type }));

  return (
    <div className={styles.root}>
      <div className={styles.graphic}>
        <InlineGraphic>
          <CasesGraphic preset={Math.random()} countryTotals={countryTotals} {...casesGraphicProps} />
        </InlineGraphic>
      </div>
      <div className={styles.controls}>
        <h2>Controls</h2>
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
        <label>X-axis Scale</label>
        <RadioGroup
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
        <label>Y-axis Scale</label>
        <RadioGroup
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
