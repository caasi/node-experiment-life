var Ree   = require("ree");
var _     = require("underscore")._;
var uuid  = require("node-uuid");

var validate = function(o) {
  var ret;

  if (_.isArray(o) || _.isNumber(o) || _.isString(o) || _.isBoolean(o)) {
    ret = o;
  } else {
    if (o.type && o.type === "function") {
      ret = function () {};
    } else {
      ret = o;
    }
  }

  if (_.isFunction(o) || _.isObject(o)) {
    Object.keys(o).forEach(function(key) {
      if (key === "type") return;
      ret[key] = validate(o[key]);
    });
  }

  return ret;
};

var expose = function(o) {
  var ret;

  if (_.isArray(o) || _.isNumber(o) || _.isString(o) || _.isBoolean(o)) {
    ret = o;
  } else if (_.isFunction(o)) {
    ret = { type: "function" };
  } else {
    ret = {};
  }

  if (ret !== o) {
    Object.keys(o).forEach(function(key) {
      ret[key] = expose(o[key]);
    });
  }

  return ret;
};

var DreeManager = (function() {
  var ret = {};
  var _registered = [];

  ret.register = function(id, obj) {
    if (_registered[id] === undefined) {
      _registered[id] = {
        src: obj,
        agent: Ree(obj),
        remotes: []
      };
    }
  }

  ret.request = function(id) {
    if (_registered[id] !== undefined) {
      return _registered[id].agent;
    } else {
      return undefined;
    }
  };

  ret.connect = function(transport) {
    transport.on("request", function(id, cc) {
      var dree = _registered[id], remote;

      if (dree !== undefined) {
        remote = expose(dree.src);
        remote.uuid = uuid.v4();
        dree.remotes[remote.uuid] = remote;

        dree.agent.on("bubble", function(cmd) {
          if (cmd.type === "set")
            transport.emit(remote.uuid, cmd);
        });

        transport.on(remote.uuid, function(cmd) {
          Ree.exec(dree.agent, cmd);
        });

        cc(remote);
      } else {
        cc(null);
      }
    });

    transport.on("release", function(id, remoteID) {
      var dree = _registered[id], remote;

      if (dree !== undefined) {
        remote = dree.remotes[remoteID];
        dree.agent.removeListener("bubble"); // need fix
        transport.removeAllListener(remoteID);
        delete dree.remotes[remoteID];
      }
    });
  };

  return ret;
}());

exports = module.exports = DreeManager;
