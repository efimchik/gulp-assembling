const {src, dest} = require('gulp');

//add config
const path = require('./../config/path.js');

//Plugins
const newer = require('gulp-newer'); //Minify only new image files




//task
const copyCssLibs = () => {
    return src(path.copyCssLibs.src)
        .pipe(newer(path.copyCssLibs.dest))
        .pipe(dest(path.copyCssLibs.dest))
}

module.exports = copyCssLibs;