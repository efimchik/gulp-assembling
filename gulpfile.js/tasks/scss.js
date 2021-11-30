const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const sass = require('gulp-sass')(require('sass')); //compilation scss to css plugin
const prefixer = require('gulp-autoprefixer'); //add prefix to styles
const csso = require('gulp-csso'); //minify css
const rename = require('gulp-rename'); //rename files
const mediaqueries = require('gulp-group-css-media-queries'); //grouping of media queries
const webpcss = require('gulp-webp-css'); //add alternative code for webp format to css file





//task
const scss = () => {
    return src(path.scss.src, {sourcemaps: app.isDev})
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'SCSS',
                message: error.message
            }))
        }))
        .pipe(sass())
        // .pipe(webpcss())
        .pipe(prefixer(app.autoprefixer))
        .pipe(mediaqueries())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulpif(app.isProd, csso()))
        .pipe(dest(path.scss.dest, {sourcemaps: app.isDev}))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyCss)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic + '/css')))
}


module.exports = scss;