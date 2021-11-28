const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const imagemin = require('gulp-imagemin'); //Minify PNG, JPEG, GIF and SVG images
const newer = require('gulp-newer'); //Minify only new image files
const webp = require('gulp-webp'); //Convert jpeg, jpg and png images to webp format




//task
const img = () => {
    return src(path.img.src)
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'IMG',
                message: error.message
            }))
        }))
        .pipe(newer(path.img.dest))
        .pipe(webp())
        .pipe(dest(path.img.dest))

        .pipe(src(path.img.src))
        .pipe(newer(path.img.dest))
        .pipe(imagemin(app.imagemin))
        .pipe(dest(path.img.dest))
}


module.exports = img;