'use strict';

var fs = require('fs');
var log = require('fancy-log');
var configWrap = require('./config');

module.exports = {
    getEnv: env,
    parseVersion: parseVersion,
    parseProjectName: parseProjectName,
    moduleFiles: moduleFiles,
    normalFilesInModules: normalFilesInModules,
};

var modules;
var coreConf = require('./project-common');
var _module_names;
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
    var argv = process.argv;
    if (!argv || !argv[2]) {
        console.error('用法：gulp --port \r\n如：gulp --8080');
        return;
    }
    var port = argv[2].replace('--', '');
    var pages = getModuleNames();
    modules = pages.map(function (p) {
        return {
            name: p,
            path: configWrap.config.webappDir + 'app/' + p,
            tmpPath: configWrap.config.tmp + 'app/' + p
        };
    });
    var prod = argv[4] && argv[4].replace('--', '');
    var version = parseVersion();
    var projectName = parseProjectName();
    return {
        modules: modules,
        prod: prod,
        port: port,
        projectVersion: version,
        projectName: projectName
    };
}


function normalFilesInModules() {
    var pages = getModuleNames();
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
        var argv = process.argv;
        if (!argv || !argv[3]) {
            log.error('用法：gulp copy:copyProject --tongli_wechat \r\n\t\t如：gulp copy:copyProject --PROJECT_NAME[,Name2,Name3]');
            throw new Error("缺少必要参数");
        }
        _module_names = argv[3].replace('--', '').split(',');
        _module_names = _module_names.concat(coreConf.commonModules);
    }
    return _module_names;
}
