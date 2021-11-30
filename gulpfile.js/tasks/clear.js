const del = require('del'); //delete build directory before start progect

//add config
const path = require('./../config/path.js');



const clear = () => {
    return del(
        [
            path.root,
            path.clean.html,
            path.clean.css,
            path.clean.js,
            path.clean.img,
            path.clean.fonts
        ]
    )
}

module.exports = clear;