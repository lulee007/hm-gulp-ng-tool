"use strict";

var
    gulp = require('gulp'),
    gulpIf = require('gulp-if'),
    cleanCSS = require('gulp-clean-css'),
    sourcemaps = require('gulp-sourcemaps'),
    lazypipe = require('lazypipe'),
    mapStream = require('map-stream'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    htmlmin = require('gulp-htmlmin'),
    rev = require('gulp-rev'),
    log = require('fancy-log'),
    fs = require('fs'),
    revReplace = require("gulp-rev-replace"),

    manifestHelper = require('./manifest-helper'),
    handleErrors = require('./handle-errors');


var configWrap = require('./config-wrap');
var path = require('path');


var jsTask = lazypipe()
    .pipe(uglify, {
        mangle: false,               // 是否修改变量名，默认为 true
        compress: true             // 是否完全压缩，默认为 true
        // preserveComments: 'all'     // 保留所有注释
    });

var cssTask = lazypipe()
    .pipe(cleanCSS);


function revModules() {
    var revFiles = [
        configWrap.config.tmp + 'app/**/*.*',
        '!' + configWrap.config.tmp + 'app/**/*.component.js',
        '!' + configWrap.config.tmp + 'app/app.all.state.js'
        // configWrap.config.tmp + 'app/**/*.html',
        // configWrap.config.tmp + 'app/**/*.txt'
    ];

    return gulp.src(revFiles)
        .pipe(plumber({errorHandler: handleErrors}))
        .pipe(sourcemaps.init())
        .pipe(gulpIf('*.js', jsTask()))
        .pipe(gulpIf('*.css', cssTask()))
        .pipe(gulpIf('*.html', htmlmin({collapseWhitespace: true})))
        .pipe(gulpIf('**/*.!(txt)', rev()))
        .pipe(gulpIf('**/*.!(txt|html)', sourcemaps.write('.')))
        .pipe(gulp.dest(configWrap.config.tmp + 'rev/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest(configWrap.config.revDest));

}

function revState() {
    var revFiles = [
        configWrap.config.tmp + 'app/app.all.state.js'
        // configWrap.config.tmp + 'app/**/*.css',
        // configWrap.config.tmp + 'app/**/*.js',
        // configWrap.config.tmp + 'app/**/*.html',
        // configWrap.config.tmp + 'app/**/*.txt'
    ];
    var manifest = gulp.src(configWrap.config.revManifest);

    return gulp.src(revFiles)
        .pipe(plumber({errorHandler: handleErrors}))
        .pipe(sourcemaps.init())
        .pipe(revReplace({manifest: manifest}))
        .pipe(jsTask())
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(mapStream(function (file, cb) {
            if (file.path.endsWith('.js')) {
                manifestHelper.saveRev('app.all.state.js', file.path);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'rev/'));
}

function revComponent() {
    var revFiles = [
        configWrap.config.tmp + 'app/**/*.component.js'
        // configWrap.config.tmp + 'app/**/*.css',
        // configWrap.config.tmp + 'app/**/*.js',
        // configWrap.config.tmp + 'app/**/*.html',
        // configWrap.config.tmp + 'app/**/*.txt'
    ];
    var manifest = gulp.src(configWrap.config.revManifest);

    return gulp.src(revFiles)
        .pipe(plumber({errorHandler: handleErrors}))
        .pipe(sourcemaps.init())
        .pipe(revReplace({manifest: manifest}))
        .pipe(jsTask())
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(mapStream(function (file, cb) {
            if (file.path.endsWith('.js')) {
                manifestHelper.saveRev(file.path);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.tmp + 'rev/'));
}


function revReplaceIndex() {
    var manifest = gulp.src(configWrap.config.revManifest);
    return gulp.src(configWrap.config.tmp + '*.html')
        .pipe(revReplace({manifest: manifest}))
        .pipe(mapStream(function (file, cb) {
            var dFile = file.path.split(path.sep).join('/').replace(configWrap.config.tmp, configWrap.config.dist);
            log('revReplaceIndex', dFile);
            if (fs.existsSync(dFile)) {
                log('删除旧文件', dFile);
                fs.unlinkSync(dFile);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.dist));
}

function revReplaceHtml() {
    //TODO ng-include-html 容易导致 rev 不变问题
    var manifest = gulp.src(configWrap.config.revManifest);
    return gulp.src(configWrap.config.tmp + 'rev/**/*.html', {base: configWrap.config.tmp + 'rev/'})
        .pipe(revReplace({manifest: manifest}))
        .pipe(mapStream(function (file, cb) {
            var dFile = file.path.split(path.sep).join('/').replace(configWrap.config.tmp + 'rev/', configWrap.config.dist + 'app/');
            log('revReplaceHtml', dFile);
            if (fs.existsSync(dFile)) {
                log('删除旧文件', dFile);
                fs.unlinkSync(dFile);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(configWrap.config.dist + 'app/'));
}


module.exports = {
    revModules: revModules,
    revState: revState,
    revComponent: revComponent,
    revReplaceIndex: revReplaceIndex,
    revReplaceHtml: revReplaceHtml,
    jsTask: jsTask
};
