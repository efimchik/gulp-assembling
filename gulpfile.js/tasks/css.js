const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const concat = require('gulp-concat'); //concat all css files to one
const cssimport = require('gulp-cssimport'); //change @import css to css code
const prefixer = require('gulp-autoprefixer'); //add prefix to styles
const csso = require('gulp-csso'); //minify css
const rename = require('gulp-rename'); //rename files
const mediaqueries = require('gulp-group-css-media-queries'); //grouping of media queries

const size = require('gulp-size'); //Display the size of your files
// const shorthand = require('gulp-shorthand'); //changes css properties to their short record
const webpcss = require('gulp-webp-css'); //add alternative code for webp format to css file




//task
const css = () => {
    return src(path.css.src, {sourcemaps: app.isDev})
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'CSS',
                message: error.message
            }))
        }))
        .pipe(concat('main.css'))
        .pipe(cssimport())
        // .pipe(webpcss())
        .pipe(prefixer(app.autoprefixer))
        .pipe(mediaqueries())
        // .pipe(shorthand())

        .pipe(gulpif(app.isProd, size({title: 'main.css'})))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulpif(app.isProd, csso()))
        .pipe(gulpif(app.isProd, size({title: 'main.min.css'})))
        .pipe(dest(path.css.dest, {sourcemaps: app.isDev}))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyCss)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic + '/css')))
}


module.exports = css;