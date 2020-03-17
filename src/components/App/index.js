import Scrollyteller from '@abcnews/scrollyteller';
import React, { memo, useCallback, useState } from 'react';
import { PRESETS } from '../../constants';
import CasesGraphic from '../CasesGraphic';
import DoublingGraphic from '../DoublingGraphic';
import styles from './styles.css';

export default ({ scrollyData, countryTotals }) => {
  const [preset, setPreset] = useState('initial');

  const onMarker = useCallback(config => {
    const { preset } = config;

    setPreset(preset);
  }, []);

  let { graphic, ...graphicProps } = PRESETS[preset] || {};
  let Graphic;

  if (graphic === 'cases') {
    Graphic = CasesGraphic;
    graphicProps.countryTotals = countryTotals;
  } else if (graphic === 'doubling') {
    Graphic = DoublingGraphic;
  }

  return (
    <Scrollyteller panels={scrollyData.panels} onMarker={onMarker}>
      <div>{Graphic ? <Graphic preset={preset} {...graphicProps} /> : null}</div>
    </Scrollyteller>
  );
};
