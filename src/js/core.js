/*
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

var Widget = (function () {

  'use strict';

  var Widget = function Widget(container_selector, modal_selector) {
    this.camera1 = $('<video>')
      .addClass('camera camera-lg')
      .attr('poster', 'images/webrtc.png')
      .attr('autoplay', true);

    this.camera2 = $('<video>')
      .addClass('camera camera-sm')
      .attr('poster', 'images/webrtc.png')
      .attr('autoplay', true);
    this.camera2.hide();

    this.alert = $('<div>')
      .addClass('alert alert-info');
    this.alert.hide();

    this.icon = $('<span>')
      .addClass('fa fa-phone');

    this.button1 = $('<button>')
      .addClass('btn btn-info btn-circle')
      .append($('<span>').addClass('fa fa-sign-in'))
      .tooltip({
        'title': 'Accept call waiting'
      });

    this.button2 = $('<button>')
      .addClass('btn btn-success btn-lg btn-circle')
      .append(this.icon)
      .tooltip({
        'title': function title() {
          if ($(this).hasClass('btn-success')) {
            return 'Call';
          } else {
            return 'End call';
          }
        }
      });

    this.button3 = $('<button>')
      .addClass('btn btn-info btn-circle')
      .append($('<span>').addClass('fa fa-camera'))
      .tooltip({
        'title': function title() {
          if ($(this).hasClass('active')) {
            return 'Hide small screen';
          } else {
            return 'Show small screen';
          }
        }
      });

    this.menu = $('<div>')
      .addClass('bottom-menu')
      .append(this.button1, this.button2, this.button3);
    this.menu.hide();

    this.modal = $(modal_selector);
    this.container = $(container_selector)
      .append(this.camera1, this.camera2, this.alert, this.menu);

    setState.call(this, state.UNREGISTERED);
    this.initEventHandlers();

    this.serverURL = 'ws://130.206.81.33:8080/call';
    this.clientName = 'jpajuelo/kurento';
    this.peerName = 'braulio/kurento';

    this.reconnect();
  };

  Widget.prototype = {

    'callRequest': function callRequest() {
      if (!this.peerName.length) {
        showAlert.call(this, 'Peername not selected.');
        return this;
      }

      setState.call(this, state.CALLING);
      kurentoUtils.WebRtcPeer.startSendRecv(this.camera1[0], this.camera2[0],
        function(offerSdp, wp) {
          this.peerWebRTC = wp;
          this.server.send(JSON.stringify({
            'id': 'call',
            'from': self.clientName,
            'to': self.peerName,
            'sdpOffer': offerSdp
          }));
        }.bind(this),
        function (error) {
          console.log(error);
          setState.call(self, state.REGISTERED);
        }.bind(this));
    },

    'callResponse': function callResponse(message) {
        if (message.response !== 'accepted') {
            console.info('Call not accepted by peer. Closing call');
            var errorMessage = message.message ? message.message : 'Unknown reason for call rejection.';
            console.log(errorMessage);
            dispose();
        } else {
            setCallState(IN_CALL);
            webRtcPeer.processSdpAnswer(message.sdpAnswer);
        }
    },

    'close': function close() {
      if (this.server) {
        this.server.close();
      }

      return this;
    },

    'initEventHandlers': function initEventHandlers() {
      this.button2.on('click', function (event) {
        if (this.button2.hasClass('btn-success')) {
          this.callRequest();
        } else {
          this.button2
            .removeClass('btn-danger')
            .addClass('btn-success');
          this.icon
            .removeClass('fa-tty')
            .addClass('fa-phone');
        }
      }.bind(this));

      this.button3.on('click', function (event) {
        if (this.button3.hasClass('active')) {
          this.button3.removeClass('active');
          this.camera2.fadeOut();
        } else {
          this.button3.addClass('active');
          this.camera2.fadeIn();
        }
      }.bind(this));

      this.container
        .on('mouseenter', function (event) {
          this.menu.fadeIn();
        }.bind(this))
        .on('mouseleave', function (event) {
          this.menu.fadeOut();
        }.bind(this));

      return this;
    },

    'reconnect': function reconnect() {
      this.server = new WebSocket(this.serverURL);
      this.server.onopen = this.registerRequest.bind(this);
      this.server.onmessage = receiveResponse.bind(this);

      return this;
    },

    'registerRequest': function registerRequest() {
      setState.call(this, state.UNREGISTERED);
      this.server.send(JSON.stringify({
        'id': 'register',
        'name': this.clientName
      }));

      return this;
    },

    'resgisterResponse': function resgisterResponse(data) {
      switch (data.response) {
        case 'accepted':
          setState.call(this, state.REGISTERED);
          break;
        default:
          setState.call(this, state.UNREGISTERED);
          console.log(data.message);
      }

      return this;
    }

  };

  var setState = function setState(new_state) {
    switch (new_state) {
      case state.CALLING:
        this.button2
          .removeClass('btn-success')
          .addClass('btn-danger');
        this.icon
          .removeClass('fa-phone')
          .addClass('fa-tty');
        this.camera1.attr('poster', 'images/transparent-1px.png');
        this.camera1.css({
          'background': 'center transparent url("images/spinner.gif") no-repeat'
        });
        break;
      case state.REGISTERED:
        showAlert.call(this, 'Registered as <strong>' + this.clientName + '</strong>');
        this.button2.attr('disabled', false);
        break;
      case state.UNREGISTERED:
        this.button1.attr('disabled', true);
        this.button2.attr('disabled', true);
        this.button3.attr('disabled', true);
        break;
      default:
        return this;
    }

    this.state = new_state;

    return this;
  };

  var showAlert = function showAlert(message) {
    this.alert
      .empty()
      .append(message)
      .fadeIn(400)
      .delay(800)
      .slideUp(400);

    return this;
  };

  var state = {'CALLING': 0, 'REGISTERED': 1, 'UNREGISTERED': 2};

  var receiveResponse = function receiveResponse(response) {
    var response_data = JSON.parse(response.data);

    switch (response_data.id) {
      case 'registerResponse':
        this.resgisterResponse(response_data);
        break;
      case 'callResponse':
        this.callResponse(response_data);
        break;
      default:
          console.error('Unrecognized', response_data);
    }

    return this;
  };

  return Widget;

})();

$(function () {

  var widget_instance = new Widget('#camera-container', '#incoming-modal');

  $(window).on('beforeunload', function () {
    widget_instance.close();
  });

});
