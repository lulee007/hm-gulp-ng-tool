'use strict';

var fs = require('fs');
var log = require('fancy-log');
var configWrap = require('./config-wrap');

module.exports = {
    getEnv: env,
    parseVersion: parseVersion,
    parseProjectName: parseProjectName,
    moduleFiles: moduleFiles,
    normalFilesInModules: normalFilesInModules,
};

var modules;
var coreConf = require('./project-common');
var _module_names,_pages;
var parseString = require('xml2js').parseString;
// return the version number from `pom.xml` file
function parseVersion() {
    var version = null;
    var pomXml = fs.readFileSync('pom.xml', 'utf8');
    parseString(pomXml, function (err, result) {
        if (result.project.version && result.project.version[0]) {
            version = result.project.version[0];
        } else if (result.project.parent && result.project.parent[0] && result.project.parent[0].version && result.project.parent[0].version[0]) {
            version = result.project.parent[0].version[0];
        }
    });
    if (version === null) {
        throw new Error('pom.xml is malformed. No version is defined');
    }
    return version;
}

function parseProjectName() {
    var pName = null;
    var pomXml = fs.readFileSync('pom.xml', 'utf8');
    parseString(pomXml, function (err, result) {
        if (result.project.artifactId && result.project.artifactId[0]) {
            pName = result.project.artifactId[0];
        }
    });
    if (pName === null) {
        throw new Error('pom.xml is malformed. No artifactId is defined');
    }
    return pName;
}

function env() {
    var params = _parseParams(process.argv);
    var port = params.port;
    if (!port) {
        log('参数：port 为空（build 模式请忽略）如：--port=8080');
    }
    var allPages = getModuleNames()
    var pages = allPages[0];
    modules = pages.map(function (p) {
        return {
            name: p,
            path: configWrap.config.webappDir + 'app/' + p,
            tmpPath: configWrap.config.tmp + 'app/' + p
        };
    });
    var prod = params.prod;
    var version = parseVersion();
    var projectName = parseProjectName();
    return {
        params: params,
        modules: modules,
        pages:allPages[1],
        prod: prod,
        port: port,
        projectVersion: version,
        projectName: projectName
    };
}


function normalFilesInModules() {
    var pages = getModuleNames()[0];
    var files = coreConf.commonFile;
    var commonIgnore = coreConf.commonIgnore.map(function (file) {
        return '!' + configWrap.config.webappDir + file;
    });
    for (var p in pages) {
        var page = pages[p];
        files.push('app/' + page + '/**/*');
        commonIgnore = commonIgnore.concat(coreConf.moduleIgnore.map(function (i) {
            return '!' + configWrap.config.webappDir + 'app/' + page + '/' + i;
        }));
    }

    files = files.map(function (file) {
        return configWrap.config.webappDir + file;
    });

    files = files.concat(commonIgnore);
    return files;
}

function moduleFiles() {
    var modules = env().modules;

    var files = modules
        .map(function (m) {
            return ['**/*.component.js', "**/*.scss", "**/*.service.js", "**/*.state.js", "**/*.html"].map(function (type) {
                return m.path + '/' + type;
            });
        })
        .reduce(function (r, item) {
            return r.concat(item);
        }, []);
    return files;
}


function getModuleNames() {
    if (!_module_names) {
        var params = _parseParams(process.argv);
        if (!params || !params.pages) {
            log('pages *********************************');
            log('pages 参数错误:--pages=page1,page2,page3');
            log('pages *********************************');
            return;
        }
        _module_names = params.pages.split(',');
        _pages = _module_names;
        _module_names = _module_names.concat(coreConf.commonModules);
    }
    return [_module_names,_pages];
}


function _parseParams(argv) {
    var args = argv
        .filter(function (arg) {
            return arg.startsWith('--');
        }).map(function (arg) {
            var argKeyValue = arg.replace('--', '').split('=');
            return argKeyValue;
        })
        .reduce(function (params, argKeyValue) {
            params[argKeyValue[0]] = argKeyValue[1] || '参数错误';
            return params;
        }, {});
    return args;
}
