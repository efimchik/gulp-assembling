const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const pug2html = require('gulp-pug'); //convert pug files to html

const webp2html = require('gulp-webp-html-nosvg');// Replace <img/> to <picture/> supports webp (no svg format)
const prettify = require('gulp-html-prettify');//formats the html final file





const pug = () => {
    return src(path.pug.src)
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'PUG',
                message: error.message
            }))
        }))
        .pipe(pug2html(app.pug))
        .pipe(webp2html())
        .pipe(gulpif(app.isDev, prettify(app.prettify)))
        .pipe(dest(path.pug.dest))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyHtml)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic)))
}


module.exports = pug;