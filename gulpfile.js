const { src, dest, watch, series, parallel } = require('gulp');
const log = require('fancy-log');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const browserSync = require('browser-sync').create();
const { spawn } = require('child_process');

// postcss plugins
const autoprefixer = require('autoprefixer');
const colorModFunction = require('postcss-color-mod-function');
const cssnano = require('cssnano');
const customProperties = require('postcss-custom-properties');
const easyImport = require('postcss-easy-import');

function swallowError(error) {
    log.error(error.toString());
    this.emit('end');
}

function css() {
    const processors = [
        easyImport,
        customProperties,
        colorModFunction(),
        autoprefixer(),
        cssnano()
    ];

    return src('assets/css/*.css')
        .on('error', swallowError)
        .pipe(sourcemaps.init())
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('assets/built/'))
        .pipe(browserSync.stream());
}

function jekyll() {
    // Run jekyll build --watch
    // We override destination to _site for local development
    const jekyll = spawn('bundle', ['exec', 'jekyll', 'build', '--watch', '--destination', '_site', '--incremental']);

    jekyll.stdout.on('data', (data) => {
        log('Jekyll: ' + data.toString().trim()); 
    });

    jekyll.stderr.on('data', (data) => {
        log.error('Jekyll Error: ' + data.toString().trim());
    });

    return jekyll; 
}

function serve() {
    browserSync.init({
        server: {
            baseDir: '_site'
        },
        files: ['_site/**/!(*.css)'] // Watch _site for changes to reload (excluding css as we stream it)
    });

    watch('assets/css/**', css);
}

function zipper() {
    const targetDir = 'dist/';
    const themeName = require('./package.json').name;
    const filename = themeName + '.zip';

    return src([
        '**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**',
        '!_site', '!_site/**'
    ])
        .pipe(zip(filename))
        .pipe(dest(targetDir));
}

exports.css = css;
exports.zip = series(css, zipper);
exports.default = series(css, parallel(jekyll, serve));
