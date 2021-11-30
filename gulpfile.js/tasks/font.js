const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const newer = require('gulp-newer'); //Minify only new image files
//const fonter = require('gulp-fonter'); //Convertation fonts (Windows)
const fonter = require('gulp-fonter-unx'); //Convertation fonts (Mac)
const ttf2woff2 = require('gulp-ttf2woff2'); //Convertation ttf fonts to woff2 fonts




//task
const font = () => {
    return src(path.font.src)
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'FONT',
                message: error.message
            }))
        }))
        .pipe(newer(path.font.dest))
        .pipe(fonter(app.fonter))
        .pipe(dest(path.font.dest))

        .pipe(ttf2woff2())
        .pipe(dest(path.font.dest))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyFonts)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic + '/fonts')))
}


module.exports = font;