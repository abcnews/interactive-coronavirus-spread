import Scrollyteller from '@abcnews/scrollyteller';
import React, { memo, useCallback, useState } from 'react';
import { PRESETS } from '../../constants';
import { getInclusiveDateFromYYYYMMDD } from '../../utils';
import CasesGraphic from '../CasesGraphic';
import DoublingGraphic from '../DoublingGraphic';
import Placeholder from '../TestComponent';
import styles from './styles.css';

const ONE_DAY = 864e5;
const DATE_USA_HIT_100_CASES = new Date(2020, 2, 4);

const App = ({ scrollyData }) => {
  const [preset, setPreset] = useState('initial');
  const onMarker = useCallback(config => {
    const { preset } = config;

    setPreset(preset);
  }, []);

  let { graphic, ...graphicProps } = PRESETS[preset] || {};
  let Graphic = Placeholder;

  if (graphic === 'cases') {
    Graphic = CasesGraphic;

    const maxDate = getInclusiveDateFromYYYYMMDD(scrollyData.panels.length ? scrollyData.panels[0].config.maxdate : '');

    if (maxDate) {
      graphicProps.toDate = maxDate;
      graphicProps.xScaleDaysCap = Math.max(30, Math.round((maxDate - DATE_USA_HIT_100_CASES) / ONE_DAY));
    }
  } else if (graphic === 'doubling') {
    Graphic = DoublingGraphic;
  }

  return (
    <Scrollyteller
      panels={scrollyData.panels}
      className={styles.scrolly}
      panelClassName={styles.scrollyPanel}
      firstPanelClassName={styles.firstScrollyPanel}
      config={{ waypoint: 45 }}
      onMarker={onMarker}
    >
      <div>{Graphic ? <Graphic preset={preset} {...graphicProps} /> : null}</div>
    </Scrollyteller>
  );
};

App.displayName = 'App';

export default App;
