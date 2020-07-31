import {
  ensureBlockMount,
  exactMountSelector,
  getMountValue,
  getTrailingMountValue,
  prefixedMountSelector
} from '@abcnews/mount-utils';
import * as acto from '@abcnews/alternating-case-to-object';
import { decode, encode } from '@abcnews/base-36-props';
import React from 'react';
import { render } from 'react-dom';
import InlineGraphic from './components/InlineGraphic';
import { PRESETS } from './constants';

export const encodeVersionedProps = props => encode({ version: process.env.npm_package_version, ...props });

export const decodeVersionedProps = encoded => {
  let decoded = null;
  try {
    decoded = decode(encoded);
  } catch (err) {
    console.error(err);
  }
  return decoded;
};

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};

export const updateLegacyProps = props => {
  // Support legacy configs (when the "daysSince100Cases" xScaleType was called "days")
  if (props && props.xScaleType === 'days') {
    props.xScaleType = 'daysSince100Cases';
  }

  return props;
};

const prepareMountAndResolveProps = (mountEl, props) => {
  const presetProp = props.encoded || props.preset;

  mountEl.className = 'u-pull';
  Object.keys(props).forEach(propName => {
    mountEl.dataset[propName] = props[propName];
  });

  // Look for longform encoded props elsewhere (assuming only a hint is currently used)
  if (props.encoded) {
    const longformMountEl = document.querySelector(prefixedMountSelector(props.encoded));

    if (longformMountEl) {
      props.encoded = getMountValue(longformMountEl);
    }
  }

  const otherProps = updateLegacyProps(
    props.encoded ? decodeVersionedProps(props.encoded) : props.preset ? PRESETS[props.preset] : null
  );

  return [presetProp, otherProps];
};

export const renderInlineGraphics = (mountPrefix, Graphic) =>
  [...document.querySelectorAll(prefixedMountSelector(mountPrefix))].map(ensureBlockMount).map(mountEl => {
    const props = acto(getTrailingMountValue(mountEl, mountPrefix));
    const [presetProp, otherProps] = prepareMountAndResolveProps(mountEl, props);

    render(
      <InlineGraphic>
        {otherProps && (
          <Graphic preset={presetProp} maxDate={getInclusiveDateFromYYYYMMDD(props.maxdate)} {...otherProps} />
        )}
      </InlineGraphic>,
      mountEl
    );
  });
