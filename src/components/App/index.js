import Scrollyteller from '@abcnews/scrollyteller';
import React, { useCallback, useState } from 'react';
import styles from './styles.scss';

export default ({ scrollyData, countryTotals }) => {
  const [booms, setBooms] = useState(0);

  console.debug(countryTotals);

  const onMarker = useCallback(config => {
    const { booms } = config;

    setBooms(booms);
  }, []);

  return (
    <Scrollyteller panels={scrollyData.panels} onMarker={onMarker}>
      <div>{booms || 'no booms'}</div>
    </Scrollyteller>
  );
};
