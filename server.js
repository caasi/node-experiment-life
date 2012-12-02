var io            = require("socket.io").listen(8080, {
                      "transports": ["websocket"],
                      "log level": 0
                    });
var EventEmitter  = require("eventemitter2").EventEmitter2;
var Ree           = require("ree");
var DreeManager   = require("./dree");
var Life          = require("./life");

DreeManager.register("life", Life(30, 30));
var agent = DreeManager.request("life");

setInterval(function() {
  agent.tick();
}, 33);

io.sockets.on("connection", function(socket) {
  DreeManager.connect(socket);
});
