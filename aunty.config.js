module.exports = {
  serve: {
    hot: false
  },
  webpack: config => {
    config.entry['standalone-cases-graphic'] = [
      config.entry.index[0].replace('index.js', 'standalone-cases-graphic.js')
    ];
    config.devtool = 'source-map';
    return config;
  }
};
