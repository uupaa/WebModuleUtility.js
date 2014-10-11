#!/usr/bin/env node

(function(global) {

var USAGE = _multiline(function() {/*
    Usage:
        node bin/WebModuleUtility.js [--help]
                                     [--verbose]
                                     [--validate]
                                     [--patched]

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
var fs      = require("fs");
var argv    = process.argv.slice(2);
var options = _parseCommandLineOptions({
        help:       false,      // Boolean: show help.
        verbose:    false,      // Boolean: verbose mode.
        patched:    false,      // Boolean: patched version.
        validate:   false       // Boolean: validate
    });

if (options.help) {
    console.log(CONSOLE_COLOR.YELLOW + USAGE + CONSOLE_COLOR.CLEAR);
    return;
}

if (options.verbose) {
}
if (options.patched) {
    WebModuleUtility.patched("./", function(err) {
}

if (options.validate) {
    WebModuleUtility.validate("./", function(err) {
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
        }
    }
    return options;
}

function _multiline(fn) { // @arg Function:
                          // @ret String:
    return (fn + "").split("\n").slice(1, -1).join("\n");
}

})((this || 0).self || global);

