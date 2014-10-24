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

var ws = new WebSocket('ws://130.206.81.33:8080/one2one');
var webRtcPeer;

const DEBUG = true;


const NOT_REGISTERED = 0;
const REGISTERING    = 1;
const REGISTERED     = 2;

var host = null;

var registerState = null;
function setRegisterState(newState){
    switch (newState) {
        case NOT_REGISTERED:
            $('#host').attr('disabled', false);
            $('#join').attr('disabled', true);
            $('#show').attr('disabled', true);
            $('#stop').attr('disabled', true);
            break;
        case REGISTERING:
            $('#host').attr('disabled', true);
            break;
        case REGISTERED:
            setCallState(NO_CALL);
            break;
        default:
            return;
    };
    registerState = newState;
};


const NO_CALL = 0;
const CALLING = 1;
const IN_CALL = 2;


var callState = null;
function setCallState(newState){
    switch (newState) {
        case NO_CALL:
            $('#join').attr('disabled', false);
            break;
        case CALLING:
            $('#join').attr('disabled', true);
            break;
        case IN_CALL:
            $('#stop').attr('disabled', false);
            $('#show').attr('disabled', false);
            break;
        default:
            return;
    };
    callState = newState;
};


var videoInput, videoOutput;
window.onload = function() {
    setRegisterState(NOT_REGISTERED);
    videoInput = document.getElementById('videoInput');
    videoOutput = document.getElementById('videoOutput');

    ws.onopen = function () {
        register();
    }

    $('#form-join').submit(function (event) {
        call();
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
}

window.onbeforeunload = function() {
    ws.close();
}

ws.onmessage = function(message) {
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
        stop(true);
        break;
    default:
        console.error('Unrecognized message', parsedMessage);
    }
}

function resgisterResponse(message) {
    if(message.response == 'accepted'){
        setRegisterState(REGISTERED);
    } else {
        setRegisterState(NOT_REGISTERED);
        var errorMessage = message.message ? message.message : 'Unknown reason for register rejection.';
        console.log(errorMessage);
    }    
}

function callResponse(message) {
    if (message.response != 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        var errorMessage = message.message ? message.message : 'Unknown reason for call rejection.';
        console.log(errorMessage);
        stop(true);
    } else {
        setCallState(IN_CALL);
        webRtcPeer.processSdpAnswer(message.sdpAnswer);
    }
}

function startCommunication(message) {
    setCallState(IN_CALL);
    webRtcPeer.processSdpAnswer(message.sdpAnswer);
}

function incomingCall(message) {
    
    //If bussy just reject without disturbing user
    if(callState != NO_CALL){
        var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'bussy'
                
            };
            return sendMessage(response, "calling...");
    }
    
    setCallState(CALLING);
    if (confirm('User ' + message.from
            + ' is calling you. Do you accept the call?')) {
        showSpinner(videoInput, videoOutput);
        webRtcPeer = kurentoUtils.WebRtcPeer.startSendRecv(videoInput,
                videoOutput, function(sdp, wp) {
                    var response = {
                        id : 'incomingCallResponse',
                        from : message.from,
                        callResponse : 'accept',
                        sdpOffer : sdp
                    };
                    sendMessage(response, "Acepting call...");
                }, function(error){
                    setCallState(NO_CALL);
                });
    } else {
        var response = {
            id : 'incomingCallResponse',
            from : message.from,
            callResponse : 'reject',
            message : 'user declined'
        };
        sendMessage(response);
        stop(true);
    }
}

function register() {
    var username = MashupPlatform.context.get('username'),
        name     = MashupPlatform.mashup.context.get('name');

    host = username + "/" + name;
    setRegisterState(REGISTERING);
    sendMessage({id: 'register', name: host}, "Create room for " + host);
};

function call() {
    var peerName = document.getElementById('name').value;

    if(!peerName.length){
        window.alert("You must specify the peer name");
        return;
    }

    setCallState(CALLING);    
    showSpinner(videoInput, videoOutput);

    kurentoUtils.WebRtcPeer.startSendRecv(videoInput, videoOutput, function(
            offerSdp, wp) {
        webRtcPeer = wp;
        console.log('Invoking SDP offer callback function');
        var message = {
            id : 'call',
            from : host,
            to : peerName,
            sdpOffer : offerSdp
        };
        sendMessage(message, "");
    }, function(error){
        console.log(error);
        setCallState(NO_CALL);
    });
}

function stop(message) {
    setCallState(NO_CALL);
    if (webRtcPeer) {
        webRtcPeer.dispose();

        if (!message) {
            var message = {
                id : 'stop'
            }
            sendMessage(message, "");
        }
    }
    videoInput.src = '';
    videoOutput.src = '';
    hideSpinner(videoInput, videoOutput);
}

function sendMessage(data, message) {
    var requestData = JSON.stringify(data);

    if (DEBUG) {
        console.log('Message: ' + message + '; Data: ' + requestData);
    };
    ws.send(requestData);
};

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = '/static/images/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("/static/images/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = '/static/images/webrtc.png';
        arguments[i].style.background = '';
    }
}
