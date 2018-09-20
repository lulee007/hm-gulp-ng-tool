# gulp-hm-web-gis-tool

汉图研发部 angularjs 前端开发打包工具

## 安装：

```sh
npm i hm-gismap-gulp
```

## 配置：

1. 在项目根目录添加 gulp 文件夹，然后添加配置文件 config.js：
    ```js
    'use strict';
    var process = require('process');
    var cwd = process.cwd();

    module.exports = {
        dist: 'src/main/dist/',
        webappDir: 'src/main/webapp/',
        revDest: 'src/main/tmp/',
        bower: 'src/main/webapp/bower_components/',
        tmp: 'src/main/tmp/',
        revManifest: 'src/main/tmp/rev-manifest.json',
        webTargetDir: 'target/',
        port: 9000,
        gulpDir: cwd + '/gulp/',
        projectName : 'sims-xxxxx'
    };
    ```

2. 在项目根目录添加 gulp 文件夹，然后添加配置文件 project-common.js：
    ```js
    'use strict';
    module.exports = {
        coreCss: [
        ],
        coreJs: [
             // 'bower_components/ng-stomp/dist/ng-stomp.standalone.min.js',
        ],
        commonFile: [
        ]
    };
    ```

3. 添加 gulpfile.js
    ```js
    'use strict';
    var gulp = require('gulp');

    var tool = require('hm-gismap-gulp'),
        commonConfig = require('./gulp/project-common'),
        config = require('./gulp/config');

    // 一定要添加配置文件
    tool.configWrap.config = config;
    tool.wrapProjectCommon(commonConfig);

    gulp.task('build', tool.build);

    gulp.task('default',['build'], tool.watch);
    ```
4. 在 gulp 目录中添加项目文件 project-xxx.js:
    ```js
    'use strict';

    module.exports = {
        venderCss: [
            // 第三方库 css 文件
        ],
        venderJs: [
            // 第三方库 js 文件
        ],
        venderAssets: [
            // 可能需要的第三方库额外文件
        ]
    };
    ```

## 使用方式：

- 打包：

    ```sh
    gulp build --pages=page1,page2
    ```

- 开发调试
    ```sh
    # port 为 tomcat 端口号
    gulp --port=8080 --pages=page1,page2
    ```
    然后运行 tomcat 即可。

## 旧版本打包

## gulpfile.js 文件内容：

```js
gulp.task('clean-state', function () {
    var targetJs = 'app.other.state.js';
    return gulp.src(config.app + '/app/' + targetJs)
        .pipe(clean());
});

/**
 * 将所有state文件合并到 all.other.state.js 文件当中
 **/
gulp.task('build:routers', ['clean-state'], function () {
    var targetJs = 'app.other.state.js';
    return gulp.src([config.app + 'app/**/!(app)*.state.js'])
        .pipe(concat(targetJs))
        .pipe(gulp.dest(config.app + '/app/'));
});

gulp.task('watch:routers', function () {
    gulp.watch(config.app + 'app/**/!(app)*.state.js', ['build:routers']);
});

gulp.task('browser-sync', function () {

    browserSync({
        open: true,
        port: config.port,
        // proxy: "http://192.168.8.34:18080",
        server: {
            baseDir: config.app
        }
        // serveStatic: [config.app]
    });
    gulp.watch([config.app + '*.html', config.app + 'app/**']).on('change', browserSync.reload);

});

gulp.task('default', function (cb) {
    runSequence(['build:routers', 'watch:routers', 'browser-sync'],cb);
});

```