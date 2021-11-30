const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const gulpif = require('gulp-if'); //conditionally control the flow of objects

const newer = require('gulp-newer'); //Minify only new image files
const webp = require('gulp-webp'); //Convert jpeg, jpg and png images to webp format

const imagemin = require('gulp-imagemin'); //Minify JPEG, GIF and SVG images
const pngquant = require('imagemin-pngquant'); //Minify PNG images




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
        .pipe(webp(app.webp))
        .pipe(dest(path.img.dest))

        .pipe(src(path.img.src))
        .pipe(newer(path.img.dest))
        .pipe(imagemin(
            [
                imagemin.mozjpeg({ quality: 75, progressive: true }),
                pngquant({ quality: [0.7, 0.8], speed: 5 }),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true}
                    ]
                })
            ],
            {
                verbose: true
            }
        ))
        .pipe(dest(path.img.dest))

        .pipe(gulpif(app.isProd, src(path.publicGit.copyImg)))
        .pipe(gulpif(app.isProd, dest(path.publicGit.pathPublic + '/img')))
}


module.exports = img;