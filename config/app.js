const fs = require('fs'); //parser json

module.exports = {
    htmlmin: {
        collapseWhitespace: true
    },

    pug: {
        pretty: true,
        locals: {
            meta: JSON.parse(fs.readFileSync('./src/json/сonfig.json', 'utf8'))
        }
    },

    autoprefixer: {
        overrideBrowserslist: ['last 3 versions'],
        cascade: true
    },

    babel: {
        presets: [
            '@babel/preset-env'
        ]
    },

    webpack: {
        mode: 'production'
    }
}