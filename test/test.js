var ModuleTestWebModuleUtility = (function(global) {

var _runOnNode = "process" in global;
var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

return new Test("WebModuleUtility", {
        disable:    false,
        browser:    false,
        worker:     false,
        node:       true,
        button:     true,
        both:       false, // test the primary module and secondary module
    }).add([
        testWebModuleUtility_patched,
    ]).run().clone();

function testWebModuleUtility_patched(test, pass, miss) {

    WebModuleUtility.patched();

    if (1) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

})((this || 0).self || global);

