const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const htmlinclude = require('gulp-file-include');  //plugin for file includes
const htmlmin = require('gulp-htmlmin'); //plugin to minify HTML

const webp2html = require('gulp-webp-html');




const html = () => {
    return src(path.html.src)
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'HTML',
                message: error.message
            }))
        }))
        .pipe(htmlinclude())
        .pipe(webp2html())
        .pipe(gulpif(app.isProd, htmlmin(app.htmlmin)))
        .pipe(dest(path.html.dest))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyHtml)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic)))
}

module.exports = html;