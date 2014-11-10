#!/usr/bin/env node

(function(global) {

var USAGE = _multiline(function() {/*
    Usage:
        node bin/WebModuleUtility.js [--help]
                                     [--verbose]
                                     [--validate]
                                     [--patched]
                                     [--bootsim]
                                     [--openurl url]
                                     [--killsim]
                                     [--bootserver] [--port]
                                     [--killserver]

    Example:
        node bin/WebModuleUtility.js --verbose --openurl http://localhost:1173/test

    See:
        https://github.com/uupaa/WebModuleUtility.js/wiki/WebModuleUtility.js
*/});


var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var WebModuleUtility = require("../lib/WebModuleUtility");
var Task    = require("uupaa.task.js");
var fs      = require("fs");
var argv    = process.argv.slice(2);
var options = _parseCommandLineOptions({
        help:       false,      // Boolean - show help.
        verbose:    false,      // Boolean - verbose mode.
        patched:    false,      // Boolean - patched version.
        bootsim:    false,      // Boolean - boot iOS simulator.
        openurl:    "",         // URLString - open the url in the iOS simulator.
        killsim:    false,      // Boolean - kill iOS simulator.
        bootserver: false,      // Boolean - boot http server.
        port:       1173,       // Number  - port number. The 1173 is NICE WAVE in japanese.
        killserver: false,      // Boolean - kill http server.
        validate:   false       // Boolean - validate
    });

if (options.help) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}

if (options.verbose) {
}

var util = new WebModuleUtility(options.verbose);

if (options.patched) {
    util.patched(process.cwd() + "/" + "package.json", function(err) {
    });
}
if (options.validate) {
    util.validate("./", function(err) {
    });
}

var task = [];

if (options.killsim)    { task.push("killsim"); }
if (options.killserver) { task.push("killserver"); }
if (options.bootserver) { task.push("killserver", "bootserver"); }
if (options.bootsim)    { task.push("killsim", "bootsim"); }
if (options.openurl)    {
    if (task.indexOf("bootsim") <  0) { task.push("killserver", "bootserver", "bootsim"); }
    if (task.indexOf("bootsim") >= 0) { task.push("4000"); } // delay 4s
    task.push("openurl");
}

if (task.length) {
    Task.run(task.join(">"), {
        killsim:    function(task) { util.killsim(task.passfn(), task.missfn()); },
        killserver: function(task) { util.killserver(process.cwd(), task.passfn(), task.missfn()); },
        bootserver: function(task) { util.bootserver(process.cwd(), options.port, task.passfn(), task.missfn()); },
        bootsim:    function(task) { util.bootsim(task.passfn(), task.missfn()); },
        openurl:    function(task) { util.openurl(options.openurl, task.passfn(), task.missfn()); }
    }, function() {
        // finished.
    });
}

function _parseCommandLineOptions(options) { // @arg Object:
                                             // @ret Object:
    for (var i = 0, iz = argv.length; i < iz; ++i) {
        switch (argv[i]) {
        case "-h":
        case "--help":      options.help = true; break;
        case "-v":
        case "--verbose":   options.verbose = true; break;
        case "--validate":  options.validate = true; break;
        case "--patched":   options.patched = true; break;
        case "--bootsim":   options.bootsim = true; break;
        case "--openurl":   options.openurl = argv[++i]; break;
        case "--killsim":   options.killsim = true; break;
        case "--bootserver":options.bootserver = true; break;
        case "--port":      options.port = argv[i++]; break;
        case "--killserver":options.killserver = true; break;
        }
    }
    return options;
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}

})((this || 0).self || global);

