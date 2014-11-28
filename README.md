WireCloud Widget - Kurento One2One
==================================

A simple widget for creating a one-to-one call, using webrtc and Kurento
services.

Table of Contents
-----------------

- [Build](#build)
- [License](#copyright-and-license)

Build
-----

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

Copyright and license
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
