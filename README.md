# gulp-hm-web-gis-tool
汉图研发部gis前端开发打包工具

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

2. 添加 gulpfile.js
    ```js
    'use strict';
    var gulp = require('gulp'),
        runSequence = require('run-sequence')
    ;


    var tool = require('hm-gismap-gulp'),
        config = require('./gulp/config');
    // 一定要添加配置文件
    tool.configWrap.config = config;

    gulp.task('build', tool.build);

    gulp.task('default', tool.buildAndWatch);
    ```
3. 在 gulp 目录中添加项目文件 project-xxx.js:
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
    gulp --port=8080 --pages=page1,page2
    ```
    然后运行 tomcat 即可。