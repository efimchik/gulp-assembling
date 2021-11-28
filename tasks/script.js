const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');
const app = require('./../config/app.js');

//Plugins
const plumber = require('gulp-plumber'); //compilation errors plugin
const notify = require('gulp-notify'); //generates pop-up messages

const babel = require('gulp-babel'); //javascript handling
const webpack = require('webpack-stream'); //concat javascript files




//task
const script = () => {
    return src(path.script.src, {sourcemaps: true})
        .pipe(plumber({
            errorHandler: notify.onError(error => ({
                title: 'JS',
                message: error.message
            }))
        }))
        .pipe(babel(app.babel))
        .pipe(webpack(app.webpack))
        .pipe(dest(path.script.dest, {sourcemaps: true}))
}


module.exports = script;