(function () {

    "use strict";

    window.mockServer = new MockServer('ws://kurento.example.com');
    window.mockServer.on('connection', function (server) {

        server.on('message', function (event) {
            var data = JSON.parse(event.data);

            switch (data.id) {
            case "register":
                if (data.name === "alreadyregistereduser") {
                    server.send(JSON.stringify({
                        id: "registerResponse",
                        response: "rejected"
                    }));
                } else {
                    server.send(JSON.stringify({
                        id: "registerResponse",
                        response: "accepted"
                    }));
                }
                break;
            case "call":
                break;
            default:
            }
        });
    });

    window.WebSocket = MockSocket;
})();