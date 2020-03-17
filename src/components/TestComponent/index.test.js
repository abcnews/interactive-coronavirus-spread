import React from 'react';
import renderer from 'react-test-renderer';

import TestComponent from '.';

describe('TestComponent', () => {
  test('It renders', () => {
    const component = renderer.create(<TestComponent />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
