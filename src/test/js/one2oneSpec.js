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

/*global $, kurentoUtils, test_methods*/

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
        var async_interval = null;

        beforeEach(function () {
            loadFixtures('index.html');
            MashupPlatform.prefs.registerCallback.calls.reset();
            MashupPlatform.wiring.registerCallback.calls.reset();
            kurentoUtils.withErrors = false;
        });

        afterEach(function () {
            clearDocument();
            if (async_interval != null) {
                clearTimeout(async_interval);
                async_interval = null;
            }
        });

        it("loads correctly when configured on standalone mode", function (done) {
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
            widget.reload();

            setInterval(function () {
                if (widget.currentState === 3) { // REGISTERED
                    expect(widget.serverURL).toBe(preferences['server-url']);
                    expect(widget.standalone).toBe(preferences['stand-alone']);
                    expect(widget.fieldContainer.is(":visible")).toBeFalsy();
                    done();
                }
            }, 200);
        });

        it("validates correctly server urls (empty url)", function () {
            expect(test_methods.checkValidURL("")).toBeFalsy();
        });

        it("validates correctly server urls (bad scheme definition)", function () {
            expect(test_methods.checkValidURL("ws:adfasd")).toBeFalsy();
        });

        it("validates correctly server urls (valid ws url)", function () {
            expect(test_methods.checkValidURL("ws://example.com")).toBeTruthy();
        });

        it("validates correctly server urls (valid wss url)", function () {
            expect(test_methods.checkValidURL("wss://example.com")).toBeTruthy();
        });

        it("validates correctly server urls (invalid http url)", function () {
            expect(test_methods.checkValidURL("http://example.com")).toBeFalsy();
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
            widget.reload();

            async_interval = setInterval(function () {
                if (widget.currentState === 3) { // REGISTERED
                    var callback = getWiringCallback("user-id");
                    callback("Pedro");
                    expect(widget.currentState).toBe(5); // ENABLED_CALL
                    done();
                }
            }, 200);
        });

        it("handles correctly events comming from the user-id endpoint once the user is not standalone", function (done) {
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
            widget.reload();

            async_interval = setInterval(function () {
                if (widget.currentState === 3) { // REGISTERED
                    var callback = getWiringCallback("user-id");
                    callback("Pedro");
                    expect(widget.currentState).toBe(5); // ENABLED_CALL
                    done();
                }
            }, 200);
        });

        it("checks that can't register a username already used", function () {
            var preferences, widget;

            preferences = {
                'server-url': 'ws://kurento.example.com',
                'stand-alone': true
            };

            MashupPlatform.setStrategy(new MyStrategy(), {
                "MashupPlatform.context.get": {
                    'username': "alreadyregistereduser"
                },
                "MashupPlatform.prefs.get": preferences
            });

            widget = new Widget('#jasmine-fixtures', '#incoming-modal');

            expect(widget.currentState).toBe(4); // UNREGISTERED

        });

        it("disables correctly the call button when standalone is inactive", function (done) {
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
            widget.reload();

            async_interval = setInterval(function() {
                if (widget.currentState === 3) { // REGISTERED
                    expect(widget.standalone).toBe(preferences['stand-alone']);
                    expect(widget.buttonCall.attr('disabled')).toEqual("disabled");
                    done();
                }
            }, 200);
        });

        it("handles correctly transition between buttons in an incoming call", function (done) {
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
            widget.reload();

            test_methods.peerRequest_onIncomingCall.call(widget, {'from': "test1"});
            expect(widget.callername).toEqual("test1");

            widget.acceptIncomingCall();

            async_interval = setInterval(function() {
                if (widget.currentState === 0) { //BUSY_LINE
                    expect(widget.buttonCall.hasClass('btn-danger')).toBe(true);
                    done();
                }
            }, 200);
        });

        it("test freeWebRtc without connection", function() {
            testStates('all', function(widget) {
                test_methods.freeWebRtcPeer.call(widget);
            }, function(widget) {
                return typeof widget.connection == 'undefined';
            }, function(widget) {
                return typeof widget.connection == 'undefined';
            });
        });

        it("test freeWebRtc with connection", function() {
            // var widget;
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');

            testStates('all', function(widget) {
                test_methods.freeWebRtcPeer.call(widget);
            }, function(widget) {
                expect(disps.dispose).toHaveBeenCalled();
                disps.dispose.calls.reset();
                return typeof widget.connection == 'undefined';
            }, function(widget) {
                widget.connection = disps;
                return typeof widget.connection != 'undefined';
            });
        });

        it("test set-name with default", function() {
            testStates(['REGISTERED', 'ENABLED_CALL'], function(widget) {
                test_methods.performAction.call(widget, 'testname', 1);
            }, function(widget) {
                return widget.peername === 'testname';
            }, function(widget) {
                return typeof widget.peername == 'undefined';
            });
        });

        it("test performAction default is set name", function() {
            testStates(['REGISTERED', 'ENABLED_CALL'], function(widget) {
                test_methods.performAction.call(widget, 'testname', 'notreallyanaction');
            }, function(widget) {
                return widget.peername === 'testname';
            }, function(widget) {
                return typeof widget.peername == 'undefined';
            });
        });

        it('test performAction with call peername', function() {
            var states = ['REGISTERED', 'ENABLED_CALL'];
            var pre_state = '';
            testStates(states, function(widget) {
                pre_state = widget.currentState;
                test_methods.performAction.call(widget, 'testname', 'call-peername');
            }, function(widget) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(kurentoUtils.WebRtcPeer.startSendRecv).toHaveBeenCalled();
                } else {
                    expect(kurentoUtils.WebRtcPeer.startSendRecv).not.toHaveBeenCalled();
                }
                if (pre_state == 1)
                    return false;
                return widget.currentState == test_methods.state.CALLING;
            });
        });

        it('test hangup with different name', function() {
            var pre_state = '';
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates('all', function(widget) {
                pre_state = widget.currentState;
                test_methods.performAction.call(widget, 'testname', 'hangup-peername');
            }, function(widget) {
                expect(disps.dispose).not.toHaveBeenCalled();
                return widget.currentState == pre_state;
            }, function(widget) {
                widget.connection = disps;
                return typeof widget.connection != 'undefined';
            });
        });


        it('test hangup with the same name', function() {
            var states = ['CALLING', 'BUSY_LINE'];
            var pre_state = '';
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates(states, function(widget) {
                pre_state = widget.currentState;
                test_methods.performAction.call(widget, 'testname', 'hangup-peername');
            }, function(widget) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(disps.dispose).toHaveBeenCalled();
                    disps.dispose.calls.reset();
                } else {
                    expect(disps.dispose).not.toHaveBeenCalled();
                }
                if (pre_state == 5)
                    return false;
                return widget.currentState == test_methods.state.ENABLED_CALL;
            }, function(widget) {
                widget.peername = 'testname';
                widget.connection = disps;
                return typeof widget.connection != 'undefined';
            });
        });

        it("Don't cancel if not call", function() {
            var pre_state = '';
            testStates('all', function(widget){
                pre_state = widget.currentState;
                widget.cancelIncomingCall.call(widget);
            }, function(widget){
                return widget.currentState == pre_state;
            });
        });

        it('cancel the incoming ', function() {
            var states = ['CALLING', 'ANSWERING', 'BUSY_LINE'];
            var pre_state = '';
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates('all', function(widget) {
                pre_state = widget.currentState;
                widget.cancelIncomingCall.call(widget);
                test_methods.answerIncomingCall.call(widget);
            }, function(widget) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(disps.dispose).toHaveBeenCalled();
                    return widget.currentState == test_methods.state.REGISTERED;
                } else {
                    expect(disps.dispose).not.toHaveBeenCalled();
                    return widget.currentState == pre_state;
                }
            }, function(widget) {
                disps.dispose.calls.reset();
                widget.connection = disps;
                widget.hasIncomingCall = true;
                return typeof widget.connection != 'undefined' && widget.hasIncomingCall;
            });
        });

        /**
         * Test with all the states!
         * statesTrue: List of states where the condition will be true
         * f: Function to call after the initialization
         * condition: post-condition to test
         * prec: Pre-condition to test, can de undefined
         */
        function testStates(statesTrue, f, condition, prec) {
            var i, widget;
            var all = Object.keys(test_methods.state);
            prec = prec || function(widget) {return true;}; // default precondition
            // if statesTrue it's not an array, have to be done in all states
            statesTrue = (statesTrue.constructor === Array ) ? statesTrue : all;
            for (i in test_methods.state_from_int) {
                // INITIALIZATION
                widget = new Widget('#jasmine-fixtures', '#incoming-modal');
                widget.reload();
                kurentoUtils.WebRtcPeer.startSendRecv.calls.reset(); // Reset :)
                // UPDATE TO THE NEW STATE
                var val = test_methods.state_from_int[i];
                widget = test_methods.updateState.call(widget, test_methods.state[val], false);
                // PRECONDITION
                expect(prec(widget)).toBeTruthy();
                // MAIN FUNCTION
                f(widget);
                // POST CONDITION
                var res = condition(widget);
                // CHECK THE POST IN THE CORRECT STATE
                expect(res == (statesTrue.indexOf(val) != -1)).toBeTruthy();
            }
        }

    });
})();
