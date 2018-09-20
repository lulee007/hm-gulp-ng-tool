# gulp-hm-web-gis-tool

汉图研发部 angularjs 前端开发打包工具

## 安装：

```sh
npm i hm-gismap-gulp
```

## 配置：

1. 首先要确保项目工程目录下的`src/main/webapp/app/app.constants.js` 文件内容如下  

    **注意：** 带有 `--inject` 字样的文字请不要删除，否则会导致编译失败

    ```js
    (function () {
        'use strict';
        angular
            .module('XXXXApp')
            .constant('APP_CONSTANT', {
                //debug信息启用
                'DEBUG_INFO_ENABLED': true,
                //认证白名单
                'AUTH_WHITE_LIST': [/gateway\/api\/authenticate/,/'--inject APIHOST here--'\/mapApiKeys\/check/],
                //验证请求地址
                'API_TOKEN_URL':'gateway/api/authenticate',
                'STATE_WHITE_LIST': ['404', '403', '500', 'tp', ''],
                'TP_STATE_WHITE_LIST':['--inject pages here--'],

                //项目配置
                //--inject APPCONSTANTS here--
            });
    })();

    ```

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
        projectName : 'sims-xxxxx',
        APPCONSTANTS: { // 这里放公共配置常量，具体子系统的常量单独写到子系统中
            API_KEY: _API_KEY,
            API_HOST: 'gateway/simsgismap/api/',
            AUTH_URL: 'gateway/api/authenticate',
            ALL_MODULES: {
                xxxxx: {
                    name: "xxxx",
                    href: "#/tp?apikey=" + _API_KEY + "&state=xxxx",
                    src: "assets/global/img/xxxx.png"
                }
            }
        }
    };
    ```

1. 在项目根目录添加 gulp 文件夹，然后添加配置文件 project-common.js：
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
1. 在 `gulp` 目录中添加子系统配置文件 `project-xxx.js`:
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

1. 添加 gulpfile.js
    ```js
    'use strict';
    var gulp = require('gulp');

    var tool = require('hm-gismap-gulp'),
        commonConfig = require('./gulp/project-common'),
        config = require('./gulp/config');

    // **注意** 一定要添加配置文件
    tool.configWrap.config = config;
    tool.wrapProjectCommon(commonConfig);

    gulp.task('build', tool.build);

    gulp.task('default',['build'], tool.watch);
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