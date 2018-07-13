"use strict";

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var stripCssComments = require('gulp-strip-css-comments');
var plumber = require('gulp-plumber');
var handleErrors = require('./handle-errors');
var utils = require('./utils');
var log = require('fancy-log');
var configWrap = require('./config');

/**
 *  根据目录，编译目录下所有scss文件
 */
function buildStylesByFolders() {
    var env = utils.getEnv();
    var folders = env.modules
        .map(function (m) {
            return m.path + '/*.scss';
        });
    log(folders);

    return gulp.src(folders, {base: './src/main/webapp'})
        .pipe(plumber({errorHandler: handleErrors.reportError}))
        .pipe(sass())
        // 去掉css注释
        .pipe(stripCssComments())
        // auto prefix
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(gulp.dest(configWrap.config.tmp));

}


module.exports = {
    buildStylesByFolders: buildStylesByFolders
};
