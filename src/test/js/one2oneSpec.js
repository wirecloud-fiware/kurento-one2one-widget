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

        it("don't do nothing in acceptIncomingCall if don't have call", function(){
            testStates('all', function(widget) {
                widget.acceptIncomingCall.call(widget);
            }, function(widget, pre_state) {
                return pre_state == widget.currentState;
            }, function(widget) {
                widget.hasIncomingCall = false;
                return widget.hasIncomingCall === false;
            });
        });

        it("callPeer update state", function() {
            var states = ['ENABLED_CALL'];
            testStates(states, function(widget) {
                widget.callPeer.call(widget);
            }, function(widget, pre_state) {
                if (pre_state == test_methods.state.CALLING)
                    return false;
                return widget.currentState == test_methods.state.CALLING;
            }, function(widget) {
                widget.peername = "test";
                return true;
            });
        });

        it("don't do nothing is receivePeerName is invalid", function() {
            testStates('all', function(widget) {
                widget.receivePeername.call('', '');
            }, function(widget) {
                return widget.peername == null;
            });
        });

        it('test reconnect with all valid', function() {
            var states = ['UNREGISTERED', 'REGISTERED', 'ENABLED_CALL'];
            var server = {close: function() {}, send: function() {}};
            spyOn(server, 'close');
            testStates(states, function(widget) {
                widget.reconnect.call(widget);
            }, function(widget, pre_state) {
                var valid_state = states.indexOf(test_methods.state_from_int[pre_state]) != -1;
                if (valid_state) {
                    expect(server.close).toHaveBeenCalled();
                } else {
                    expect(server.close).not.toHaveBeenCalled();
                }
                expect(widget.server).not.toBeNull();
                return valid_state;
            }, function(widget) {
                widget.username = 'myusername';
                widget.serverURL = 'ws://kurento.example.com';
                server.close.calls.reset();
                widget.server = server;
                return typeof widget.server != 'undefined';
            });
        });

        it('test reconnect with not valid parameters', function() {
            var server = {close: function() {}, send: function() {}};
            var fcall = function(widget) {
                widget.reconnect.call(widget);
            };
            var fcheck = function(widget, pre_state) {
                expect(server.close).not.toHaveBeenCalled();
                expect(widget.server).not.toBeNull();
                return true;
            };
            var fpre = function(username, serverURL) {
                return function(widget) {
                    widget.username = username;
                    widget.serverURL = serverURL;
                    server.close.calls.reset();
                    widget.server = server;
                    return typeof widget.server != 'undefined';
                };
            };
            spyOn(server, 'close');
            testStates('all', fcall, fcheck, fpre('', 'ws://kurento.example.com')); // invalid username
            testStates('all', fcall, fcheck, fpre('valid', 'http://kurento.example.com')); // invalid url
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
            testStates(states, function(widget) {
                test_methods.performAction.call(widget, 'testname', 'call-peername');
            }, function(widget, pre_state) {
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
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates('all', function(widget) {
                test_methods.performAction.call(widget, 'testname', 'hangup-peername');
            }, function(widget, pre_state) {
                expect(disps.dispose).not.toHaveBeenCalled();
                return widget.currentState == pre_state;
            }, function(widget) {
                widget.connection = disps;
                return typeof widget.connection != 'undefined';
            });
        });


        it('test hangup with the same name', function() {
            var states = ['CALLING', 'BUSY_LINE'];
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates(states, function(widget) {
                test_methods.performAction.call(widget, 'testname', 'hangup-peername');
            }, function(widget, pre_state) {
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

        it('test onhangup', function() {
            var states = ['CALLING', 'ANSWERING', 'BUSY_LINE'];
            var disps = {dispose: function() {}};
            var server = {send: function() {}};
            spyOn(disps, 'dispose');
            spyOn(server, 'send');
            testStates(states, function(widget) {
                test_methods.peerRequest_onHangup.call(widget);
            }, function(widget, pre_state) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(server.send).toHaveBeenCalledWith(JSON.stringify({'id': 'stop'}));
                    expect(disps.dispose).toHaveBeenCalled();
                } else {
                    expect(server.send).not.toHaveBeenCalled();
                    expect(disps.dispose).not.toHaveBeenCalled();
                }
                if (pre_state == test_methods.state.ENABLED_CALL)
                    return false;
                return widget.currentState == test_methods.state.ENABLED_CALL;
            }, function(widget) {
                server.send.calls.reset();
                disps.dispose.calls.reset();
                widget.connection = disps;
                widget.server = server;
                return typeof widget.connection != 'undefined' && typeof widget.server != 'undefined';
            });
        });

        it('test on timeout', function() {
            var states = ['ANSWERING'];
            var disps = {dispose: function() {}};
            var server = {send: function() {}};
            spyOn(disps, 'dispose');
            spyOn(server, 'send');
            testStates(states, function(widget, pre_state) {
                test_methods.incomingCallTimeout.call(widget);
                if (pre_state == test_methods.state.ANSWERING)
                    test_methods.answerIncomingCall.call(widget);
            }, function(widget, pre_state) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(server.send).toHaveBeenCalledWith(JSON.stringify({"id":"incomingCallResponse","callResponse":"reject","message":"call-rejected"}));
                    expect(disps.dispose).toHaveBeenCalled();
                } else {
                    expect(server.send).not.toHaveBeenCalled();
                    expect(disps.dispose).not.toHaveBeenCalled();
                }
                if (pre_state == test_methods.state.ENABLED_CALL)
                    return false;
                return widget.currentState == test_methods.state.ENABLED_CALL;
            }, function(widget) {
                widget.peername = "test";
                server.send.calls.reset();
                disps.dispose.calls.reset();
                widget.connection = disps;
                widget.server = server;
                return typeof widget.connection != 'undefined' && typeof widget.server != 'undefined';
            });
        });

        // it("test buttomMuteToggle", function() {
        //     var btn1 = {hasClass: function(a) {return true;}, removeClass: function() {}, addClass: function() {}};
        //     spyOn(btn1, 'hasClass');
        //     spyOn(btn1, 'removeClass');
        //     spyOn(btn1, 'addClass');
        //     var btn2 = {hasClass: function(a) {return false;}, removeClass: function() {}, addClass: function() {}};
        //     spyOn(btn2, 'hasClass');
        //     spyOn(btn2, 'removeClass');
        //     spyOn(btn2, 'addClass');
        //     var act = {hide: function(){}, show: function(){}};
        //     spyOn(act, 'hide');
        //     spyOn(act, 'show');
        //     var act2 = {hide: function(){}, show: function(){}};
        //     spyOn(act2, 'hide');
        //     spyOn(act2, 'show');

        //     var fcall = function(btn) {
        //         return function(widget) {
        //             test_methods.buttonMuteToggle(btn, act, act2);
        //         };
        //     };

        //     var fcheck = function(btn, f1, f2, f3) {
        //         return function(widget) {
        //             expect(btn[f1]).toHaveBeenCalledWith('active');
        //             expect(act[f2]).toHaveBeenCalled();
        //             expect(act2[f3]).toHaveBeenCalled();
        //             return true;
        //         };
        //     };
        //     testStates('all', fcall(btn1), fcheck(btn1, 'removeClass', 'show', 'hide'));
        //     testStates('all', fcall(btn2), fcheck(btn2, 'addClass', 'hide', 'show'));
        // });


        it('cancel the incoming call', function() {
            var states = ['CALLING', 'ANSWERING', 'BUSY_LINE'];
            var pre_state = '';
            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates(states, function(widget) {
                pre_state = widget.currentState;
                widget.cancelIncomingCall.call(widget);
                test_methods.answerIncomingCall.call(widget);
            }, function(widget) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(disps.dispose).toHaveBeenCalled();
                } else {
                    expect(disps.dispose).not.toHaveBeenCalled();
                }
                if (pre_state == test_methods.state.REGISTERED)
                    return false;
                return widget.currentState == test_methods.state.REGISTERED;
            }, function(widget) {
                disps.dispose.calls.reset();
                widget.connection = disps;
                widget.hasIncomingCall = true;
                return typeof widget.connection != 'undefined' && widget.hasIncomingCall;
            });
        });

        it('peernameFieldShow works as expected', function() {
            var fieldContainer = {show: function() {}, hide: function() {}};
            spyOn(fieldContainer, 'show');
            spyOn(fieldContainer, 'hide');
            var fcall = function(v) {
                return function(widget) {
                    widget.fieldContainer = fieldContainer;
                    test_methods.peernameFieldCanShow.call(widget, v);
                };
            };
            var fcheck = function(v) {
                return function() {
                    expect(fieldContainer[v]).toHaveBeenCalled();
                    return true;
                };
            };
            testStates('all', fcall(true), fcheck('show'));
            testStates('all', fcall(false), fcheck('hide'));
        });



        it('Send message if notifycancel', function() {
            var states = ['CALLING', 'ANSWERING', 'BUSY_LINE'];
            var server = {send: function() {}};
            spyOn(server, 'send');

            var disps = {dispose: function() {}};
            spyOn(disps, 'dispose');
            testStates(states, function(widget) {
                test_methods.answerIncomingCall.call(widget);
            }, function(widget, pre_state) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(disps.dispose).toHaveBeenCalled();
                    expect(server.send).toHaveBeenCalledWith(JSON.stringify({id: 'incomingCallResponse', from: 'test', callResponse: 'reject', message: 'call-rejected'}));
                } else {
                    expect(disps.dispose).not.toHaveBeenCalled();
                    expect(server.send).not.toHaveBeenCalled();
                }
                if (pre_state == test_methods.state.ENABLED_CALL)
                    return false;
                return widget.currentState == test_methods.state.ENABLED_CALL;
            }, function(widget) {
                disps.dispose.calls.reset();
                server.send.calls.reset();
                widget.connection = disps;
                widget.server = server;
                widget.hasIncomingCall = true;
                widget.callAccepted = false;
                widget.notifyCancel = true;
                widget.peername = 'myname';
                widget.callername = 'test';
                return typeof widget.connection != 'undefined' && typeof widget.server != 'undefined' && widget.hasIncomingCall && widget.notifyCancel && !widget.callAccepted;
            });
        });


        it('send stop to the remote', function() {
            var states = ['CALLING', 'ANSWERING', 'BUSY_LINE', 'REGISTERED'];
            var pre_state = '';
            var disps = {dispose: function() {}};
            var server = {send: function() {}};

            spyOn(disps, 'dispose');
            spyOn(server, 'send');

            testStates(states, function(widget) {
                pre_state = widget.currentState;
                widget.hangupPeer.call(widget);
            }, function(widget) {
                if (states.indexOf(test_methods.state_from_int[pre_state]) != -1) {
                    expect(disps.dispose).toHaveBeenCalled();
                    expect(server.send).toHaveBeenCalledWith(JSON.stringify({"id": "stop"}));
                } else {
                    expect(disps.dispose).not.toHaveBeenCalled();
                    expect(server.send).not.toHaveBeenCalled();
                }
                if (pre_state == test_methods.state.ENABLED_CALL)
                    return false;
                return widget.currentState == test_methods.state.ENABLED_CALL;
            }, function(widget) {
                disps.dispose.calls.reset();
                server.send.calls.reset();
                widget.connection = disps;
                widget.server = server;
                widget.peername = "test";
                return typeof widget.connection != 'undefined' && typeof widget.server != 'undefined';
            });
        });

        it('close websocket', function() {
            var server = {close: function() {}};
            spyOn(server, 'close');
            testStates('all', function(widget) {
                widget.close.call(widget);
            }, function(widget) {
                expect(server.close).toHaveBeenCalled();
                expect(widget.server).toBeNull();
                return true;
            }, function(widget) {
                server.close.calls.reset();
                widget.server = server;
                return typeof widget.server != 'undefined';
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
                expect(prec(widget, i)).toBeTruthy();
                // MAIN FUNCTION
                f(widget, i);
                // POST CONDITION
                var res = condition(widget, i);
                // CHECK THE POST IN THE CORRECT STATE
                expect(res == (statesTrue.indexOf(val) != -1)).toBeTruthy();
            }
        }
    });
})();
