var gulp = require('gulp'),
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify');
    

// var config = require('./config'),
//     tools = require('./index'),
    
//     configWrap = require('./src/config-wrap');
    
//     configWrap.config = config;

// gulp.task('default', function (cb) {
//     console.log('gulp default start')
//     var argv = process.argv;
//     if (!argv || !argv[2]) {
//         console.error('用法：gulp --port --module1,[module2,][module3,] \r\n如：gulp --8080');
//         return;
//     }
//     tools.build(cb, config);
// });

gulp.task('clean-dist',function(){
    return gulp.src('./dist')
    .pipe(clean());
});

gulp.task('build-dist',['clean-dist'], function () {
    return gulp
        .src('./src/*.js')
        .pipe(uglify({
            mangle: false,               // 是否修改变量名，默认为 true
            compress: true             // 是否完全压缩，默认为 true
            // preserveComments: 'all'     // 保留所有注释
        }))
        .pipe(gulp.dest('./dist'));
});