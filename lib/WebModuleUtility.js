(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var Task = global["Task"] || require("uupaa.task.js");

var fs = require("fs");
var childProcess = require("child_process");
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

// --- class / interfaces ----------------------------------
function WebModuleUtility() {
}

//{@dev
WebModuleUtility["repository"] = "https://github.com/uupaa/WebModuleUtility.js"; // GitHub repository URL. http://git.io/Help
//}@dev

WebModuleUtility["patched"]  = WebModuleUtility_patched;  // WebModuleUtility.patched(dir:String, callback:Function):void
WebModuleUtility["validate"] = WebModuleUtility_validate; // WebModuleUtility.validate(dir:String, callback:Function):void

// --- implements ------------------------------------------
function WebModuleUtility_patched(file, callback) {
    var packagejson1 = fs.readFileSync(file, "UTF-8");
    var packagejson2 = packagejson1.replace(/"version":(\s+)"(\d+)\.(\d+)\.(\d+)"/, function(_, space, major, minor, patch) {
        return '"version":' + space + '"' + major + "." + minor + "." + (parseInt(patch, 10) + 1) + '"';
    });

    var json1 = JSON.parse(packagejson1);
    var json2 = JSON.parse(packagejson2);
    var version1 = parseInt(json1.version.split(".")[2] || 0, 10);
    var version2 = parseInt(json2.version.split(".")[2] || 0, 10);

    if (version1 + 1 === version2) {
        console.log("update patch version. " + json1.version + " -> " + json2.version);
        fs.writeFileSync(file, packagejson2);
        //console.log( fs.readFileSync(file, "UTF-8") );
    } else {
        console.error("format error.");
    }
}

function WebModuleUtility_validate(dir, callback) {
    var task = new Task(4, function(err, buffer) {
                callback(err, buffer);
            });

    _validate_diff(task, dir + ".gitignore");
    _validate_diff(task, dir + ".npmignore");
    _validate_diff(task, dir + ".jshint.rc");
    _validate_diff(task, dir + ".travis.yml");
    _validate_scripts(task, dir + "package.json");
    //_validate_builds(task, dir);
    //_validate_module(task, dir);
}

function _validate_diff(task, path) {
    var file = {
            source: "../WebModule/" + path,
            target:                   path
        };

    if ( !fs.existsSync(file.source) ) {
        console.warn("Warning: " + file.source + " not found");
        task.miss();
        return;
    }
    if ( !fs.existsSync(file.target) ) {
        console.warn("Warning: " + file.target + " not found");
        task.miss();
        return;
    }

    var text = {
            target: fs.readFileSync(file.target).trim(),
            source: fs.readFileSync(file.source).trim()
        };

    if (text.target === text.source) {
        task.pass();
        return;
    }

    childProcess.exec("diff -y " + file.source + " " + file.target, function(err, stdout, stderr) {
        if (err || stderr) {
            task.miss();
        } else {
            console.log(stdout);
            task.pass();
        }
    });
}

function _validate_scripts(task, path) {
    var file = {
            source: "../WebModule/" + path,
            target:                   path
        };

    if ( !fs.existsSync(file.source) ) {
        console.warn("Warning: " + file.source + " not found");
        task.miss();
        return;
    }
    if ( !fs.existsSync(file.target) ) {
        console.warn("Warning: " + file.target + " not found");
        task.miss();
        return;
    }

    var text = {
            target: JSON.parse(fs.readFileSync(file.target).trim()),
            source: JSON.parse(fs.readFileSync(file.source).trim())
        };

    var script = {
            source: (text.source["x-build"] || text.source["build"])["scripts"],
            target: (text.target["x-build"] || text.target["build"])["scripts"]
        };

    if ( JSON.stringify(script.source) === JSON.stringify(script.target) ) {
        task.pass();
    } else {
        console.warn("Warning: " + file.target + " miss match");
        task.miss();
    }
}

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if ("process" in global) {
    module["exports"] = WebModuleUtility;
}
global["WebModuleUtility" in global ? "WebModuleUtility_" : "WebModuleUtility"] = WebModuleUtility; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule

