const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const pug2html = require('gulp-pug'); //convert pug files to html





const pug = () => {
    return src(path.pug.src)
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'PUG',
                message: error.message
            }))
        }))
        .pipe(pug2html(app.pug))
        .pipe(dest(path.pug.dest))
}


module.exports = pug;