const del = require('del'); //delete build directory before start progect

//add config
const path = require('./../config/path.js');



const clear = () => {
    return del(path.root)
}

module.exports = clear;