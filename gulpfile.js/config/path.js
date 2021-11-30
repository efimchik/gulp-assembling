const pathSrc = './src';
const pathBuild = './build';

module.exports = {
    root: pathBuild,

    clean: {
        html: './*.html',
        css: './css',
        js: './js',
        img: './img',
        fonts: './fonts',
    },

    publicGit: {
        pathPublic: './',
        copyHtml: pathBuild + '/*.html',
        copyCss: pathBuild + '/css/*.css',
        copyJs: pathBuild + '/js/*.js',
        copyImg: pathBuild + '/img/**/*.*',
        copyFonts: pathBuild + '/fonts/**/*.*',
    },

    jsonConf: {
        src: pathSrc + '/json/сonfig.json',
    },

    html: {
        src: pathSrc + '/pages/html/*.html',
        watch: pathSrc + '/**/*.html',
        dest: pathBuild
    },

    pug: {
        src: pathSrc + '/pages/pug/*.pug',
        watch: pathSrc + '/**/*.pug',
        dest: pathBuild
    },

    css: {
        src: pathSrc + '/pages/css/*.css',
        watch: pathSrc + '/**/*.css',
        dest: pathBuild + '/css'
    },

    scss: {
        src: pathSrc + '/pages/scss/*.{sass,scss}',
        watch: pathSrc + '/**/*.{sass,scss}',
        dest: pathBuild + '/css'
    },

    stylus: {
        src: pathSrc + '/pages/styl/*.styl',
        watch: pathSrc + '/**/*.styl',
        dest: pathBuild + '/css'
    },

    script: {
        src: pathSrc + '/js/*.js',
        watch: pathSrc + '/**/*.js',
        dest: pathBuild + '/js'
    },

    img: {
        src: pathSrc + '/img/**/*.{png,jpg,jpeg,gif,svg}',
        watch: pathSrc + '/img/**/*.{png,jpg,jpeg,gif,svg}',
        dest: pathBuild + '/img/'
    },

    font: {
        src: pathSrc + '/fonts/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}',
        watch: pathSrc + '/fonts/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}',
        dest: pathBuild + '/fonts/'
    },

    copyCssLibs: {
        src: pathSrc + '/libs/css/**/*.css',
        watch: pathSrc + '/libs/css/**/*.css',
        dest: pathBuild + '/css/'
    },

    copyJsLibs: {
        src: pathSrc + '/libs/js/**/*.js',
        watch: pathSrc + '/libs/js/**/*.js',
        dest: pathBuild + '/js/'
    }
}