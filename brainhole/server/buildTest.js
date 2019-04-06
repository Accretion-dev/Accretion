const ConcatPlugin = require('webpack-concat-plugin');

console.log('do build test')
new ConcatPlugin({
    uglify: false,
    sourceMap: false,
    name: 'finalTest',
    outputPath: '../',
    fileName: '[name].js',
    filesToConcat: ['debug-settings', 'index.js'],
    attributes: { async: true }
})
