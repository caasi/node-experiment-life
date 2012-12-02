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

var DreeManager = function(_transport) {
  var ret = {};
  var _registered = [];

  _transport.on("request", function(id, cc) {
    var dree = _registered[id], remote;

    if (dree !== undefined) {
      remote = expose(dree.src);
      remote.uuid = uuid.v4();
      dree.remotes[remote.uuid] = remote;

      dree.agent.on("bubble", function(cmd) {
        _transport.emit(remote.uuid, cmd);
      });

      _transport.on(remote.uuid, function(cmd) {
        Ree.exec(dree.agent, cmd);
      });

      cc(remote);
    } else {
      cc(null);
    }
  });

  _transport.on("release", function(id, remoteID) {
    var dree = _registered[id], remote;

    if (dree !== undefined) {
      remote = dree.remotes[remoteID];
      dree.agent.removeListener("bubble"); // need fix
      _transport.removeAllListener(remoteID);
      delete dree.remotes[remoteID];
    }
  });

  ret.register = function(id, obj) {
    if (_registered[id] === undefined) {
      _registered[id] = {
        src: obj,
        agent: Ree(obj),
        remotes: []
      };
    }
  }
};

exports = module.exports = DreeManager;
