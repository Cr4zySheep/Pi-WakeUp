// ECMA-262, Edition 5, 15.4.4.18
// Référence: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var T, k;
    if (this == null) {
      throw new TypeError(' this vaut null ou n est pas défini');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' n est pas une fonction');
    }
    if (arguments.length > 1) {
      T = thisArg;
    }
    k = 0;

    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex appelé sur null ou undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate doit être une fonction');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find was called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
