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


    describe("Test for widget preferences", function () {

        var context = {
            'username': 'user1'
        };

        beforeEach(function () {
            loadFixtures('index.html');
        });

        it("loads correctly the preference stand-alone", function () {
            var preferences, widget;

            preferences = {
                'server-url': 'ws://url1',
                'stand-alone': false
            };

            MashupPlatform.setStrategy(new MyStrategy(), {
                "MashupPlatform.context.get": context,
                "MashupPlatform.prefs.get": preferences
            });

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            expect(widget.serverURL).toBe(preferences['server-url']);
            expect(widget.standalone).toBe(preferences['stand-alone']);
            expect(widget.fieldContainer.is(":visible")).toBeFalsy();
        });

        it("registers a preference callback", function () {
            var widget;

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            expect(MashupPlatform.prefs.registerCallback).toHaveBeenCalled();
            var args = MashupPlatform.prefs.registerCallback.calls.mostRecent().args;
            expect(args.length).toBe(1);
            expect(args[0]).not.toBe(null);
        });

        afterEach(function () {
            clearDocument();
        });

    });

})();