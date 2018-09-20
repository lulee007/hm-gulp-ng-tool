'use strict';

module.exports = {
    coreCss: [
        'bower_components/bootstrap/dist/css/bootstrap.min.css',
        // 'bower_components/hm-angularjs-base/dist/metronic/global/css/components.min.css',
        // 'bower_components/hm-angularjs-base/dist/metronic/global/css/plugins.min.css',
        // 'bower_components/hm-angularjs-base/dist/metronic/layouts/layout/css/layout.min.css',
        // 'bower_components/hm-angularjs-base/dist/metronic/layouts/layout/css/themes/light2.min.css',
        // 'bower_components/hm-angularjs-base/dist/metronic/layouts/layout/css/custom.min.css',
        'bower_components/angular-toastr/dist/angular-toastr.css',
        'assets/pages/css/error.min.css',
    ],
    coreJs: [
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/angular/angular.min.js',
        'bower_components/ngstorage/ngStorage.min.js',
        'bower_components/angular-resource/angular-resource.min.js',
        'bower_components/angular-sanitize/angular-sanitize.min.js',
        'bower_components/angular-ui-router/release/angular-ui-router.min.js',
        'bower_components/oclazyload/dist/ocLazyLoad.min.js',
        // 'bower_components/ng-stomp/dist/ng-stomp.standalone.min.js',
        'bower_components/angular-toastr/dist/angular-toastr.tpls.js',
        'bower_components/hm-ng-map-base/dist/gismap.frontend.module.min.js',
        'app/app.module.js',
        'app/app.constants.js',// TODO 分割app.constants.js 分为 common 和项目
        'app/app.all.state.js',
    ],
    commonFile: [
        'app/app.module.js',

    ],
    commonModules: [
        // 'home',
        // 'thrid_part',
        // 'login'
    ],
    commonAssets: [
        // 'assets/**/*',
        // 'bower_components/**/*',
        'assets/global/img/**/*',
        'favicon.ico',
        'WEB-INF/**/*',
        // 'app/tpl/**/*'
    ],
    moduleIgnore: [
        '**/*.css',// TODO remove tmp
        '**/*.scss',
        '**/*.all.*',// TODO remove tmp
        '**/*.component.js',
        '**/*.service.js',
    ],
    commonIgnore: [
        'app/app.constants.js',
        // '**/*.merged.state.js',
        'home/home.controller.js'
        // 'index.html'

    ]
};
