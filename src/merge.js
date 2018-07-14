"use strict";

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    mapStream = require('map-stream'),
    fs = require('fs'),
    wait = require('gulp-wait'),
    Q = require('q');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var stripCssComments = require('gulp-strip-css-comments');
var path = require('path');

var util = require('./utils');
var log = require('fancy-log');
var configWrap = require('./config-wrap');
var plumber = require('gulp-plumber');
var handleErrors = require('./handle-errors');

function mergeCssByModule() {
    var env = util.getEnv();
    var modules = env.modules;

    var deferred = Q.defer();
    var asyncCount = modules.length;
    modules.forEach(function (m) {
        var dir = m.tmpPath;
        log('merge[css] module path:', dir);
        gulp.src([dir + '/*.css'])
            .pipe(concat(m.name + '.all.css'))
            .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name))
            .on('end', function () {
                asyncCount--;
                log('mergeCssByModule: ' + m.name + '.all.css');
                if (asyncCount <= 0) {
                    log('mergeCssByModule done');
                    deferred.resolve();
                }
            });
    });


    return deferred.promise;
}

function mergeModuleCss(m) {
    var dir = m.path;
    log('merge[css] module path:', dir);
    return gulp.src([dir + '/*.scss'], {base: configWrap.config.webappDir})
        .pipe(sass())
        // 去掉css注释
        .pipe(stripCssComments())
        // auto prefix
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(concat(m.name + '.all.css'))
        .pipe(mapStream(function (file, cb) {
            _deleteFileInTmp(file.path, m.name);
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name));
}


function mergeComponentsByModule() {
    var env = util.getEnv();
    var modules = env.modules;

    var deferred = Q.defer();
    var asyncCount = modules.length;
    modules.forEach(function (m) {
        var dir = m.path;
        log('merge[comp] module path:', dir);
        gulp.src([dir + '/**/*.component.js', '!' + dir + '/*.all.component.js'], {base: configWrap.config.webappDir})
            .pipe(concat(m.name + '.all.component.js'))
            .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name))
            .on('end', function () {
                asyncCount--;
                log('mergeComponentsByModule: ' + m.name + '.all.component.js');
                if (asyncCount <= 0) {
                    log('mergeComponentsByModule done');
                    deferred.resolve();
                }
            });
    });
    return deferred.promise;
}


function mergeModuleComponent(m) {
    var dir = m.path;
    log('merge[comp] module path:', dir);
    return gulp.src([dir + '/**/*.component.js'], {base: configWrap.config.webappDir})
        .pipe(plumber({errorHandler: handleErrors.reportError}))
        .pipe(wait(500))
        .pipe(concat(m.name + '.all.component.js'))
        .pipe(mapStream(function (file, cb) {
            _deleteFileInTmp(file.path, m.name);
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name));
}

function mergeServicesByModule() {
    var env = util.getEnv();
    var modules = env.modules;

    var deferred = Q.defer();
    var asyncCount = modules.length;
    modules.forEach(function (m) {
        var dir = m.path;
        log('merge[serv] module path:', dir);
        gulp.src([dir + '/**/*.service.js', '!' + dir + '/*.all.service.js'])
            .pipe(concat(m.name + '.all.service.js'))
            .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name))
            .on('end', function () {
                asyncCount--;
                log('mergeServicesByModule: ' + m.name + '.all.css');
                if (asyncCount <= 0) {
                    log('mergeServicesByModule done');
                    deferred.resolve();
                }
            });
    });
    return deferred.promise;
}


function mergeModuleService(m) {
    var dir = m.path;
    log('merge[serv] module path:', dir);
    return gulp.src([dir + '/**/*.service.js'], {base: configWrap.config.webappDir})
        .pipe(plumber({errorHandler: handleErrors.reportError}))
        .pipe(concat(m.name + '.all.service.js'))
        .pipe(mapStream(function (file, cb) {
            _deleteFileInTmp(file.path, m.name);
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'app/' + m.name));
}

function mergeAllStates() {

    return gulp.src(configWrap.config.tmp + 'app/**/*.state.js')
        .pipe(concat('app.all.state.js'))
        .pipe(mapStream(function (file, cb) {
            log('merge app state',file.path);
            if (fs.existsSync(file.path)) {
                log('mergeAllStates 删除旧文件：', file.path);
                fs.unlinkSync(file.path);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'app/'));
}


function mergeStatesByModule() {
    var env = util.getEnv();
    var modules = env.modules;
    var stateFiles = modules.map(function (m) {
        return m.path + "/**/*.state.js";
    });
    return gulp.src(stateFiles)
        .pipe(plumber({errorHandler: handleErrors.reportError}))
        .pipe(concat('app.all.state.js'))
        .pipe(mapStream(function (file, cb) {
            var appState = configWrap.config.tmp+'app/app.all.state.js';
            if (fs.existsSync(appState)) {
                log('mergeAllStates 删除旧文件：', appState);
                fs.unlinkSync(appState);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'app/'));
}

/**
 *
 * @param path 原始 path
 * @param name module name
 * @private
 */
function _deleteFileInTmp(_path, name) {
    var nPath = _path.split(path.sep).join('/').replace(configWrap.config.webappDir, configWrap.config.tmp + 'app/' + (name ? name + '/' : ''));
    if (fs.existsSync(nPath)) {
        log('merge 替换：', nPath);
        fs.unlinkSync(nPath);
    }else{
        log('无需替换');
    }
}

module.exports = {
    mergeCssByModule: mergeCssByModule,
    mergeModuleCss: mergeModuleCss,
    mergeComponentsByModule: mergeComponentsByModule,
    mergeModuleComponent: mergeModuleComponent,
    mergeServicesByModule: mergeServicesByModule,
    mergeModuleService: mergeModuleService,
    mergeAllStates: mergeAllStates,
    mergeStatesByModule: mergeStatesByModule
};
