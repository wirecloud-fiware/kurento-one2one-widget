/*
 * Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global $*/

(function () {

    "use strict";

    jasmine.getFixtures().fixturesPath = 'src/test/fixtures/';

    var dependencyList = [
        'script',
        'div#jasmine-fixtures',
        'div.jasmine_html-reporter'
    ];

    var clearDocument = function clearDocument() {
        $('body > *:not(' + dependencyList.join(', ') + ')').remove();
    };

    var getWiringCallback = function getWiringCallback(endpoint) {
        var calls = MashupPlatform.wiring.registerCallback.calls;
        var count = calls.count();
        for (var i = count - 1; i >= 0; i--) {
            var args = calls.argsFor(i);
            if (args[0] === endpoint) {
                return args[1];
            }
        }
        return null;
    };

    describe("Kurento one2one widget", function () {

        var context = {
            'username': 'user1'
        };

        beforeEach(function () {
            loadFixtures('index.html');
            MashupPlatform.prefs.registerCallback.calls.reset();
            MashupPlatform.wiring.registerCallback.calls.reset();
        });

        afterEach(function () {
            clearDocument();
        });

        it("loads correctly when configured on stand-alone mode", function (done) {
            var preferences, widget;

            preferences = {
                'server-url': 'ws://kurento.example.com',
                'stand-alone': false
            };

            MashupPlatform.setStrategy(new MyStrategy(), {
                "MashupPlatform.context.get": context,
                "MashupPlatform.prefs.get": preferences
            });

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            setInterval(function () {
                if (widget.currentState === 3 /*REGISTERED*/) {
                    expect(widget.serverURL).toBe(preferences['server-url']);
                    expect(widget.standalone).toBe(preferences['stand-alone']);
                    expect(widget.fieldContainer.is(":visible")).toBeFalsy();
                    done();
                }
            }, 200);
        });

        it("registers a preference callback", function () {
            var widget;

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            expect(MashupPlatform.prefs.registerCallback).toHaveBeenCalledWith(jasmine.any(Function));
        });

        it("registers a callback for the user-id endpoint", function () {
            var widget;

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            expect(MashupPlatform.wiring.registerCallback).toHaveBeenCalledWith("user-id", jasmine.any(Function));
        });

        it("handles correctly events comming from the user-id endpoint once the user is registered", function (done) {
            var widget;

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            setInterval(function () {
                if (widget.currentState === 3 /*REGISTERED*/) {
                    var callback = getWiringCallback("user-id");
                    callback("Pedro");
                    expect(widget.currentState).toBe(5 /*ENABLED_CALL*/);
                    done();
                }
            }, 200);
        });
    });

})();