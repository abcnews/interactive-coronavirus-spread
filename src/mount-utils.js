import { getMountValue, selectMounts } from '@abcnews/mount-utils';
import * as acto from '@abcnews/alternating-case-to-object';
import { decode, encode } from '@abcnews/base-36-props';
import React from 'react';
import { render } from 'react-dom';
import InlineGraphic from './components/InlineGraphic';
import { PRESETS } from './constants';

// PACKAGE_JSON_VERSION will be replaced by current package.json version (see aunty.config.js)
export const encodeVersionedProps = props => encode({ version: PACKAGE_JSON_VERSION, ...props });

export const decodeVersionedProps = encoded => {
  let decoded = null;
  try {
    decoded = decode(encoded);
  } catch (err) {
    console.error(err);
  }
  return decoded;
};

export const updateLegacyProps = props => {
  if (props) {
    // Support legacy `xScaleType` (when "daysSince100Cases" was called "days")
    if (props.xScaleType === 'days') {
      props.xScaleType = 'daysSince100Cases';
    }

    // Support legacy `hasFootnotes` (renaming it to `hasCredits`)
    if (typeof props.hasFootnotes === 'boolean') {
      props.hasCredits = props.hasFootnotes;
      delete props.hasFootnotes;
    }
  }

  return props;
};

const ONE_DAY = 864e5;
const US_100_CASES = new Date(2020, 2, 4);
const MAX_DAYS_CAP = 30;

export const maxdateMixin = (props, maxdate) => {
  let [, yyyy, mm, dd] = String(maxdate).match(/(\d{4})(\d{2})(\d{2})/) || [];
  const formatted = `${yyyy}-${mm}-${dd}`;
  const inclusiveDate = new Date(`${formatted}T23:59`);

  return {
    ...props,
    toDate: formatted,
    xScaleDaysCap: Math.max(MAX_DAYS_CAP, Math.round((inclusiveDate - US_100_CASES) / ONE_DAY))
  };
};

const prepareMountAndResolveProps = (mountEl, props) => {
  const presetProp = props.encoded || props.preset;

  mountEl.className = 'u-pull';
  Object.keys(props).forEach(propName => {
    mountEl.dataset[propName] = props[propName];
  });

  // Look for longform encoded props elsewhere (assuming only a hint is currently used)
  if (props.encoded) {
    const [longformMountEl] = selectMounts(props.encoded);

    if (longformMountEl) {
      props.encoded = getMountValue(longformMountEl);
    }
  }

  let otherProps = updateLegacyProps(
    props.encoded ? decodeVersionedProps(props.encoded) : props.preset ? PRESETS[props.preset] : null
  );

  if (props.maxdate) {
    otherProps = maxdateMixin(otherProps, props.maxdate);
  }

  return [presetProp, otherProps];
};

export const renderInlineGraphics = (mountPrefix, Graphic) =>
  selectMounts(mountPrefix).map(mountEl => {
    const props = acto(getMountValue(mountEl, mountPrefix));
    const [presetProp, otherProps] = prepareMountAndResolveProps(mountEl, props);

    render(<InlineGraphic>{otherProps && <Graphic preset={presetProp} {...otherProps} />}</InlineGraphic>, mountEl);
  });
