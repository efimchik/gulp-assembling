const pathSrc = './src';
const pathBuild = './build';

module.exports = {
    root: pathBuild,

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
    }
}