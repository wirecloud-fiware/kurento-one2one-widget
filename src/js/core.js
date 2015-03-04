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

/*global $, kurentoUtils */


window.Widget = (function () {

    'use strict';

    var Widget = function Widget(containerSelector, modalSelector) {
        var cameraContainer, bottomMenu, buttonList;

        this.remoteCamera = $('<video>').addClass('camera camera-lg')
            .attr('autoplay', true).attr('poster', 'images/webrtc.png');
        this.localCamera = $('<video>').addClass('camera camera-sm')
            .attr('autoplay', true);

        this.banner = $('<span>').addClass('banner-title');
        this.spinnerManager = $('<div>').addClass('banner-loading')
            .append(this.banner, '<i class="fa fa-spinner fa-spin"></i>').hide();

        this.alertManager = $('<div>').hide();
        this.iconPhone = $('<span>').addClass('fa fa-phone');
        this.incomingCallModal = $(modalSelector);

        this.buttonAccept = $('<button>').addClass('btn btn-info btn-circle')
            .append($('<span>').addClass('fa fa-bell'))
            .tooltip({
                'title': 'Accept call waiting'
            });
        this.buttonCall = $('<button>').addClass('btn btn-success btn-lg btn-circle')
            .append(this.iconPhone)
            .tooltip({
                'title': function title() {
                    if ($(this).hasClass('btn-success')) {
                        return 'Call';
                    } else {
                        return 'End call';
                    }
                }
            });
        this.buttonShow = $('<button>').addClass('btn btn-info btn-circle')
            .append($('<span>').addClass('fa fa-video-camera'))
            .tooltip({
                'title': function title() {
                    if ($(this).hasClass('active')) {
                        return 'Hide your webcam';
                    } else {
                        return 'Show your webcam';
                    }
                }
            });

        this.field = $('<input>').addClass('form-control')
            .attr('type', 'text').attr('placeholder', 'Username');
        this.fieldContainer = $('<div>').addClass('standalone')
            .append(this.field);

        buttonList = $('<div>').addClass('button-list')
            .append(this.buttonAccept, this.buttonCall, this.buttonShow);

        bottomMenu = $('<div>').addClass('bottom-menu')
            .append(this.fieldContainer, buttonList).hide();
        cameraContainer = $(containerSelector)
            .append(this.remoteCamera, this.localCamera, this.alertManager, this.spinnerManager, bottomMenu);

        /* MashupPlatform - Preferences */

        MashupPlatform.prefs.registerCallback(function () {
            this.reload();
        }.bind(this));

        /* MashupPlatform - Input-Endpoints */

        MashupPlatform.wiring.registerCallback('user-id', function (peername) {
            this.receivePeername(peername, 'set-peername');
        }.bind(this));

        MashupPlatform.wiring.registerCallback('call-user', function (peername) {
            this.receivePeername(peername, 'call-peername');
        }.bind(this));

        MashupPlatform.wiring.registerCallback('hangup-user', function (peername) {
            this.receivePeername(peername, 'hangup-peername');
        }.bind(this));

        initHandlerGroup.call(this, cameraContainer, bottomMenu);
        updateState.call(this, state.UNREGISTERED);
    };

    /* ==================================================================================
     *  PUBLIC METHODS
     * ================================================================================== */

    Widget.prototype = {

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'acceptIncomingCall': function acceptIncomingCall() {
            if (this.hasIncomingCall) {
                this.callAccepted = true;
                this.incomingCallModal.modal('hide');
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'callPeer': function callPeer() {
            if (checkStringValid(this.peername) && checkStatesAllowed.call(this, [state.ENABLED_CALL])) {
                updateState.call(this, state.CALLING);

                // Kurento Dependency: create a WebRtcPeer to send and receive video.
                kurentoUtils.WebRtcPeer.startSendRecv(
                    this.localCamera[0], this.remoteCamera[0],
                    requestWebRtc_onSdp.bind(this), requestWebRtc_onError.bind(this));
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'cancelIncomingCall': function cancelIncomingCall() {
            if (this.hasIncomingCall) {
                this.callAccepted = false;
                this.incomingCallModal.modal('hide');
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'close': function close() {
            if (this.server != null) {
                if (!checkStatesAllowed.call(this, [state.UNREGISTERED])) {
                    this.server.close();
                    this.server = null;
                }
                this.server.close();
                this.server = null;
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'hangupPeer': function hangupPeer() {
            if (checkStringValid(this.peername) && !checkStatesAllowed.call(this, [state.UNREGISTERED, state.ENABLED_CALL])) {
                updateState.call(this, state.ENABLED_CALL);
                sendMessage.call(this, {
                    'id': 'stop'
                });
                freeWebRtcPeer.call(this);
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @param {String} peername
         * @param {String} [action]
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'receivePeername': function receivePeername(peername, action) {
            if (checkStringValid(peername)) {
                performAction.call(this, peername, action);
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'reconnect': function reconnect() {
            if (checkStatesAllowed.call(this, [state.UNREGISTERED, state.REGISTERED, state.ENABLED_CALL])) {
                if (checkStringValid(this.username) && checkStringValid(this.serverURL)) {
                    updateState.call(this, state.REGISTERED);
                    this.close();

                    this.server = new WebSocket(this.serverURL);
                    this.server.onopen = serverEvent_onOpen.bind(this);
                    this.server.onmessage = serverEvent_onMessage.bind(this);
                }
            }

            return this;
        },

        /**
         * @public
         * @function
         *
         * @returns {One2OneWidget} The instance on which this method was called.
         */
        'reload': function reload() {
            var reconnect;

            reconnect = true;

            this.username = MashupPlatform.context.get('username');
            this.standalone = MashupPlatform.prefs.get('stand-alone');

            var old_server = this.serverURL;
            this.serverURL = MashupPlatform.prefs.get('server-url');
            if (!checkValidURL(this.serverURL)) {
                MashupPlatform.widget.log('Bad server URL');
                reconnect = false;
            }

            if (this.server == null || (this.serverURL !== old_server)) {
                if (reconnect) {
                    this.reconnect();
                } else {
                    this.close();
                }
            }

            return this;
        }

    };

    /* ==================================================================================
     *  PRIVATE METHODS
     * ================================================================================== */

    /**
     * @private
     * @function
     */
    var answerIncomingCall = function answerIncomingCall() {
        if (!this.callAccepted) {
            sendMessage.call(this, {
                id: 'incomingCallResponse',
                from: this.callername,
                callResponse: 'reject',
                message: 'call-rejected'
            });
            freeWebRtcPeer.call(this);
            delete this.callername;
        } else {
            updateState.call(this, state.ANSWERING);
            this.connection = kurentoUtils.WebRtcPeer.startSendRecv(this.localCamera[0], this.remoteCamera[0],
                function (sdp, wp) {
                    sendMessage.call(this, {
                        id: 'incomingCallResponse',
                        from: this.callername,
                        callResponse: 'accept',
                        sdpOffer: sdp
                    });
                    showResponse.call(this, 'info', 'The call was connected successfully');
                    this.peername = this.callername;
                    delete this.callername;
                    updateState.call(this, state.BUSY_LINE);
                }.bind(this),
                function (error) {
                    MashupPlatform.widget.log('TODO');
                });
        }
        this.hasIncomingCall = false;

        return this;
    };

    /**
     * @private
     * @function
     */
    var centerButtonCanCall = function centerButtonCanCall(state) {
        this.buttonCall.attr('disabled', !state);
        this.buttonCall.removeClass('btn-danger').addClass('btn-success');
        this.iconPhone.removeClass('fa-hangup-phone');

        return this;
    };

    /**
     * @private
     * @function
     */
    var checkStatesAllowed = function checkStatesAllowed(stateList) {
        return stateList.indexOf(this.currentState) != -1;
    };

    /**
     * @private
     * @function
     */
    var checkStringValid = function checkStringValid(value) {
        return typeof value === 'string' && value.length;
    };

    /**
     * @private
     * @function
     */
    var checkValidURL = function checkValidURL(value) {
        if (!checkStringValid(value)) {
            return false;
        }

        try {
            var parsed_url = new URL(value);
            return ["ws:", "wss:"].indexOf(parsed_url.protocol) !== -1 && parsed_url.host !== "";
        } catch (e) {
            return false;
        }
    };

    /**
     * @private
     * @function
     */
    var freeWebRtcPeer = function freeWebRtcPeer() {
        // Kurento Dependency: free the resources used by WebRtcPeer.
        this.connection.dispose();
        delete this.connection;

        return this;
    };

    /**
     * @private
     * @function
     */
    var initHandlerGroup = function initHandlerGroup(cameraContainer, bottomMenu) {
        this.buttonCall.on('click', function (event) {
            if (this.buttonCall.hasClass('btn-success')) {
                this.callUser();
            } else {
                this.peerRequest_onHangup(this.peername);
            }
        }.bind(this));

        this.buttonShow.on('click', function (event) {
            if (this.buttonShow.hasClass('active')) {
                this.buttonShow.removeClass('active');
                this.localCamera.fadeOut();
            } else {
                this.buttonShow.addClass('active');
                this.localCamera.fadeIn();
            }
        }.bind(this));

        cameraContainer
            .on('mouseenter', function (event) {
                bottomMenu.fadeIn();
            })
            .on('mouseleave', function (event) {
                bottomMenu.fadeOut();
            });

        this.field.on('blur', function (event) {
            this.peername = this.field.val();
            if (this.peername.length) {
                updateState.call(this, state.ENABLED_CALL);
            }
        }.bind(this));

        this.incomingCallModal.find('#accept-call').on('click', function (event) {
            this.acceptIncomingCall();
        }.bind(this));

        this.incomingCallModal.on('hidden.bs.modal', answerIncomingCall.bind(this));

        return this;
    };

    /**
     * @private
     * @function
     */
    var peernameFieldCanShow = function peernameFieldCanShow(state) {
        if (state) {
            this.fieldContainer.show();
        } else {
            this.fieldContainer.hide();
        }

        return this;
    };

    /**
     * @private
     * @function
     */
    var performAction = function performAction(peername, action) {
        if (typeof action !== 'string') {
            action = "set-peername";
        }
        switch (action) {
            case 'call-peername':
                if (checkStatesAllowed.call(this, [state.REGISTERED, state.ENABLED_CALL])) {
                    this.peername = peername;
                    updateState.call(this, state.ENABLED_CALL);
                    this.callPeer();
                }
                break;
            case 'hangup-peername':
                if (checkStatesAllowed.call(this, [state.CALLING, state.BUSY_LINE]) && this.peername == peername) {
                    this.hangupPeer();
                }
                break;
            default:
            case 'set-peername':
                if (checkStatesAllowed.call(this, [state.REGISTERED, state.ENABLED_CALL])) {
                    this.peername = peername;
                    updateState.call(this, state.ENABLED_CALL);
                }
        }

        return this;
    };

    /**
     * @private
     * @function
     */
    var state = {'BUSY_LINE': 0, 'CALLING': 1, 'ANSWERING': 2, 'REGISTERED': 3, 'UNREGISTERED': 4, 'ENABLED_CALL': 5};

    /**
     * @private
     * @function
     */
    var updateState = function updateState(newState) {
        switch (newState) {
        case state.BUSY_LINE:
            this.buttonCall.attr('disabled', false);
            this.buttonShow.attr('disabled', false);
            this.remoteCamera.attr('poster', 'images/webrtc.png');
            this.spinnerManager.hide();
            if (this.standalone) {
                this.fieldContainer.hide();
            }
            MashupPlatform.wiring.pushEvent('call-status', 'BUSY_LINE');
            break;
        case state.ANSWERING:
            this.banner.empty().text('Answering . . .');
            MashupPlatform.wiring.pushEvent('call-status', 'ANSWERING');
            /* falls through */
        case state.CALLING:
            if (newState !== state.ANSWERING) {
                this.banner.empty().text('Calling . . .');
                MashupPlatform.wiring.pushEvent('call-status', 'CALLING');
            }
            this.buttonCall
                .removeClass('btn-success')
                .addClass('btn-danger');
            this.iconPhone
                .removeClass('fa-phone')
                .addClass('fa-tty');
            this.remoteCamera.attr('poster', 'images/transparent-1px.png');
            this.spinnerManager.show();
            if (this.standalone) {
                this.fieldContainer.hide();
            }
            break;
        case state.REGISTERED:
            this.buttonShow.removeClass('active').attr('disabled', true);
            this.localCamera.hide();
            this.remoteCamera.attr('src', '');
            this.localCamera.attr('src', '');
            this.remoteCamera.attr('poster', 'images/webrtc.png');
            this.spinnerManager.hide();
            this.buttonCall
                .removeClass('btn-danger')
                .addClass('btn-success');
            this.iconPhone
                .removeClass('fa-tty')
                .addClass('fa-phone');
            if (this.standalone) {
                this.fieldContainer.show();
                this.buttonCall.attr('disabled', false);
            } else {
                this.fieldContainer.hide();
                this.buttonCall.attr('disabled', true);
            }
            MashupPlatform.wiring.pushEvent('call-status', 'REGISTERED');
            break;
        case state.ENABLED_CALL:
            centerButtonCanCall.call(this, true);
            peernameFieldCanShow.call(this, this.standalone);
            this.buttonShow.removeClass('active').attr('disabled', true);
            this.localCamera.hide();
            this.remoteCamera.attr('src', '');
            this.localCamera.attr('src', '');
            this.remoteCamera.attr('poster', 'images/webrtc.png');
            this.spinnerManager.hide();
            MashupPlatform.wiring.pushEvent('call-state', 'ENABLED_CALL');
            break;
        default:
            this.buttonAccept.attr('disabled', true);
            this.buttonCall.attr('disabled', true);
            this.buttonShow.attr('disabled', true);
            this.localCamera.hide();
            this.fieldContainer.hide();
            MashupPlatform.wiring.pushEvent('call-status', 'UNREGISTERED');
            break;
        }

        this.currentState = newState;

        return this;
    };

    /* ==================================================================================
     *  EVENT HANDLERS
     * ================================================================================== */

    /**
     * @private
     * @function
     */
    var peerRequest_onHangup = function peerRequest_onHangup() {
        if (checkStatesAllowed.call(this, [state.CALLING, state.ANSWERING, state.BUSY_LINE])) {
            updateState.call(this, state.ENABLED_CALL);
            freeWebRtcPeer.call(this);
        }
    };

    /**
     * @private
     * @function
     */
    var peerRequest_onIncomingCall = function peerRequest_onIncomingCall(message) {
        if (checkStatesAllowed.call(this, [state.CALLING, state.ANSWERING, state.BUSY_LINE])) {
            sendMessage.call(this, {
                id: 'incomingCallResponse',
                from: message.from,
                callResponse: 'reject',
                message: 'busy'
            });
        } else {
            this.hasIncomingCall = true;
            this.callAccepted = false;
            this.callername = message.from;

            $('#incoming-user').text(this.callername);
            this.incomingCallModal.modal('show');
        }
    };

    /**
     * @private
     * @function
     */
     var requestWebRtc_onSdp = function requestWebRtc_onSdp(offerSdp, wp) {
        this.connection = wp;
        sendMessage.call(this, {
            'id': 'call',
            'from': this.username,
            'to': this.peername,
            'sdpOffer': offerSdp
        });
    };

    /**
     * @private
     * @function
     */
    var requestWebRtc_onError = function requestWebRtc_onError(error) {
        MashupPlatform.widget.log('TODO');
    };

    /**
     * @private
     * @function
     */
    var sendMessage = function sendMessage(data) {
        this.server.send(JSON.stringify(data));

        return this;
    };

    /**
     * @private
     * @function
     */
    var serverEvent_onMessage = function serverEvent_onMessage(event) {
        var message = JSON.parse(event.data);

        switch (message.id) {
            case 'registerResponse':
                serverResponse_onRegister.call(this, message);
                break;
            case 'callResponse':
                serverResponse_onCall.call(this, message);
                break;
            case 'incomingCall':
                peerRequest_onIncomingCall.call(this, message);
                break;
            case 'startCommunication':
                serverResponse_onComplete.call(this, message);
                break;
            case 'stopCommunication':
                peerRequest_onHangup.call(this);
                break;
            default:
                MashupPlatform.widget.log('TODO');
        }

        return this;
    };

    /**
     * @private
     * @function
     */
    var serverResponse_onCall = function serverResponse_onCall(data) {
        switch (data.response) {
        case 'accepted':
            showResponse.call(this, 'info', 'The call was connected successfully');
            updateState.call(this, state.BUSY_LINE);
            this.connection.processSdpAnswer(data.sdpAnswer);
            break;
        default:
            this.dispose();
            if (data.message == 'user declined') {
                showResponse.call(this, 'warning', "User <strong>" + this.peername + "</strong> rejected your call");
            } else if (data.message == 'busy') {
                showResponse.call(this, 'warning', "User <strong>" + this.peername + "</strong> line is busy right now");
            } else {
                showResponse.call(this, 'warning', "User <strong>" + this.peername + "</strong> is not registered");
            }
            updateState.call(this, state.ENABLED_CALL);
        }

        return this;
    };

    /**
     * @private
     * @function
     */
    var serverResponse_onComplete = function serverResponse_onComplete(message) {
        updateState.call(this, state.BUSY_LINE);
        // Kurento Dependency: invoke when and SDP answer is received.
        this.connection.processSdpAnswer(message.sdpAnswer);
    };

    /**
     * @private
     * @function
     */
    var serverEvent_onOpen = function serverEvent_onOpen() {
        sendMessage.call(this, {
            'id': 'register',
            'name': this.username
        });
    };

    /**
     * @private
     * @function
     */
    var serverResponse_onRegister = function serverResponse_onRegister(data) {
        switch (data.response) {
            case 'accepted':
                showResponse.call(this, 'info', 'You were registered successfully');
                if (checkStringValid(this.peername)) {
                    updateState.call(this, state.ENABLED_CALL);
                } else {
                    updateState.call(this, state.REGISTERED);
                }
                break;
            default:
                showResponse.call(this, 'warning', 'User <strong>' + this.username + '</strong> is already in use.');
                updateState.call(this, state.UNREGISTERED);
        }

        return this;
    };

    /**
     * @private
     * @function
     */
    var showResponse = function showResponse(type, response) {
        this.alertManager
            .removeClass().addClass('alert alert-' + type)
            .empty().append(response)
            .fadeIn(400).delay(900).slideUp(400);

        return this;
    };

    /* Testing code */
    window.test_methods = {
        peerRequest_onIncomingCall: peerRequest_onIncomingCall,
        checkValidURL: checkValidURL
    };
    /* End testing code */

    return Widget;

})();
