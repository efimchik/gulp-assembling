const {watch, series, parallel} = require('gulp');
const browserSync = require('browser-sync').create(); //server and reload

//add config
const path = require('./config/path.js');


//tasks
const clear = require('./tasks/clear');
const html = require('./tasks/html');
const pug = require('./tasks/pug');
const css = require('./tasks/css');
const scss = require('./tasks/scss');
const stylus = require('./tasks/stylus');


//server
const server = () => {
    browserSync.init({
        server: {
            baseDir: path.root
        }
    })
}


//watcher
const watcher = () => {
    watch(path.html.watch, html).on('all', browserSync.reload);
    watch(path.pug.watch, pug).on('all', browserSync.reload);

    watch(path.css.watch, css).on('all', browserSync.reload);
    watch(path.scss.watch, scss).on('all', browserSync.reload);
    watch(path.stylus.watch, stylus).on('all', browserSync.reload);
}


//export tascs
exports.html = html;
exports.pug = pug;
//styles
exports.css = css;
exports.scss = scss;
exports.stylus = stylus;


exports.dev = series(
    clear,
    parallel(html, pug, css, scss, stylus),
    parallel(watcher, server)
);
