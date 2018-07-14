'use strict';

var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    Q = require('q'),
    fs = require('fs'),
    injectString = require('gulp-inject-string');

var rename = require("gulp-rename");

var mapStream = require('map-stream');
var prettify = require('gulp-html-prettify');
var log = require('fancy-log');
var path = require('path');

var handleErrors = require('./handle-errors');
var util = require('./utils');

var configWrap = require('./config-wrap');

module.exports = {
    states: states,
    index: index,
    homeModule: homeModule

};

// 根据 config 配置的 项目， 动态注入 第三方组件到index 中

function index() {

    var env = util.getEnv();
    var pages = env.modules.map(function (m) {
        return m.name;
    });
    var coreConf = require('./project-common');
    var pomVer = util.parseVersion();
    // 先 common
    // 再 project js
    // 接着 version
    // 最后 app.xxx.js
    var deffered = Q.defer();
    var packageTime = '当前版本号：' + pomVer + ' 打包时间：' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    var packedPages = pages
        .filter(function (p) {
            return coreConf.commonModules.indexOf(p) === -1;
        });
    // packedPages.push('index');
    // var modulesCount = packedPages.length;
    var modulesCount = packedPages.length + 1;
    packedPages
        .forEach(function (page) {
            // 各个模块单独生成 html
            gulp.src(configWrap.config.webappDir + '/template/index.html')
                .pipe(plumber({ errorHandler: handleErrors }))
                .pipe(mapStream(function (file, cb) {
                    var html = file.contents.toString();
                    // 核心组件
                    var allJs = [].concat(coreConf.coreJs);
                    var allCss = [].concat(coreConf.coreCss);
                    // if (page !== 'index') {
                    var pageConf = require(configWrap.config.gulpDir+'project-' + page);
                    allJs = allJs.concat(pageConf.venderJs);
                    allCss = allCss.concat(pageConf.venderCss);
                    // }
                    var jsList = allJs
                        .map(function (js) {
                            return '<script src="' + js + '" type="text/javascript"></script>';
                        }).join('\r\n');
                    var cssList = allCss
                        .map(function (css) {
                            return '<link rel="stylesheet" href="' + css + '">';
                        }).join('\r\n');

                    html = html.replace('<!-- inject:css:here -->', cssList);
                    html = html.replace('<!-- inject:js:here -->', jsList);
                    file.contents = new Buffer(html, 'utf-8');
                    var dFile = file.path.split(path.sep).join('/')
                        .replace(configWrap.config.webappDir + 'template/', configWrap.config.tmp)
                        .replace('index.html', page + '.html');
                    log('packedPages',packageTime, dFile);
                    if (fs.existsSync(dFile)) {
                        log('删除旧文件', dFile);
                        fs.unlinkSync(dFile);
                    }
                    cb(null, file);
                }))
                .pipe(injectString.replace('--package-time-inject-here--', packageTime))
                .pipe(prettify({ indent_char: ' ', indent_size: 2 }))
                .pipe(rename(page + '.html'))
                .pipe(gulp.dest(configWrap.config.tmp))
                .on('end', function () {
                    modulesCount--;
                    if (modulesCount <= 0) {
                        deffered.resolve();
                    }
                });
        });
    
        // TODO 应当避免使用 兼容旧的模式，生成所有依赖到index 
    gulp.src(configWrap.config.webappDir + '/template/index.html')
        .pipe(plumber({ errorHandler: handleErrors }))
        .pipe(mapStream(function (file, cb) {
            var html = file.contents.toString();
            // 核心组件
            var allJs = [].concat(coreConf.coreJs);
            var allCss = [].concat(coreConf.coreCss);
            pages.forEach(function (page) {
                if (coreConf.commonModules.indexOf(page) > -1) {
                    log('index index 系统模块', page);
                }
                var pageConf = require((coreConf.commonModules.indexOf(page) > -1 ? './' : configWrap.config.gulpDir) + 'project-' + page);
                allJs = allJs.concat(pageConf.venderJs);
                // allCss = allCss.concat(pageConf.venderCss);
            });
            allJs = allJs.reduce(function (r, js) {
                if (r.indexOf(js) > -1) {
                    log('存在重复js，去重', js);
                } else {
                    r.push(js);
                }
                return r;
            }, []);
            allCss = allCss.reduce(function (r, css) {
                if (r.indexOf(css) > -1) {
                    log('存在重复css，去重', css);
                } else {
                    r.push(css);
                }
                return r;
            }, []);
            var jsList = allJs
                .map(function (js) {
                    return '<script src="' + js + '" type="text/javascript"></script>';
                }).join('\r\n');
            var cssList = allCss
                .map(function (css) {
                    return '<link rel="stylesheet" href="' + css + '">';
                }).join('\r\n');

            html = html.replace('<!-- inject:css:here -->', cssList);
            html = html.replace('<!-- inject:js:here -->', jsList);
            file.contents = new Buffer(html, 'utf-8');
            var dFile = file.path.split(path.sep).join('/').replace(configWrap.config.webappDir + 'template/', configWrap.config.tmp);
            log(packageTime, dFile);
            if (fs.existsSync(dFile)) {
                log('删除旧文件', dFile);
                fs.unlinkSync(dFile);
            }
            cb(null, file);
        }))
        .pipe(injectString.replace('--package-time-inject-here--', packageTime))
        .pipe(prettify({ indent_char: ' ', indent_size: 2 }))
        .pipe(gulp.dest(configWrap.config.tmp))
        .on('end', function () {
            modulesCount--;
            if (modulesCount <= 0) {
                deffered.resolve();
            }
        });

    return deffered.promise;
}


function homeModule() {
    var env = util.getEnv();
    var modules = env.modules;
    var modulesString = modules.map(function (m) {
        return m.name;
    }).join('\',\'');
    return gulp.src(configWrap.config.webappDir + 'app/home/home.controller.js', { base: configWrap.config.webappDir })
        .pipe(mapStream(function (file, cb) {
            var state = file.contents.toString();
            state = state.replace('--inject modules here--', modulesString);
            log('modulesString', modulesString);
            file.contents = new Buffer(state, 'utf-8');
            var oldFile = file.path.split(path.sep).join('/').replace(configWrap.config.webappDir, configWrap.config.tmp);
            if (fs.existsSync(oldFile)) {
                log('删除旧文件', oldFile);
                fs.unlinkSync(oldFile);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp));

}


/**
 * 需要在merge state 之前
 */
function states() {

    var env = util.getEnv();
    var modules = env.modules;

    var deferred = Q.defer();
    var asyncCount = modules.length;
    var coreConf = require('./project-common');

    modules.forEach(function (m) {
        // var allJs = []；
        var allCss = [];
        var dir = m.tmpPath;// repalce to rev
        if (coreConf.commonModules.indexOf(m.name) > -1) {
            log('states 系统模块', m.name);
        }
        var mConf = require((coreConf.commonModules.indexOf(m.name) > -1 ? './' : configWrap.config.gulpDir) + 'project-' + m.name);

        allCss = allCss.concat(mConf.venderCss);
        gulp.src([dir + '/*' + '.state.js'], { base: './' })
            .pipe(mapStream(function (file, cb) {

                var state = file.contents.toString();
                state = state.replace('// <insert all css here>', allCss.map(function (css) {
                    return '\'' + css + '\',';
                }).join('\r\n'));
                file.contents = new Buffer(state, 'utf-8');
                log('删除旧文件', file.path);
                fs.unlinkSync(file.path);
                cb(null, file);
            }))
            .pipe(gulp.dest('./'))
            .on('end', function () {
                asyncCount--;
                if (asyncCount <= 0) {
                    deferred.resolve();
                } else {
                    console.log('inject state: ' + dir + '/' + m.name + '.state.js');
                }
            });

    });
    return deferred.promise;

}
