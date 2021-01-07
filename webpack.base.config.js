const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

const sassLoader = {
  loader: 'sass-loader',
  options: {
    implementation: require('sass'),
  },
};

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: { babelrc: true },
          },
          {
            loader: 'ts-loader',
            options: { appendTsSuffixTo: [/\.vue$/] },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[local]_[hash:base64:5]',
                  },
                },
              },
              sassLoader,
            ],
          },
          {
            use: ['style-loader', 'css-loader', sassLoader],
          },
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: 'url-loader?limit=100000',
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  devtool: 'source-map',
  performance: {
    hints: false,
  },
};

module.exports = { baseConfig };
