/*!
 * Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global $, kurentoUtils, MashupPlatform*/

(function () {

    "use strict";

    var ws = null;
    var webRtcPeer = null;

    var DEBUG = true;

    var NOT_REGISTERED = 0;
    var REGISTERING    = 1;
    var REGISTERED     = 2;

    var host = null;

    var registerState = null;
    var setRegisterState = function setRegisterState(newState) {
        switch (newState) {
            case NOT_REGISTERED:
                $('#host').attr('disabled', false);
                $('#join').attr('disabled', true);
                $('#show').attr('disabled', true);
                break;
            case REGISTERING:
                $('#host').attr('disabled', true);
                break;
            case REGISTERED:
                setCallState(NO_CALL);
                break;
            default:
                return;
        }
        registerState = newState;
    };

    var NO_CALL = 0;
    var CALLING = 1;
    var IN_CALL = 2;


    var callState = null;
    var setCallState = function setCallState(newState){
        switch (newState) {
            case NO_CALL:
                $('#join').attr('disabled', false);
                $('#stop').attr('disabled', true);
                pushEvent('call-status', 'NO_CALL');
                break;
            case CALLING:
                $('#join').attr('disabled', true);
                pushEvent('call-status', 'CALLING');
                break;
            case IN_CALL:
                $('#stop').attr('disabled', false);
                $('#show').attr('disabled', false);
                pushEvent('call-status', 'IN_CALL');
                break;
            default:
                return;
        }
        callState = newState;
    };

    var reconnect = function reconnect() {

        if (ws != null) {
            ws.close();
        }

        ws = new WebSocket(MashupPlatform.prefs.get('server-url'));
        ws.onopen = function () {
            register();
        };
        ws.onmessage = function (message) {
            var parsedMessage = JSON.parse(message.data);
            console.info('Received message: ' + message.data);

            switch (parsedMessage.id) {
            case 'registerResponse':
                resgisterResponse(parsedMessage);
                break;
            case 'callResponse':
                callResponse(parsedMessage);
                break;
            case 'incomingCall':
                incomingCall(parsedMessage);
                break;
            case 'startCommunication':
                startCommunication(parsedMessage);
                break;
            case 'stopCommunication':
                console.info("Communication ended by remote peer");
                dispose();
                break;
            default:
                console.error('Unrecognized message', parsedMessage);
            }
        };
    };

    var videoInput, videoOutput;
    window.onload = function () {
        setRegisterState(NOT_REGISTERED);
        videoInput = document.getElementById('videoInput');
        videoOutput = document.getElementById('videoOutput');

        $('#form-join').submit(function (event) {
            call(document.getElementById('name').value);
            return false;
        });

        $('#stop').click(function (event) {
            stop();
            return false;
        });

        $('#container').mouseover(function (event) {
            $('#video-camera-options').show();
        });
        $('#container').mouseout(function (event) {
            $('#video-camera-options').hide();
        });
        $('#show').click(function (event) {
            var $label = $(this).find('.fa');
            if ($label.hasClass('fa-eye')) {
                $label.attr('class', "fa fa-eye-slash");
                $('#video-camera-input').show();
            } else {
                $label.attr('class', "fa fa-eye");
                $('#video-camera-input').hide();
            }
        });

        reconnect();
        changeStandalone();
    };

    window.onbeforeunload = function () {
        ws.close();
    };

    var resgisterResponse = function resgisterResponse(message) {
        if (message.response === 'accepted') {
            setRegisterState(REGISTERED);
        } else {
            setRegisterState(NOT_REGISTERED);
            var errorMessage = message.message ? message.message : 'Unknown reason for register rejection.';
            console.log(errorMessage);
        }    
    };

    var callResponse = function callResponse(message) {
        if (message.response !== 'accepted') {
            console.info('Call not accepted by peer. Closing call');
            var errorMessage = message.message ? message.message : 'Unknown reason for call rejection.';
            console.log(errorMessage);
            dispose();
        } else {
            setCallState(IN_CALL);
            webRtcPeer.processSdpAnswer(message.sdpAnswer);
        }
    };

    var startCommunication = function startCommunication(message) {
        setCallState(IN_CALL);
        webRtcPeer.processSdpAnswer(message.sdpAnswer);
    };

    var incomingCall = function incomingCall(message) {
        var response;

        // Don't disturb the user if is busy
        if (callState != NO_CALL) {
            response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'busy'
                
            };
            return sendMessage(response, "calling...");
        }

        setCallState(CALLING);
        if (confirm('User ' + message.from + ' is calling you. Do you accept the call?')) {
            showSpinner(videoInput, videoOutput);
            webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(videoInput,
                    videoOutput, function(sdp, wp) {
                        var response = {
                            id: 'incomingCallResponse',
                            from: message.from,
                            callResponse: 'accept',
                            sdpOffer: sdp
                        };
                        sendMessage(response, "Acepting call...");
                    }, function(error){
                        setCallState(NO_CALL);
                    });
        } else {
            response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'user declined'
            };
            sendMessage(response);
            dispose();
        }
    };

    var register = function register() {
        var username = MashupPlatform.context.get('username'),
            name     = MashupPlatform.mashup.context.get('name');

        host = username + "/" + name;
        setRegisterState(REGISTERING);
        sendMessage({id: 'register', name: host}, "Create room for " + host);
    };

    var call = function call(peerName) {

        if (!peerName || !peerName.length) {
            window.alert("You must specify the peer name");
            return;
        }

        setCallState(CALLING);    
        showSpinner(videoInput, videoOutput);

        kurentoUtils.WebRtcPeer.startSendRecv(videoInput, videoOutput, function(offerSdp, wp) {
            webRtcPeer = wp;
            console.log('Invoking SDP offer callback function');
            var message = {
                id: 'call',
                from: host,
                to: peerName,
                sdpOffer: offerSdp
            };
            sendMessage(message, "");
        }, function (error) {
            console.log(error);
            setCallState(NO_CALL);
        });
    };

    var stop = function stop() {
        var message = {
            id : 'stop'
        };
        sendMessage(message, "");
        dispose();
    };

    var dispose = function dispose() {
        setCallState(NO_CALL);
        if (webRtcPeer) {
            webRtcPeer.dispose();
            webRtcPeer = null;
        }
        videoInput.src = '';
        videoOutput.src = '';
        hideSpinner(videoInput, videoOutput);
    };

    var sendMessage = function sendMessage(data, message) {
        var requestData = JSON.stringify(data);

        if (DEBUG) {
            console.log('Message: ' + message + '; Data: ' + requestData);
        }
        ws.send(requestData);
    };

    var showSpinner = function showSpinner() {
        for (var i = 0; i < arguments.length; i++) {
            arguments[i].poster = 'images/transparent-1px.png';
            arguments[i].style.background = 'center transparent url("images/spinner.gif") no-repeat';
        }
    };

    var hideSpinner = function hideSpinner() {
        for (var i = 0; i < arguments.length; i++) {
            arguments[i].poster = 'images/webrtc.png';
            arguments[i].style.background = '';
        }
    };

    var changeStandalone = function changeStandalone() {
        var standalone = MashupPlatform.prefs.get('standalone');

        if (!standalone) {
            $('#name').hide();
            $('#join').hide();
        } else {
            $('#name').show();
            $('#join').show();
        }
    };

    MashupPlatform.prefs.registerCallback(function () {
        changeStandalone();
        reconnect();
    });

    MashupPlatform.wiring.registerCallback('kurento-command', function (data) {
        var response = JSON.parse(data);
        if (response.action === 'call') {
            call(response.name);
        } else {
            stop();
        }
    });

})();
