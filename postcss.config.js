module.exports = {
    sourceMap: true,
    plugins: [
        require('precss'),
        require('autoprefixer')({ browsers: ['last 5 versions', 'iOS >= 8'] }),
        require('postcss-discard-duplicates'),
    ]
}