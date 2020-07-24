import Scrollyteller from '@abcnews/scrollyteller';
import React, { memo, useCallback, useState } from 'react';
import { PRESETS } from '../../constants';
import { getInclusiveDateFromYYYYMMDD } from '../../utils';
import CasesGraphic from '../CasesGraphic';
import DoublingGraphic from '../DoublingGraphic';
import Placeholder from '../TestComponent';
import styles from './styles.css';

const App = ({ scrollyData, placesData }) => {
  const [preset, setPreset] = useState('initial');
  let maxDate = getInclusiveDateFromYYYYMMDD(scrollyData.panels.length ? scrollyData.panels[0].config.maxdate : '');

  const onMarker = useCallback(config => {
    const { preset } = config;

    setPreset(preset);
  }, []);

  let { graphic, ...graphicProps } = PRESETS[preset] || {};
  let Graphic = Placeholder;

  if (graphic === 'cases') {
    Graphic = CasesGraphic;
    graphicProps = {
      ...graphicProps,
      placesData,
      maxDate
    };
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
