var ModuleTestWebModuleUtility = (function(global) {

var _runOnNode = "process" in global;
var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

return new Test("WebModuleUtility", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        button:     true,
        both:       true, // test the primary module and secondary module
    }).add([
        testWebModuleUtility_value,
        testWebModuleUtility_isNumber,
        testWebModuleUtility_isInteger,
    ]).run().clone();

function testWebModuleUtility_value(test, pass, miss) {

    var result = new WebModuleUtility(123.4).value();

    if (result === 123.4) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testWebModuleUtility_isNumber(test, pass, miss) {

    var result = [
            new WebModuleUtility(123.4).isNumber(),  // true
            new WebModuleUtility(123.0).isNumber()   // true
        ];

    if (!/false/.test(result.join())) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testWebModuleUtility_isInteger(test, pass, miss) {

    var result = [
           !new WebModuleUtility(123.4).isInteger(), // !false -> true
            new WebModuleUtility(123.0).isInteger()  // true
        ];

    if (!/false/.test(result.join())) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

})((this || 0).self || global);

