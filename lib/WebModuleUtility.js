(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var Task = global["Task"];

var fs = require("fs");
var childProcess = require("child_process");
// --- define / local variables ----------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
//var _runOnBrowser = "document" in global;

var HTTP_SERVER_NAME = "http-server";
var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };
var VERBOSE = false;

// --- class / interfaces ----------------------------------
function WebModuleUtility(verbose) {
    VERBOSE = verbose || false;
}

WebModuleUtility["prototype"] = {
    "constructor":  WebModuleUtility,
    "patched":      WebModuleUtility_patched,   // WebModuleUtility#patched(file:String, callback:Function):void
    "bootsim":      WebModuleUtility_bootsim,   // WebModuleUtility#bootsim(callback:Function, errorCallback:Function):void
    "killsim":      WebModuleUtility_killsim,   // WebModuleUtility#killsim(callback:Function, errorCallback:Function):void
    "openurl":      WebModuleUtility_openurl,   // WebModuleUtility#openurl(url:URLString, callback:Function, errorCallback:Function):void
    "bootserver":   WebModuleUtility_bootserver,// WebModuleUtility#bootserver(dir:String, port:Number, callback:Function, errorCallback:Function):void
    "killserver":   WebModuleUtility_killserver,// WebModuleUtility#killserver(dir:String, callback:Function, errorCallback:Function):void
    "validate":     WebModuleUtility_validate,  // WebModuleUtility#validate(dir:String, callback:Function):void
};

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

function _getiOSSimulatorUUID(keyword, callback, errorCallback, ignore) {
    _exec(keyword, function(stdout) {
        // iPhone 5 (E6AA0287-6C06-4F03-A61E-C96B75B587CD) (Booted)
        //           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //             UUID
        var line = stdout.trim();

        if (line) {
            var uuid = line.split(")")[0].split("(")[1]; // E6AA0287-6C06-4F03-A61E-C96B75B587CD

            if (callback) {
                callback(uuid); // Booted
            }
        } else {
            if (callback) {
                callback(0); // Shutdown
            }
        }
    }, errorCallback, ignore);
}

function WebModuleUtility_bootsim(callback, errorCallback) {

    var _verbose = VERBOSE;
    VERBOSE = false; // [!] Ninja

    this.killsim(function() {
        VERBOSE = _verbose;

        var keyword = "iPhone\\ 5s";
        var template = ""; // /Applications/Xcode.app/Contents/Applications/Instruments.app/Contents/PlugIns/AutomationInstrument.xrplugin/Contents/Resources/Automation.tracetemplate";

        _getiOSSimulatorUUID("xcrun simctl list | grep -v com | grep " + keyword, function(uuid) {
            _exec("xcrun instruments -w " + uuid + " -t " + template, function(stdout) {
/*
                if (uuid) {
                  //_exec("open -a 'iOS Simulator'", callback, errorCallback);
                    _exec("xcrun simctl boot " + uuid, callback, errorCallback);
                } else {
                    if (VERBOSE) {
                        console.log(CONSOLE_COLOR.RED + "device " + keyword + " is not found" + CONSOLE_COLOR.CLEAR);
                    }
                }
 */
            }, errorCallback);
        }, errorCallback);
    }, errorCallback);
}

function WebModuleUtility_killsim(callback, errorCallback) {
    _getiOSSimulatorUUID("xcrun simctl list | grep Booted", function(uuid) {
        if (uuid) {
            _exec("xcrun simctl shutdown " + uuid, callback, errorCallback);
        } else {
            if (VERBOSE) {
                console.log(CONSOLE_COLOR.GREEN + "iOS Simulator already shutdown" + CONSOLE_COLOR.CLEAR);
            }
            if (callback) {
                callback();
            }
        }
    }, errorCallback, true); // ignore

}

function WebModuleUtility_openurl(url, callback, errorCallback) {
    _getiOSSimulatorUUID("xcrun simctl list | grep Booted", function(uuid) {
        if (uuid) {
            _exec("xcrun simctl openurl " + uuid + " " + url, callback, errorCallback);
        } else {
            if (VERBOSE) {
                console.log(CONSOLE_COLOR.RED + "fail. iOS Simulator shutdown" + CONSOLE_COLOR.CLEAR);
            }
            if (callback) {
                callback();
            }
        }
    }, errorCallback);
}

function WebModuleUtility_bootserver(dir,             // @arg String
                                     port,            // @arg Number
                                     callback,        // @arg Function = null
                                     errorCallback) { // @arg Function = null
    var _verbose = VERBOSE;

    VERBOSE = false; // [!] Ninja
    this.killserver(dir, function() {
        VERBOSE = _verbose;

        if (VERBOSE) {
            console.log(CONSOLE_COLOR.GREEN + [HTTP_SERVER_NAME, dir, "-p", port].join(" ") + CONSOLE_COLOR.CLEAR);
        }
        var server = childProcess.spawn(
                        HTTP_SERVER_NAME,
                        [dir, "-p", port],
                        { detached: true, stdio: ["ignore", "ignore", "ignore"] });
        server.unref()
        if (callback) {
            callback();
        }
    }, errorCallback);
}

function WebModuleUtility_killserver(dir, callback, errorCallback) { // @arg String
    _exec("ps -x | grep " + HTTP_SERVER_NAME, function(stdout) {
        // 28307 ??         0:00.13 node /usr/local/bin/http-server ~/dir/WebModuleUtility.js -p 1173
        // ~~~~~ ~~         ~~~~~~~ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //  pid  TTY        TIME    CMD
        var line = stdout.trim().split("\n");

        if (/WebModuleUtility/.test(line)) {
            var pid = parseInt(line);

            _exec("kill " + pid, callback, errorCallback);
        } else {
            if (VERBOSE) {
                console.log(CONSOLE_COLOR.GREEN + "already stopped" + CONSOLE_COLOR.CLEAR);
            }
            if (callback) {
                callback("");
            }
        }
    }, errorCallback);
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

function _exec(command,         // @arg String
               callback,        // @arg Function - callback(stdout)
               errorCallback,   // @arg Function = null - errorCallback(stderr)
               ignore) {        // @arg Boolean = false - ignore error

    childProcess.exec(command, function(err, stdout, stderr) {
        if (!ignore && (err || stderr)) {
            if (VERBOSE) {
                console.log(CONSOLE_COLOR.RED + command + CONSOLE_COLOR.CLEAR);
                console.log(CONSOLE_COLOR.RED + err + CONSOLE_COLOR.CLEAR);
            }
            if (errorCallback) {
                errorCallback(stderr);
            }
        } else {
            if (VERBOSE) {
                console.log(CONSOLE_COLOR.GREEN + "exec: " + command + CONSOLE_COLOR.CLEAR);
            }
            if (callback) {
                callback(stdout || "");
            }
        }
    });
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

