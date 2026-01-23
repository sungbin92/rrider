const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: [options.entry],
    target: 'node',
    externals: [
      nodeExternals({
        importType: 'module',
      }),
    ],
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'main.js',
      chunkFormat: 'module',
      library: {
        type: 'module',
      },
    },
  };
};
