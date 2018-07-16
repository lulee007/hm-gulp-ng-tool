var gulp = require('gulp'),
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify');

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