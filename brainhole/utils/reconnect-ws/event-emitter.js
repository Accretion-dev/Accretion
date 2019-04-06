"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// simple event emitter that can be use in both js and node
var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.listeners = new Map();
  }

  _createClass(EventEmitter, [{
    key: "on",
    value: function on(label, callback) {
      this.listeners.has(label) || this.listeners.set(label, []);
      this.listeners.get(label).push(callback);
    }
  }, {
    key: "list",
    value: function list(label) {
      return this.listeners.get(label);
    }
  }, {
    key: "off",
    value: function off(label, callback) {
      var index = -1;
      var functions = this.listeners.get(label) || [];
      functions.some(function (item) {
        if (item === callback) {
          return true;
        } else {
          return false;
        }
      });
      if (index > -1) {
        return functions.splice(index, 1);
      } else {
        return false;
      }
    }
  }, {
    key: "emit",
    value: function emit(label) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var listeners = this.listeners.get(label);
      if (listeners && listeners.length) {
        listeners.forEach(function (listener) {
          listener.apply(undefined, args);
        });
        return true;
      }
      return false;
    }
  }]);

  return EventEmitter;
}();

exports.default = EventEmitter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy9ldmVudC1lbWl0dGVyLmpzIl0sIm5hbWVzIjpbIkV2ZW50RW1pdHRlciIsImxpc3RlbmVycyIsIk1hcCIsImxhYmVsIiwiY2FsbGJhY2siLCJoYXMiLCJzZXQiLCJnZXQiLCJwdXNoIiwiaW5kZXgiLCJmdW5jdGlvbnMiLCJzb21lIiwiaXRlbSIsInNwbGljZSIsImFyZ3MiLCJsZW5ndGgiLCJmb3JFYWNoIiwibGlzdGVuZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtJQUNNQSxZO0FBQ0osMEJBQWU7QUFBQTs7QUFDYixTQUFLQyxTQUFMLEdBQWlCLElBQUlDLEdBQUosRUFBakI7QUFDRDs7Ozt1QkFDR0MsSyxFQUFPQyxRLEVBQVU7QUFDbkIsV0FBS0gsU0FBTCxDQUFlSSxHQUFmLENBQW1CRixLQUFuQixLQUE2QixLQUFLRixTQUFMLENBQWVLLEdBQWYsQ0FBbUJILEtBQW5CLEVBQTBCLEVBQTFCLENBQTdCO0FBQ0EsV0FBS0YsU0FBTCxDQUFlTSxHQUFmLENBQW1CSixLQUFuQixFQUEwQkssSUFBMUIsQ0FBK0JKLFFBQS9CO0FBQ0Q7Ozt5QkFDS0QsSyxFQUFPO0FBQ1gsYUFBTyxLQUFLRixTQUFMLENBQWVNLEdBQWYsQ0FBbUJKLEtBQW5CLENBQVA7QUFDRDs7O3dCQUNJQSxLLEVBQU9DLFEsRUFBVTtBQUNwQixVQUFJSyxRQUFRLENBQUMsQ0FBYjtBQUNBLFVBQUlDLFlBQVksS0FBS1QsU0FBTCxDQUFlTSxHQUFmLENBQW1CSixLQUFuQixLQUE2QixFQUE3QztBQUNBTyxnQkFBVUMsSUFBVixDQUFlLGdCQUFRO0FBQ3JCLFlBQUlDLFNBQVNSLFFBQWIsRUFBdUI7QUFDckIsaUJBQU8sSUFBUDtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFPLEtBQVA7QUFDRDtBQUNGLE9BTkQ7QUFPQSxVQUFJSyxRQUFRLENBQUMsQ0FBYixFQUFnQjtBQUNkLGVBQU9DLFVBQVVHLE1BQVYsQ0FBaUJKLEtBQWpCLEVBQXdCLENBQXhCLENBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxlQUFPLEtBQVA7QUFDRDtBQUNGOzs7eUJBQ0tOLEssRUFBZ0I7QUFBQSx3Q0FBTlcsSUFBTTtBQUFOQSxZQUFNO0FBQUE7O0FBQ3BCLFVBQUliLFlBQVksS0FBS0EsU0FBTCxDQUFlTSxHQUFmLENBQW1CSixLQUFuQixDQUFoQjtBQUNBLFVBQUlGLGFBQWFBLFVBQVVjLE1BQTNCLEVBQW1DO0FBQ2pDZCxrQkFBVWUsT0FBVixDQUFrQixVQUFDQyxRQUFELEVBQWM7QUFDOUJBLG9DQUFZSCxJQUFaO0FBQ0QsU0FGRDtBQUdBLGVBQU8sSUFBUDtBQUNEO0FBQ0QsYUFBTyxLQUFQO0FBQ0Q7Ozs7OztrQkFHWWQsWSIsImZpbGUiOiJldmVudC1lbWl0dGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gc2ltcGxlIGV2ZW50IGVtaXR0ZXIgdGhhdCBjYW4gYmUgdXNlIGluIGJvdGgganMgYW5kIG5vZGVcbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKVxuICB9XG4gIG9uIChsYWJlbCwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmxpc3RlbmVycy5oYXMobGFiZWwpIHx8IHRoaXMubGlzdGVuZXJzLnNldChsYWJlbCwgW10pXG4gICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGxhYmVsKS5wdXNoKGNhbGxiYWNrKVxuICB9XG4gIGxpc3QgKGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChsYWJlbClcbiAgfVxuICBvZmYgKGxhYmVsLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleCA9IC0xXG4gICAgbGV0IGZ1bmN0aW9ucyA9IHRoaXMubGlzdGVuZXJzLmdldChsYWJlbCkgfHwgW11cbiAgICBmdW5jdGlvbnMuc29tZShpdGVtID0+IHtcbiAgICAgIGlmIChpdGVtID09PSBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9ucy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICBlbWl0IChsYWJlbCwgLi4uYXJncykge1xuICAgIGxldCBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQobGFiZWwpXG4gICAgaWYgKGxpc3RlbmVycyAmJiBsaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIoLi4uYXJncylcbiAgICAgIH0pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudEVtaXR0ZXJcbiJdfQ==