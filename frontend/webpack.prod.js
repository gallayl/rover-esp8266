/* eslint-disable @typescript-eslint/no-var-requires */
// const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// const { RelativeCiAgentWebpackPlugin } = require('@relative-ci/agent')
// const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      async: false,
      // useTypescriptIncrementalApi: true,
      // silent: process.argv.includes('--json'),
    }),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
      favicon: './favicon.ico',
      attributes: function(chunk) {
        return { charset: 'UTF-8' }
      },
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    // new CopyPlugin([
    //   { from: path.resolve(`${__dirname}/_redirects`), to: path.resolve(`${__dirname}/build`) },
    //   { from: path.resolve(`${__dirname}/web.config`), to: path.resolve(`${__dirname}/build`) },
    // ]),
    // new RelativeCiAgentWebpackPlugin({
    //   enabled: process.env.GITHUB_ACTIONS, // Run this only under GitHub Actions
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: true,
            },
          },
          'css-loader',
        ],
      },
    ],
  },
})
