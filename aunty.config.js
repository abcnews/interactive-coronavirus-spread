const ADDITIONAL_ENTRY_POINTS = [
  'standalone-cases-graphic',
  'cases-graphic-explorer',
  'standalone-testing-graphic',
  'testing-graphic-explorer'
];

module.exports = {
  serve: {
    hot: false
  },
  webpack: config => {
    config.devtool = 'source-map';

    ADDITIONAL_ENTRY_POINTS.forEach(name => {
      config.entry[name] = [config.entry.index[0].replace('index.js', `${name}.js`)];
    });

    return config;
  }
};
