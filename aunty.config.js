const fs = require('fs');
const path = require('path');
const { name, version } = require('./package.json');

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

    fs.writeFileSync(
      path.join(__dirname, 'redirect', 'index.js'),
      `window.location = String(window.location).replace(/${name}\\/[\\w\\d\\.]+\\//, '${name}/${version}/')`
    );

    return config;
  },
  deploy: [
    {
      to: '/www/res/sites/news-projects/<name>/<id>'
    },
    {
      from: 'redirect',
      to: '/www/res/sites/news-projects/<name>/latest'
    }
  ]
};
