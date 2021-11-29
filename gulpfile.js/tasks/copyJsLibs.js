const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');

//Plugins
const newer = require('gulp-newer'); //Minify only new image files




//task
const copyJsLibs = () => {
    return src(path.copyJsLibs.src)
        .pipe(newer(path.copyJsLibs.dest))
        .pipe(dest(path.copyJsLibs.dest))
}

module.exports = copyJsLibs;