"use strict";

var gulp = require('gulp'),
    log = require('fancy-log'),
    plumber = require('gulp-plumber'),
    rev = require('gulp-rev'),
    fs = require('fs'),
    fse = require('fs-extra'),
    browserSync = require('browser-sync'),
    process = require('process'),
    watch = require('gulp-watch');


var util = require('./utils');
var configWrap = require('./config-wrap');
var coreConf = require('./project-common');
var merge = require('./merge');
var minify = require('./minify');
var handleErrors = require('./handle-errors');
var manifestHelper = require('./manifest-helper');
var path = require('path');

var watchTaskConf = { assets_vender: undefined, dist: undefined };

/**
 *
 * @param type watch task name
 * @param source watch 原始目录
 * @param targets 需要同步到的目录列表
 * @param reload 是否同步刷新浏览器
 * @returns {{}}
 */
function genNewTaskConf(type, source, targets, reload) {
    var task = {};
    task.watchingList = [];
    task.lock = false;
    task.isStart = false;
    task.name = type;
    task.source = source;
    task.targets = [].concat(targets);
    task.reload = reload;
    return task;
}

function GenNewTask(conf) {
    var currentConf = conf;
    currentConf.taskCount = 0;

    function addToWatching(f) {
        start();
        while (currentConf.lock) {
            sleep(10);
        }
        currentConf.lock = true;
        log('watch ' + currentConf.name + '：添加一个文件', f.path);
        currentConf.watchingList.push(f);
        currentConf.lock = false;

    }

    function start() {
        if (currentConf.isStart) {
            return;
        }
        log('watch ' + currentConf.name + '：开始定时处理监听列表');
        var loopTime = 1500;
        if (process.platform === 'darwin') {
            loopTime = 1000;
        }
        currentConf.isStart = setInterval(function () {
            dealWatchingList();
        }, loopTime);
    }

    function stop() {
        if (!currentConf.isStart) {
            return;
        }
        clearInterval(currentConf.isStart);
        currentConf.isStart = undefined;
        log('watch ' + currentConf.name + '：处理列表中...');

    }

    function dealWatchingList() {
        while (currentConf.lock) {
            sleep(10);
        }
        currentConf.lock = true;
        currentConf.taskCount++;
        log('新任务', currentConf.taskCount);
        if (currentConf.watchingList.length > 0) {
            var files = currentConf.watchingList;
            currentConf.watchingList = [];
            stop();
            var filterdFiles = files.reduce(function (r, l) {
                r[l.path] = l;
                return r;
            }, {});

            Object.keys(filterdFiles).forEach(function (fPath) {
                var f = filterdFiles[fPath];
                currentConf.targets.forEach(function (target) {
                    var distPath = f.path.split(path.sep).join('/').replace(currentConf.source, target);
                    log('watch ' + currentConf.name + '：处理:', distPath, f.event);
                    if (fs.existsSync(distPath)) {
                        // 所有操作都应该先删除原文件，然后进行 add change
                        fse.removeSync(distPath);
                    }
                    if (f.event.startsWith('unlink')) {
                        // 上面已经删除了文件 或者文件夹，直接返回
                    } else {
                        // 这里可以进行 add change 的复制操作
                        fs.existsSync(f.path) && fse.copySync(f.path, distPath);
                    }
                });
            });
            log('watch ' + currentConf.name + '：处理列表完成');
            if (currentConf.reload) {
                if (currentConf.taskCount > 1) {
                    log('还未处理完成...', currentConf.taskCount);
                    currentConf.taskCount--;
                } else {
                    if (browserSync.needWait) {
                        log('有新的构建任务，取消刷新浏览器');
                    } else {
                        browserSync.reload();
                        log('刷新浏览器');
                    }
                    currentConf.taskCount = 0;
                }
            }
        }
        currentConf.lock = false;
    }

    function sleep() {
        // HAHA !

        var a = 1;
        for (var i = 0; i < 50000; i++) {
            a = i;
        }
        return a;
    }

    return { addToWatching: addToWatching };
}

/**
 * 只需要 新增，修改和删除三种状态，addDir unlinkDir 不需要
 * @type {{events: [*]}}
 */
var WatchEvents = { events: ['add', 'change', 'unlink'] };

/**
 *  监听 第三方插件和 assets 资源
 * @returns {*}
 */
function watchAssetsVender() {
    var type = 'assest_vender';
    var taskConf = watchTaskConf[type],
        task;
    if (!taskConf) {
        watchTaskConf[type] = taskConf = genNewTaskConf(type, configWrap.config.webappDir, configWrap.config.dist);
        task = new GenNewTask(taskConf);
    }
    // assets and other modules txt etc files 不需要压缩，或者计算 rev 直接复制到 dist
    var env = util.getEnv();
    var filesToWatch = coreConf.commonAssets.map(function (file) {
        return configWrap.config.webappDir + file;
    });
    var commonIgnore = coreConf.commonIgnore.map(function (file) {
        return '!' + configWrap.config.webappDir + file;
    });
    var moduleFiles = env.modules.map(function (m) {
        return m.path + '/**/*.(txt|json)';
    });
    var moduleAssets = env.modules.map(function (m) {
        return configWrap.config.webappDir + 'assets/pages/' + m.name + '/**/*';
    });
    filesToWatch = filesToWatch.concat(moduleFiles)
        .concat(moduleAssets)
        .concat(commonIgnore);

    // log(filesToWatch);

    return watch(filesToWatch, WatchEvents, function (vinyl) {
        task.addToWatching({ event: vinyl.event, path: vinyl.path, base: vinyl.base });
    });


}

/**
 *  监听dist 目录，然后同步到 target 目录中
 * @returns {*}
 */
function watchDist() {
    var type = 'dist';
    var taskConf = watchTaskConf[type],
        task;
    if (!taskConf) {
        watchTaskConf[type] = taskConf = genNewTaskConf(type, configWrap.config.dist, [
            // configWrap.config.webTargetDir + 'classes/',
            configWrap.config.webTargetDir + util.parseProjectName() + '-' + util.parseVersion() + '/'], true);
        task = new GenNewTask(taskConf);
    }
    return watch(configWrap.config.dist + '**/*.*', WatchEvents, function (vinyl) {
        task.addToWatching({ event: vinyl.event, path: vinyl.path, base: vinyl.base });
    });

}

function watchModule() {
    // ser comp state css html 需要进行合并、压缩，然后复制到 dist？tmp
    var files = util.moduleFiles();
    // log('watch Module', files);
    return watch(files, function (vinyl) {
        var module = findModuleByPath(vinyl.path);
        // log(vinyl.event, vinyl.path, module);
        if (vinyl.path.endsWith('.component.js')) {
            merge.mergeModuleComponent(module);
        } else if (vinyl.path.endsWith('.service.js')) {
            merge.mergeModuleService(module);
        } else if (vinyl.path.endsWith('.scss')) {
            merge.mergeModuleCss(module);
        } else if (vinyl.path.endsWith('.state.js')) {
            merge.mergeStatesByModule();
        } else if (vinyl.path.endsWith('.html')) {
            // watchNormalJsHtml will do
        } else {
            log.warn('不应该被执行', vinyl.path);
        }
    });

    function findModuleByPath(filePath) {
        var env = util.getEnv();
        var modules = env.modules;
        var module;
        modules.forEach(function (m) {
            if (filePath.split(path.sep).join('/').indexOf(m.path) > -1) {
                module = m;
            }
        });
        return module;
    }
}

function watchNormalJsHtml() {
    // 总的 constan.js app.module, 其他js ，需要进行压缩，然后复制到 dist
    var env = util.getEnv();
    var filesToWatch = coreConf.commonFile.map(function (f) {
        return configWrap.config.webappDir + f;
    });

    filesToWatch = filesToWatch.concat(
        env.modules
            .map(function (m) {
                return [
                    m.path + '/**/*.js',
                    m.path + '/**/*.html',
                    '!' + m.path + '/**/*.state.js',
                    '!' + m.path + '/**/*.component.js',
                    '!' + m.path + '/**/*.service.js'
                ];
            })
            .reduce(function (r, item) {
                return r.concat(item);
            }, [])
    );

    var commonIgnore = coreConf.commonIgnore.map(function (file) {
        return '!' + configWrap.config.webappDir + file;
    });
    filesToWatch = filesToWatch.concat(commonIgnore);

    // log(filesToWatch);

    return watch(filesToWatch, WatchEvents, function (vinyl) {
        // unlink file in dist and save to manifest
        var distPath = vinyl.path.split(path.sep).join('/').replace(configWrap.config.webappDir, configWrap.config.tmp);
        fse.removeSync(distPath);
        if (vinyl.event === 'unlink') {
            // 已经处理
            return;
        }
        return gulp.src(vinyl.path, { base: configWrap.config.webappDir })
            .pipe(gulp.dest(configWrap.config.tmp));

    });
}


module.exports = {
    assets_vender: watchAssetsVender,
    dist: watchDist,
    module: watchModule,
    normalJsHtml: watchNormalJsHtml
};
