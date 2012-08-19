var io            = require("socket.io").listen(8080, {
                      "transports": ["websocket"],
                      "log level": 0
                    });
var EventEmitter  = require("eventemitter2").EventEmitter2;
var Ree           = require("ree");
var DObject       = require("./dobject");
var Life          = require("./life");

var gol = Life(30, 30);
var aol = Ree(gol);
var game = {};

EventEmitter.call(game);
game.__proto__ = EventEmitter.prototype;

setInterval(function() {
  // buggy if you mix original object and agent object
  aol.tick();
  game.emit("update");
}, 33);

io.sockets.on("connection", function(socket) {
  var emitCMD, collectCMD, cmdBuffer = [];

  socket.on("disconnect", function() {
    if (collectCMD) aol.off("bubble", collectCMD);
    if (emitCMD) game.off("update", emitCMD);
    cmdBuffer = null;
  });

  socket.on("life.cmd", function(cmd) {
    Ree.exec(aol, cmd);
  });

  collectCMD = function(cmd) {
    if (cmd.type === "set") {
      cmdBuffer.push(cmd);
    }
  };

  emitCMD = function() {
    socket.emit("life.cmds", cmdBuffer);
    cmdBuffer = [];
  };

  aol.on("bubble", collectCMD);
  game.on("update", emitCMD);

  /* ask client for rpcs with namespace */
  socket.emit("life", DObject.expose(gol));
});
