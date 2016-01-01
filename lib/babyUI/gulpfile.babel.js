'use strict';

import gulp from 'gulp';
import templateCache from 'gulp-angular-templatecache';
import sass from 'gulp-sass';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';
import autoprefixer from 'gulp-autoprefixer';
import bowerFiles from 'main-bower-files';
import inject from 'gulp-inject';
import es from 'event-stream';
import gulpFilter from 'gulp-filter';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import babelify from 'babelify';

const dirs = {
  src: 'app',
  dest: 'dist'
};

const paths = {
  sassSrc: `${dirs.src}/**/*.scss`,
  sassDest: `${dirs.dest}/styles/`,
  scriptSrc: `${dirs.src}/src/index.js`,
  scriptDest: `${dirs.dest}/scripts/`,
  templateSrc: `${dirs.src}/src/**/*.html`
};

var cssFiles = gulp.src(paths.sassSrc)
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(concat('main.css'))
    .pipe(sourcemaps.write(`./maps`))
    .pipe(gulp.dest(paths.sassDest));

var es6Files = browserify({entries: paths.scriptSrc,debug: true})
    .transform(babelify)
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest(paths.scriptDest));

var jsFiles = gulp.src(paths.scriptSrc)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(paths.scriptDest));


var filterJS = gulpFilter('**/*.js', { restore: true });
var filterCSS = gulpFilter('**/*.{css,scss}', { restore: true });
var filterFont = gulpFilter('**/*.{eot,svg,ttf,woff,woff2}', { restore: true });

var vendorFiles = gulp.src(bowerFiles())
    .pipe(filterJS)
    .pipe(concat("vendor.js"))
    .pipe(filterJS.restore)
    .pipe(gulp.dest('./dist/lib'))
    .pipe(filterCSS)
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(concat("vendor.css"))
    .pipe(filterCSS.restore)
    .pipe(gulp.dest('./dist/lib'))

var fontFiles = gulp.src(bowerFiles())
    .pipe(filterFont)
    .pipe(gulp.dest('./dist/fonts'))

gulp.task('styles', () => {
  return cssFiles
});

gulp.task('fonts', () => {
  return fontFiles
});


gulp.task('template', function () {
  return gulp.src(paths.templateSrc)
    .pipe(gulp.dest('./dist'));
});

gulp.task('styles:watch', () => {
  gulp.watch(paths.sassSrc, ['styles']);
});

gulp.task('scripts', () => {
  return jsFiles
});

gulp.task('scripts:watch', () => {
  gulp.watch(paths.scriptSrc, ['scripts']);
});

gulp.task('inject',()=>{
  gulp.src('./app/index.html')
    .pipe(inject(vendorFiles,{name: 'bower','addRootSlash':false,ignorePath:'dist'}))
    .pipe(inject(es.merge(
      cssFiles,
      es6Files 
    ),{'addRootSlash':false,ignorePath:'dist'}))
    .pipe(gulp.dest('./dist'))
})


gulp.task('default', ['inject','template','fonts'])
