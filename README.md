Kurento One2One widget
======================

The kurento One2One widget is a WireCloud widget usable for adding
videoconference support to your dashboards in a simple way.

This videoconference support is based on the [one2one
service](https://github.com/Kurento/kurento-tutorial-node/tree/develop/kurento-one2one-call)
provided by the kurento community. You will need to deploy this service before
using this widget.

Latest version of this widget is always [provided in FIWARE
Lab](https://store.lab.fi-ware.org/search/keyword/KurentoStarterKit) where you
can make use of it on the [Mashup portal](https://mashup.lab.fi-ware.org).

Build
-----

Be sure to have installed [Node.js](http://node.js) and [Bower](http://bower.io)
in your system. For example, you can install it on Ubunutu and Debian running the
following commands:

```bash
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm install -g bower
```

Install other npm dependencies by running:

```bash
npm install
```

For build the widget you need download grunt:

```bash
sudo npm install -g grunt-cli
```

And now, you can use grunt:

```bash
grunt
```

If everything goes well, you will find a wgt file in the `dist` folder.

Settings and Usage
------------------

### Preferences

* `Server URL` - URL of the one 2 one server.
* `Standalone` - Allows choose the user for calling. Default is True.

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

### Usage

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
