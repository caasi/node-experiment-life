var Ree   = require("ree");
var _     = require("underscore")._;

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

var DObject = {};

DObject.validate = validate;
DObject.expose = expose;

exports = module.exports = DObject;
