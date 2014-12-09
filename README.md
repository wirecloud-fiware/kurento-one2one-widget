Web Widget - One-2-One Video Call
=================================

A simple web widget that allows join a video call. This video call is
one-2-one, that is, users A and B can call each other to join a video
conference.

To do this possible, this widget uses a media service with full WebRTC support
supplied by [Kurento](http://www.kurento.org/). Furthermore, this widget
provides input and output endpoints which are compatible under WireCloud Platform.

Table of Contents
-----------------

- [Getting Started](#getting-started)
- [Settings and Usage](#settings-and-usage)
- [Release History](#release-history)
- [Copyright and License](#copyright-and-license)

Getting Started
---------------

Be sure to have installed [Node.js](http://node.js) and
[Bower](http://bower.io) in your system:

```bash
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install -y nodejs
sudo npm install -g bower
```

Install other npm dependencies by running:

```bash
npm install
```

And build the widget using grunt:

```bash
grunt
```

If everything goes well, you will find a wgt file in the `dist` folder.

Settings and Usage
-----

### Preferences

- `Server URL` - Type String. URL of Media Server with WebRTC support.

- `Standalone` - Type Boolean. Allows choose the user for calling. Default is
  True.

### Wiring

##### Input Endpoints

- `Call user` - Type String. Calls the user received only if the current status
  of the call is **registered**.

- `Hang up user` - Type String. Hangs up the user received only if the current
  status of the call is **calling** or **busy line**.

  > **Note**: if user received is not the user of the call, the widget will do
  > nothing and notify about that.

##### Output Endpoints

- `Call status` - Type String. Sends the current status of the call only if
  the status is changed. The status list is the following: UNREGISTERED -
  REGISTERED - CALLING - BUSY_LINE.

### Functionalities

##### Automatic Registration 

When the widget is loaded, you will be automatically registered on the given
Media Server.

> **Note**: in the latest version, you will be registered as
> `username/workspace_name`.

##### Call/Hang Up an User

Once you are registered successfully, the middle button will be available for
calling an user. This user must be registered in the same Media Server and
will be given through input endpoint `Call user` or text field that appears
when the `standalone` is active.

On the other hand when you are calling a user or on a call, the same button
allows end the call.

##### Show/Hide Local Webcam

Whereas you are on a call, the button on the right allows show or hide your
webcam.

##### Answer/Decline an Incoming Call

Finally, if an user wants to stablish a call, the widget displays a sliding
modal which allows to you choose to answer the incoming call or decline it.

Release History
--------

- 2014-12-9   v1.0.9   First official release for WireCloud.

Copyright and License
---------------------

Copyright 2014 CoNWeT Lab., Universidad Politecnica de Madrid

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
