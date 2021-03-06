import Scrollyteller from '@abcnews/scrollyteller';
import React, { memo, useCallback, useState } from 'react';
import { PRESETS } from '../../constants';
import { maxdateMixin } from '../../mount-utils';
import CasesGraphic from '../CasesGraphic';
import DoublingGraphic from '../DoublingGraphic';
import Placeholder from '../TestComponent';
import styles from './styles.css';

const App = ({ scrollyData }) => {
  const [preset, setPreset] = useState('initial');
  const onMarker = useCallback(data => {
    const { preset } = data;

    setPreset(preset);
  }, []);

  let { graphic, ...graphicProps } = PRESETS[preset] || {};
  let Graphic = Placeholder;

  if (graphic === 'cases') {
    Graphic = CasesGraphic;

    const maxdate = scrollyData.panels.length ? scrollyData.panels[0].data.maxdate : '';

    if (maxdate) {
      graphicProps = maxdateMixin(graphicProps, maxdate);
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
