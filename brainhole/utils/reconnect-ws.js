'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isNode = new Function("try {return this===global;}catch(e){return false;}");

if (isNode()) {
  global.WebSocket = require('ws');
  global.Promise = require('promise');
}

// function oneOffWsPromise ({url, data}) {
//   return new Promise((resolve, reject) => {
//     var server = new WebSocket(url)
//     server.onopen = () => {
//       server.send(JSON.stringify(data))
//     }
//     server.onmessage = (message) => {
//       let data = JSON.parse(message.data)
//       server.close()
//       resolve(data)
//     }
//     server.onerror = (error) => {
//       reject(error)
//     }
//   })
// }
// function reuseWSbyIDPromise ({ws, data}) {
//   // must have the id parameter
//   return new Promise((resolve, reject) => {
//     let id = data.id
//     let callback = (event) => {
//       let data = JSON.parse(event.data)
//       if (data.id === id) {
//         ws.removeEventListener('message', callback)
//         resolve(data)
//       }
//     }
//     ws.addEventListener('message', callback)
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(data))
//     } else {
//       let callback = () => {
//         ws.send(JSON.stringify(data))
//         ws.removeEventListener('open', callback)
//       }
//       ws.addEventListener('open', callback)
//     }
//   })
// }
function Sleep(time) {
  var start = void 0,
      end = void 0;
  start = new Date();
  while (true) {
    end = new Date();
    if (end - start > time) {
      break;
    }
  }
  // console.log('sleep ', end - start)
}

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.listeners = new Map();
  }

  _createClass(EventEmitter, [{
    key: 'on',
    value: function on(label, callback) {
      this.listeners.has(label) || this.listeners.set(label, []);
      this.listeners.get(label).push(callback);
    }
  }, {
    key: 'list',
    value: function list(label) {
      return this.listeners.get(label);
    }
  }, {
    key: 'off',
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
    key: 'emit',
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

var ReWebSocket = function (_EventEmitter) {
  _inherits(ReWebSocket, _EventEmitter);

  function ReWebSocket(configs) {
    _classCallCheck(this, ReWebSocket);

    var _this = _possibleConstructorReturn(this, (ReWebSocket.__proto__ || Object.getPrototypeOf(ReWebSocket)).call(this));

    _this.reconnectMaxCount = configs.reconnectMaxCount === undefined ? 5 : configs.reconnectMaxCount;
    _this.reconnectTotalMaxCount = configs.reconnectTotalMaxCount === undefined ? 50 : configs.reconnectTotalMaxCount;
    _this.reconnectTime = configs.reconnectTime || 2;
    _this.reconnectDelay = configs.reconnectDelay || 0;
    _this.name = configs.name || '';
    _this.forceReconnect = configs.forceReconnect || false;
    _this._reconnectCount = 0;
    _this._reconnectTotalCount = 0;
    _this.subscribe_history = [];
    _this.raise = configs.raise === undefined ? true : configs.raise === undefined;
    // badRate = {time: 600, maxCount: 3}
    _this.badRate = configs.badRate;
    _this.startTime = new Date();
    _this.reconnect_history = [];
    // on open
    _this._onopens = [];
    _this._onopen = function (event) {
      if (_this._reconnectCount > 0) {
        if (_this.subscribe_history) {
          console.info(_this.name + ' reconnect ' + _this.url + ' successfully!! redo subscribe', _this.subscribe_history, 'reconnectMaxCount: ' + configs.reconnectMaxCount);
          var reconnectCount = _this._reconnectCount;
          _this._subscribe_do();
          setTimeout(function () {
            if (_this.ws.subscribe_list_wait.length !== 0) {
              _this._reconnectCount = reconnectCount;
              _this.ws.close();
            }
          }, _this.reconnectTime * 1000 + _this.reconnectDelay);
        } else {
          console.info(_this.name + ' reconnect ' + _this.url + ' successfully!!');
        }
        _this._reconnectCount = 0;
      }
      if (_this._onopens.length) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _this._onopens[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var eachCallback = _step.value;

            eachCallback(event);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    };
    // on close
    _this._oncloses = [];
    _this._onclose = function (event) {
      _this.ws._meetclose = true;
      if (_this.forceReconnect || !event.reason) {
        if (!_this.ws._meeterror) {
          _this._reconnect(event);
        }
      } else {
        console.log(_this.name + ': ' + _this.url + ' normal close because', event.reason);
      }
      if (_this._oncloses.length) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = _this._oncloses[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var eachCallback = _step2.value;

            eachCallback(event);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    };
    // on error
    _this._onerrors = [];
    _this._onerror = function (event) {
      _this.ws._meeterror = true;
      if (!_this.ws._meetclose) {
        _this._reconnect(event);
      }
      if (_this._onerrors.length) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = _this._onerrors[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var eachCallback = _step3.value;

            eachCallback(event);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }
    };
    // on message
    _this._onmessages = [];
    _this._onmessage = function (event) {
      if (_this._onmessages.length) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = _this._onmessages[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var eachCallback = _step4.value;

            eachCallback(event);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }
    };

    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    _this.args = args;
    _this.ws = new (Function.prototype.bind.apply(WebSocket, [null].concat(args)))();
    _this.ws.__rews__ = _this.name;
    _this._config();
    _this.url = _this.ws.url;
    return _this;
  }

  _createClass(ReWebSocket, [{
    key: '_config',
    value: function _config() {
      this.ws.onopen = this._onopen;
      this.ws.onclose = this._onclose;
      this.ws.onerror = this._onerror;
      this.ws.onmessage = this._onmessage;
      this.ws._meeterror = false;
      this.ws._meetclose = false;
      this.ws.subscribe_list = [];
      this.ws.subscribe_list_wait = [];
    }
  }, {
    key: '_reconnect',
    value: function _reconnect(event) {
      var _this2 = this;

      // console.error(event)
      if (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
        this._reconnectTotalCount += 1;
        console.log(this.name + '  reconnecting ' + this.url + ' tries: ' + this._reconnectCount + '|' + this.reconnectMaxCount + ', total tries: ' + this._reconnectTotalCount + '|' + this.reconnectTotalMaxCount);
        if (this._reconnectCount < this.reconnectMaxCount && this._reconnectTotalCount < this.reconnectTotalMaxCount) {
          setTimeout(function () {
            // console.log(this._onopen, this._onclose, this._onerror, this._onmessage)
            _this2.reconnect_history.push(new Date());
            _this2._reconnectCount += 1;
            _this2.ws = new (Function.prototype.bind.apply(WebSocket, [null].concat(_toConsumableArray(_this2.args))))();
            _this2.ws.__rews__ = _this2.name;
            _this2._config();
          }, this.reconnectTime * 1000);
        } else {
          if (this.raise) {
            throw Error(this.name + '  Max reconnect number reached for ' + this.url + '! with single:' + this._reconnectCount + ', total: ' + this._reconnectTotalCount);
          } else {
            console.error(this.name + '  Max reconnect number reached for ' + this.url + '!');
          }
        }
      } else {
        console.error('should not be here', this.ws.readyState, this.ws);
      }
    }
  }, {
    key: 'wson',
    value: function wson(name, callback, add) {
      switch (name) {
        case 'message':
          if (add) {
            this._onmessages.push(callback);
          } else {
            this._onmessages = [callback];
          }
          break;
        case 'error':
          if (add) {
            this._onerrors.push(callback);
          } else {
            this._onerrors = [callback];
          }
          break;
        case 'close':
          if (add) {
            this._oncloses.push(callback);
          } else {
            this._oncloses = [callback];
          }
          break;
        case 'open':
          if (add) {
            this._onopens.push(callback);
          } else {
            this._onopens = [callback];
          }
          break;
        default:
          throw Error('only support message, close and open event, not ' + name);
      }
    }
  }, {
    key: 'wsoff',
    value: function wsoff(name, callback) {
      switch (name) {
        case 'message':
          if (callback) {
            if (this._onmessages.includes(callback)) {
              this._onmessages.splice(this._onmessages.indexOf(callback), 1);
            }
          } else {
            this._onmessages = [];
          }
          break;
        case 'close':
          if (callback) {
            if (this._oncloses.includes(callback)) {
              this._oncloses.splice(this._oncloses.indexOf(callback), 1);
            }
          } else {
            this._oncloses = [];
          }
          break;
        case 'open':
          if (callback) {
            if (this._onopens.includes(callback)) {
              this._onopens.splice(this._onopens.indexOf(callback), 1);
            }
          } else {
            this._onopens = [];
          }
          break;
        case 'error':
          if (callback) {
            if (this._onerrors.includes(callback)) {
              this._onerrors.splice(this._onerrors.indexOf(callback), 1);
            }
          } else {
            this._onerrors = [];
          }
          break;
      }
    }
  }, {
    key: '_subscribe_do',
    value: function _subscribe_do(resolve, reject, wsoff) {
      var _this3 = this;

      this.subscribe_message_data = {};
      this.subscribe_history.forEach(function (item) {
        var id = item.id;
        if (!_this3.ws.subscribe_list_wait.includes(id)) {
          _this3.ws.subscribe_list_wait.push(id);
          try {
            _this3.ws.send(JSON.stringify(item));
          } catch (error) {
            console.log(item);
            console.error('rews send subscribe error', error);
            _this3.ws.close();
            // throw error
          }
        }
      });
      if (this.ws.subscribe_list_wait.length) {
        var callback = function callback(event) {
          // console.log('one time request', event)
          var data = JSON.parse(event.data);
          if (_this3.ws.subscribe_list_wait.includes(data.id)) {
            // finish one
            var index = _this3.ws.subscribe_list_wait.indexOf(data.id);
            _this3.ws.subscribe_list_wait.splice(index, 1);
            _this3.ws.subscribe_list.push(data.id);
            _this3.subscribe_message_data[data.id] = data;
            if (_this3.ws.subscribe_list_wait.length === 0) {
              _this3.ws.onmessage = _this3._onmessage;
              console.log('subscribe successfully!', _this3.subscribe_history.map(function (o) {
                return o.id;
              }), _this3.name);
              if (wsoff) {
                _this3.wsoff('open', wsoff);
              }
              if (resolve) {
                resolve(_this3.subscribe_message_data);
              }
            }
          }
        };
        this.ws.onmessage = callback;
      } else {
        if (wsoff) {
          this.wsoff('open', wsoff);
        }
        if (resolve) {
          resolve({});
        }
      }
    }
  }, {
    key: 'subscribe',
    value: function subscribe(data) {
      var _this4 = this;

      this.subscribe_history.push(data);
      if (this.ws.readyState === WebSocket.OPEN) {
        return new Promise(function (resolve, reject) {
          _this4._subscribe_do(resolve, reject);
        });
      } else {
        return new Promise(function (resolve, reject) {
          var callback = function callback(event) {
            _this4._subscribe_do(resolve, reject, callback);
          };
          _this4.wson('open', callback, true);
        });
      }
    }
  }, {
    key: 'send',
    value: function send(data) {
      try {
        this.ws.send(data);
      } catch (error) {
        console.log(data);
        console.error('rews send error', error);
        throw error;
      }
    }
  }, {
    key: 'promised',
    value: function promised(data) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        var id = data.id;
        var callback = function callback(event) {
          var data = JSON.parse(event.data);
          if (data.id === id) {
            _this5.ws.onmessage = _this5._onmessage;
            resolve(data);
          }
        };
        _this5.ws.onmessage = callback;
        if (_this5.ws.readyState === WebSocket.OPEN) {
          try {
            _this5.ws.send(JSON.stringify(data));
          } catch (error) {
            console.error('send error!', error);
          }
        } else {
          var _callback = function _callback() {
            try {
              _this5.ws.send(JSON.stringify(data));
            } catch (error) {
              console.error('send error!', error);
            }
            _this5.ws.open = _this5._onopen;
          };
          _this5.ws.onopen = _callback;
        }
      });
    }
  }], [{
    key: 'onePromise',
    value: function onePromise(_ref) {
      var url = _ref.url,
          data = _ref.data,
          sleep = _ref.sleep,
          config = _ref.config;

      return new Promise(function (resolve, reject) {
        var callback = function callback() {
          var timeout = config && config.timeout;
          var now = new Date();
          var server = new WebSocket(url);
          var timer = void 0;
          var timeoutError = false;
          if (timeout) {
            timer = setTimeout(function () {
              timeoutError = true;
              server.close();
              reject(new Error('timeout ' + timeout));
            }, timeout * 1000);
          }
          server.onopen = function () {
            // clearTimeout(timer)
            try {
              server.send(JSON.stringify(data));
            } catch (error) {
              console.log(data);
              console.error('one promise send error', error);
              server.close();
              reject(error);
            }
          };
          server.onmessage = function (message) {
            clearTimeout(timer);
            var data = JSON.parse(message.data);
            server.close();
            resolve(data);
          };
          server.onerror = function (error) {
            if (!timeoutError) {
              clearTimeout(timer);
              server.close();
              reject(error);
            }
          };
        };
        if (sleep) {
          setTimeout(callback, sleep);
        } else {
          callback();
        }
      });
    }
  }]);

  return ReWebSocket;
}(EventEmitter);

exports.default = ReWebSocket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy5qcyJdLCJuYW1lcyI6WyJpc05vZGUiLCJGdW5jdGlvbiIsImdsb2JhbCIsIldlYlNvY2tldCIsInJlcXVpcmUiLCJQcm9taXNlIiwiU2xlZXAiLCJ0aW1lIiwic3RhcnQiLCJlbmQiLCJEYXRlIiwiRXZlbnRFbWl0dGVyIiwibGlzdGVuZXJzIiwiTWFwIiwibGFiZWwiLCJjYWxsYmFjayIsImhhcyIsInNldCIsImdldCIsInB1c2giLCJpbmRleCIsImZ1bmN0aW9ucyIsInNvbWUiLCJpdGVtIiwic3BsaWNlIiwiYXJncyIsImxlbmd0aCIsImZvckVhY2giLCJsaXN0ZW5lciIsIlJlV2ViU29ja2V0IiwiY29uZmlncyIsInJlY29ubmVjdE1heENvdW50IiwidW5kZWZpbmVkIiwicmVjb25uZWN0VG90YWxNYXhDb3VudCIsInJlY29ubmVjdFRpbWUiLCJyZWNvbm5lY3REZWxheSIsIm5hbWUiLCJmb3JjZVJlY29ubmVjdCIsIl9yZWNvbm5lY3RDb3VudCIsIl9yZWNvbm5lY3RUb3RhbENvdW50Iiwic3Vic2NyaWJlX2hpc3RvcnkiLCJyYWlzZSIsImJhZFJhdGUiLCJzdGFydFRpbWUiLCJyZWNvbm5lY3RfaGlzdG9yeSIsIl9vbm9wZW5zIiwiX29ub3BlbiIsImNvbnNvbGUiLCJpbmZvIiwidXJsIiwicmVjb25uZWN0Q291bnQiLCJfc3Vic2NyaWJlX2RvIiwic2V0VGltZW91dCIsIndzIiwic3Vic2NyaWJlX2xpc3Rfd2FpdCIsImNsb3NlIiwiZWFjaENhbGxiYWNrIiwiZXZlbnQiLCJfb25jbG9zZXMiLCJfb25jbG9zZSIsIl9tZWV0Y2xvc2UiLCJyZWFzb24iLCJfbWVldGVycm9yIiwiX3JlY29ubmVjdCIsImxvZyIsIl9vbmVycm9ycyIsIl9vbmVycm9yIiwiX29ubWVzc2FnZXMiLCJfb25tZXNzYWdlIiwiX19yZXdzX18iLCJfY29uZmlnIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJvbm1lc3NhZ2UiLCJzdWJzY3JpYmVfbGlzdCIsInJlYWR5U3RhdGUiLCJDTE9TRUQiLCJDTE9TSU5HIiwiRXJyb3IiLCJlcnJvciIsImFkZCIsImluY2x1ZGVzIiwiaW5kZXhPZiIsInJlc29sdmUiLCJyZWplY3QiLCJ3c29mZiIsInN1YnNjcmliZV9tZXNzYWdlX2RhdGEiLCJpZCIsInNlbmQiLCJKU09OIiwic3RyaW5naWZ5IiwiZGF0YSIsInBhcnNlIiwibWFwIiwibyIsIk9QRU4iLCJ3c29uIiwib3BlbiIsInNsZWVwIiwiY29uZmlnIiwidGltZW91dCIsIm5vdyIsInNlcnZlciIsInRpbWVyIiwidGltZW91dEVycm9yIiwibWVzc2FnZSIsImNsZWFyVGltZW91dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQU8sSUFBSUMsUUFBSixDQUFhLG9EQUFiLENBQWI7O0FBRUEsSUFBSUQsUUFBSixFQUFjO0FBQ1pFLFNBQU9DLFNBQVAsR0FBbUJDLFFBQVEsSUFBUixDQUFuQjtBQUNBRixTQUFPRyxPQUFQLEdBQWlCRCxRQUFRLFNBQVIsQ0FBakI7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTRSxLQUFULENBQWdCQyxJQUFoQixFQUFzQjtBQUNwQixNQUFJQyxjQUFKO0FBQUEsTUFBV0MsWUFBWDtBQUNBRCxVQUFRLElBQUlFLElBQUosRUFBUjtBQUNBLFNBQU8sSUFBUCxFQUFhO0FBQ1hELFVBQU0sSUFBSUMsSUFBSixFQUFOO0FBQ0EsUUFBSUQsTUFBTUQsS0FBTixHQUFjRCxJQUFsQixFQUF3QjtBQUN0QjtBQUNEO0FBQ0Y7QUFDRDtBQUNEOztJ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ZCxJQUFQLENBQVlDLEtBQUtDLFNBQUwsQ0FBZUMsSUFBZixDQUFaO0FBQ0QsYUFGRCxDQUVFLE9BQU9aLEtBQVAsRUFBYztBQUNkakMsc0JBQVFpQixHQUFSLENBQVk0QixJQUFaO0FBQ0E3QyxzQkFBUWlDLEtBQVIsQ0FBYyx3QkFBZCxFQUF3Q0EsS0FBeEM7QUFDQXVCLHFCQUFPaEQsS0FBUDtBQUNBOEIscUJBQU9MLEtBQVA7QUFDRDtBQUNGLFdBVkQ7QUFXQXVCLGlCQUFPN0IsU0FBUCxHQUFtQixVQUFDZ0MsT0FBRCxFQUFhO0FBQzlCQyx5QkFBYUgsS0FBYjtBQUNBLGdCQUFJWixPQUFPRixLQUFLRyxLQUFMLENBQVdhLFFBQVFkLElBQW5CLENBQVg7QUFDQVcsbUJBQU9oRCxLQUFQO0FBQ0E2QixvQkFBUVEsSUFBUjtBQUNELFdBTEQ7QUFNQVcsaUJBQU85QixPQUFQLEdBQWlCLFVBQUNPLEtBQUQsRUFBVztBQUMxQixnQkFBSSxDQUFDeUIsWUFBTCxFQUFtQjtBQUNqQkUsMkJBQWFILEtBQWI7QUFDQUQscUJBQU9oRCxLQUFQO0FBQ0E4QixxQkFBT0wsS0FBUDtBQUNEO0FBQ0YsV0FORDtBQU9ELFNBckNEO0FBc0NBLFlBQUltQixLQUFKLEVBQVc7QUFDVC9DLHFCQUFXckMsUUFBWCxFQUFxQm9GLEtBQXJCO0FBQ0QsU0FGRCxNQUVPO0FBQ0xwRjtBQUNEO0FBQ0YsT0E1Q00sQ0FBUDtBQTZDRDs7OztFQXhWdUJKLFk7O2tCQTJWWGtCLFciLCJmaWxlIjoicmVjb25uZWN0LXdzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaXNOb2RlPW5ldyBGdW5jdGlvbihcInRyeSB7cmV0dXJuIHRoaXM9PT1nbG9iYWw7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpO1xuXG5pZiAoaXNOb2RlKCkpIHtcbiAgZ2xvYmFsLldlYlNvY2tldCA9IHJlcXVpcmUoJ3dzJylcbiAgZ2xvYmFsLlByb21pc2UgPSByZXF1aXJlKCdwcm9taXNlJylcbn1cblxuLy8gZnVuY3Rpb24gb25lT2ZmV3NQcm9taXNlICh7dXJsLCBkYXRhfSkge1xuLy8gICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLy8gICAgIHZhciBzZXJ2ZXIgPSBuZXcgV2ViU29ja2V0KHVybClcbi8vICAgICBzZXJ2ZXIub25vcGVuID0gKCkgPT4ge1xuLy8gICAgICAgc2VydmVyLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4vLyAgICAgfVxuLy8gICAgIHNlcnZlci5vbm1lc3NhZ2UgPSAobWVzc2FnZSkgPT4ge1xuLy8gICAgICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSlcbi8vICAgICAgIHNlcnZlci5jbG9zZSgpXG4vLyAgICAgICByZXNvbHZlKGRhdGEpXG4vLyAgICAgfVxuLy8gICAgIHNlcnZlci5vbmVycm9yID0gKGVycm9yKSA9PiB7XG4vLyAgICAgICByZWplY3QoZXJyb3IpXG4vLyAgICAgfVxuLy8gICB9KVxuLy8gfVxuLy8gZnVuY3Rpb24gcmV1c2VXU2J5SURQcm9taXNlICh7d3MsIGRhdGF9KSB7XG4vLyAgIC8vIG11c3QgaGF2ZSB0aGUgaWQgcGFyYW1ldGVyXG4vLyAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4vLyAgICAgbGV0IGlkID0gZGF0YS5pZFxuLy8gICAgIGxldCBjYWxsYmFjayA9IChldmVudCkgPT4ge1xuLy8gICAgICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpXG4vLyAgICAgICBpZiAoZGF0YS5pZCA9PT0gaWQpIHtcbi8vICAgICAgICAgd3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGNhbGxiYWNrKVxuLy8gICAgICAgICByZXNvbHZlKGRhdGEpXG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBjYWxsYmFjaylcbi8vICAgICBpZiAod3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbi8vICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGxldCBjYWxsYmFjayA9ICgpID0+IHtcbi8vICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcbi8vICAgICAgICAgd3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3BlbicsIGNhbGxiYWNrKVxuLy8gICAgICAgfVxuLy8gICAgICAgd3MuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIGNhbGxiYWNrKVxuLy8gICAgIH1cbi8vICAgfSlcbi8vIH1cbmZ1bmN0aW9uIFNsZWVwICh0aW1lKSB7XG4gIGxldCBzdGFydCwgZW5kXG4gIHN0YXJ0ID0gbmV3IERhdGUoKVxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGVuZCA9IG5ldyBEYXRlKClcbiAgICBpZiAoZW5kIC0gc3RhcnQgPiB0aW1lKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICAvLyBjb25zb2xlLmxvZygnc2xlZXAgJywgZW5kIC0gc3RhcnQpXG59XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKVxuICB9XG4gIG9uIChsYWJlbCwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmxpc3RlbmVycy5oYXMobGFiZWwpIHx8IHRoaXMubGlzdGVuZXJzLnNldChsYWJlbCwgW10pXG4gICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGxhYmVsKS5wdXNoKGNhbGxiYWNrKVxuICB9XG4gIGxpc3QgKGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzLmdldChsYWJlbClcbiAgfVxuICBvZmYgKGxhYmVsLCBjYWxsYmFjaykge1xuICAgIGxldCBpbmRleCA9IC0xXG4gICAgbGV0IGZ1bmN0aW9ucyA9IHRoaXMubGlzdGVuZXJzLmdldChsYWJlbCkgfHwgW11cbiAgICBmdW5jdGlvbnMuc29tZShpdGVtID0+IHtcbiAgICAgIGlmIChpdGVtID09PSBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9ucy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICBlbWl0IChsYWJlbCwgLi4uYXJncykge1xuICAgIGxldCBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQobGFiZWwpXG4gICAgaWYgKGxpc3RlbmVycyAmJiBsaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIoLi4uYXJncylcbiAgICAgIH0pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5jbGFzcyBSZVdlYlNvY2tldCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yIChjb25maWdzLCAuLi5hcmdzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucmVjb25uZWN0TWF4Q291bnQgPSBjb25maWdzLnJlY29ubmVjdE1heENvdW50ID09PSB1bmRlZmluZWQgPyA1IDogY29uZmlncy5yZWNvbm5lY3RNYXhDb3VudFxuICAgIHRoaXMucmVjb25uZWN0VG90YWxNYXhDb3VudCA9IGNvbmZpZ3MucmVjb25uZWN0VG90YWxNYXhDb3VudCA9PT0gdW5kZWZpbmVkID8gNTAgOiBjb25maWdzLnJlY29ubmVjdFRvdGFsTWF4Q291bnRcbiAgICB0aGlzLnJlY29ubmVjdFRpbWUgPSBjb25maWdzLnJlY29ubmVjdFRpbWUgfHwgMlxuICAgIHRoaXMucmVjb25uZWN0RGVsYXkgPSBjb25maWdzLnJlY29ubmVjdERlbGF5IHx8IDBcbiAgICB0aGlzLm5hbWUgPSBjb25maWdzLm5hbWUgfHwgJydcbiAgICB0aGlzLmZvcmNlUmVjb25uZWN0ID0gY29uZmlncy5mb3JjZVJlY29ubmVjdCB8fCBmYWxzZVxuICAgIHRoaXMuX3JlY29ubmVjdENvdW50ID0gMFxuICAgIHRoaXMuX3JlY29ubmVjdFRvdGFsQ291bnQgPSAwXG4gICAgdGhpcy5zdWJzY3JpYmVfaGlzdG9yeSA9IFtdXG4gICAgdGhpcy5yYWlzZSA9IGNvbmZpZ3MucmFpc2UgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBjb25maWdzLnJhaXNlID09PSB1bmRlZmluZWRcbiAgICAvLyBiYWRSYXRlID0ge3RpbWU6IDYwMCwgbWF4Q291bnQ6IDN9XG4gICAgdGhpcy5iYWRSYXRlID0gY29uZmlncy5iYWRSYXRlXG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpXG4gICAgdGhpcy5yZWNvbm5lY3RfaGlzdG9yeSA9IFtdXG4gICAgLy8gb24gb3BlblxuICAgIHRoaXMuX29ub3BlbnMgPSBbXVxuICAgIHRoaXMuX29ub3BlbiA9IGV2ZW50ID0+IHtcbiAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RDb3VudCA+IDApIHtcbiAgICAgICAgaWYgKHRoaXMuc3Vic2NyaWJlX2hpc3RvcnkpIHtcbiAgICAgICAgICBjb25zb2xlLmluZm8oYCR7dGhpcy5uYW1lfSByZWNvbm5lY3QgJHt0aGlzLnVybH0gc3VjY2Vzc2Z1bGx5ISEgcmVkbyBzdWJzY3JpYmVgLCB0aGlzLnN1YnNjcmliZV9oaXN0b3J5LCBgcmVjb25uZWN0TWF4Q291bnQ6ICR7Y29uZmlncy5yZWNvbm5lY3RNYXhDb3VudH1gKVxuICAgICAgICAgIGxldCByZWNvbm5lY3RDb3VudCA9IHRoaXMuX3JlY29ubmVjdENvdW50XG4gICAgICAgICAgdGhpcy5fc3Vic2NyaWJlX2RvKClcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdENvdW50ID0gcmVjb25uZWN0Q291bnRcbiAgICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgdGhpcy5yZWNvbm5lY3RUaW1lICogMTAwMCArIHRoaXMucmVjb25uZWN0RGVsYXkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5pbmZvKGAke3RoaXMubmFtZX0gcmVjb25uZWN0ICR7dGhpcy51cmx9IHN1Y2Nlc3NmdWxseSEhYClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWNvbm5lY3RDb3VudCA9IDBcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbm9wZW5zLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBlYWNoQ2FsbGJhY2sgb2YgdGhpcy5fb25vcGVucykge1xuICAgICAgICAgIGVhY2hDYWxsYmFjayhldmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBvbiBjbG9zZVxuICAgIHRoaXMuX29uY2xvc2VzID0gW11cbiAgICB0aGlzLl9vbmNsb3NlID0gZXZlbnQgPT4ge1xuICAgICAgdGhpcy53cy5fbWVldGNsb3NlID0gdHJ1ZVxuICAgICAgaWYgKHRoaXMuZm9yY2VSZWNvbm5lY3QgfHwgIWV2ZW50LnJlYXNvbikge1xuICAgICAgICBpZiAoIXRoaXMud3MuX21lZXRlcnJvcikge1xuICAgICAgICAgIHRoaXMuX3JlY29ubmVjdChldmVudClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7dGhpcy5uYW1lfTogJHt0aGlzLnVybH0gbm9ybWFsIGNsb3NlIGJlY2F1c2VgLCBldmVudC5yZWFzb24pXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fb25jbG9zZXMubGVuZ3RoKSB7XG4gICAgICAgIGZvciAobGV0IGVhY2hDYWxsYmFjayBvZiB0aGlzLl9vbmNsb3Nlcykge1xuICAgICAgICAgIGVhY2hDYWxsYmFjayhldmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBvbiBlcnJvclxuICAgIHRoaXMuX29uZXJyb3JzID0gW11cbiAgICB0aGlzLl9vbmVycm9yID0gZXZlbnQgPT4ge1xuICAgICAgdGhpcy53cy5fbWVldGVycm9yID0gdHJ1ZVxuICAgICAgaWYgKCF0aGlzLndzLl9tZWV0Y2xvc2UpIHtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0KGV2ZW50KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29uZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBlYWNoQ2FsbGJhY2sgb2YgdGhpcy5fb25lcnJvcnMpIHtcbiAgICAgICAgICBlYWNoQ2FsbGJhY2soZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gb24gbWVzc2FnZVxuICAgIHRoaXMuX29ubWVzc2FnZXMgPSBbXVxuICAgIHRoaXMuX29ubWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICAgIGlmICh0aGlzLl9vbm1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBlYWNoQ2FsbGJhY2sgb2YgdGhpcy5fb25tZXNzYWdlcykge1xuICAgICAgICAgIGVhY2hDYWxsYmFjayhldmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYXJncyA9IGFyZ3NcbiAgICB0aGlzLndzID0gbmV3IFdlYlNvY2tldCguLi5hcmdzKVxuICAgIHRoaXMud3MuX19yZXdzX18gPSB0aGlzLm5hbWVcbiAgICB0aGlzLl9jb25maWcoKVxuICAgIHRoaXMudXJsID0gdGhpcy53cy51cmxcbiAgfVxuICBfY29uZmlnICgpIHtcbiAgICB0aGlzLndzLm9ub3BlbiA9IHRoaXMuX29ub3BlblxuICAgIHRoaXMud3Mub25jbG9zZSA9IHRoaXMuX29uY2xvc2VcbiAgICB0aGlzLndzLm9uZXJyb3IgPSB0aGlzLl9vbmVycm9yXG4gICAgdGhpcy53cy5vbm1lc3NhZ2UgPSB0aGlzLl9vbm1lc3NhZ2VcbiAgICB0aGlzLndzLl9tZWV0ZXJyb3IgPSBmYWxzZVxuICAgIHRoaXMud3MuX21lZXRjbG9zZSA9IGZhbHNlXG4gICAgdGhpcy53cy5zdWJzY3JpYmVfbGlzdCA9IFtdXG4gICAgdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0ID0gW11cbiAgfVxuICBfcmVjb25uZWN0IChldmVudCkge1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoZXZlbnQpXG4gICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0LkNMT1NFRCB8fCB0aGlzLndzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TSU5HKSB7XG4gICAgICB0aGlzLl9yZWNvbm5lY3RUb3RhbENvdW50ICs9IDFcbiAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMubmFtZX0gIHJlY29ubmVjdGluZyAke3RoaXMudXJsfSB0cmllczogJHt0aGlzLl9yZWNvbm5lY3RDb3VudH18JHt0aGlzLnJlY29ubmVjdE1heENvdW50fSwgdG90YWwgdHJpZXM6ICR7dGhpcy5fcmVjb25uZWN0VG90YWxDb3VudH18JHt0aGlzLnJlY29ubmVjdFRvdGFsTWF4Q291bnR9YClcbiAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RDb3VudCA8IHRoaXMucmVjb25uZWN0TWF4Q291bnQgJiYgdGhpcy5fcmVjb25uZWN0VG90YWxDb3VudCA8IHRoaXMucmVjb25uZWN0VG90YWxNYXhDb3VudCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLl9vbm9wZW4sIHRoaXMuX29uY2xvc2UsIHRoaXMuX29uZXJyb3IsIHRoaXMuX29ubWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnJlY29ubmVjdF9oaXN0b3J5LnB1c2gobmV3IERhdGUoKSlcbiAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RDb3VudCArPSAxXG4gICAgICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQoLi4udGhpcy5hcmdzKVxuICAgICAgICAgIHRoaXMud3MuX19yZXdzX18gPSB0aGlzLm5hbWVcbiAgICAgICAgICB0aGlzLl9jb25maWcoKVxuICAgICAgICB9LCB0aGlzLnJlY29ubmVjdFRpbWUgKiAxMDAwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMucmFpc2UpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcihgJHt0aGlzLm5hbWV9ICBNYXggcmVjb25uZWN0IG51bWJlciByZWFjaGVkIGZvciAke3RoaXMudXJsfSEgd2l0aCBzaW5nbGU6JHt0aGlzLl9yZWNvbm5lY3RDb3VudH0sIHRvdGFsOiAke3RoaXMuX3JlY29ubmVjdFRvdGFsQ291bnR9YClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3RoaXMubmFtZX0gIE1heCByZWNvbm5lY3QgbnVtYmVyIHJlYWNoZWQgZm9yICR7dGhpcy51cmx9IWApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignc2hvdWxkIG5vdCBiZSBoZXJlJywgdGhpcy53cy5yZWFkeVN0YXRlLCB0aGlzLndzKVxuICAgIH1cbiAgfVxuICB3c29uIChuYW1lLCBjYWxsYmFjaywgYWRkKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdtZXNzYWdlJzpcbiAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgIHRoaXMuX29ubWVzc2FnZXMucHVzaChjYWxsYmFjaylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbm1lc3NhZ2VzID0gW2NhbGxiYWNrXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgIGlmIChhZGQpIHtcbiAgICAgICAgICB0aGlzLl9vbmVycm9ycy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29uZXJyb3JzID0gW2NhbGxiYWNrXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChhZGQpIHtcbiAgICAgICAgICB0aGlzLl9vbmNsb3Nlcy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29uY2xvc2VzID0gW2NhbGxiYWNrXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgIHRoaXMuX29ub3BlbnMucHVzaChjYWxsYmFjaylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbm9wZW5zID0gW2NhbGxiYWNrXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBFcnJvcihgb25seSBzdXBwb3J0IG1lc3NhZ2UsIGNsb3NlIGFuZCBvcGVuIGV2ZW50LCBub3QgJHtuYW1lfWApXG4gICAgfVxuICB9XG4gIHdzb2ZmIChuYW1lLCBjYWxsYmFjaykge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnbWVzc2FnZSc6XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGlmICh0aGlzLl9vbm1lc3NhZ2VzLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgdGhpcy5fb25tZXNzYWdlcy5zcGxpY2UodGhpcy5fb25tZXNzYWdlcy5pbmRleE9mKGNhbGxiYWNrKSwgMSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25tZXNzYWdlcyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX29uY2xvc2VzLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgdGhpcy5fb25jbG9zZXMuc3BsaWNlKHRoaXMuX29uY2xvc2VzLmluZGV4T2YoY2FsbGJhY2spLCAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbmNsb3NlcyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBpZiAodGhpcy5fb25vcGVucy5pbmNsdWRlcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIHRoaXMuX29ub3BlbnMuc3BsaWNlKHRoaXMuX29ub3BlbnMuaW5kZXhPZihjYWxsYmFjayksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29ub3BlbnMgPSBbXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGlmICh0aGlzLl9vbmVycm9ycy5pbmNsdWRlcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIHRoaXMuX29uZXJyb3JzLnNwbGljZSh0aGlzLl9vbmVycm9ycy5pbmRleE9mKGNhbGxiYWNrKSwgMSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25lcnJvcnMgPSBbXVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIF9zdWJzY3JpYmVfZG8gKHJlc29sdmUsIHJlamVjdCwgd3NvZmYpIHtcbiAgICB0aGlzLnN1YnNjcmliZV9tZXNzYWdlX2RhdGEgPSB7fVxuICAgIHRoaXMuc3Vic2NyaWJlX2hpc3RvcnkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGxldCBpZCA9IGl0ZW0uaWRcbiAgICAgIGlmICghdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0LmluY2x1ZGVzKGlkKSkge1xuICAgICAgICB0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQucHVzaChpZClcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoaXRlbSkpXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coaXRlbSlcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdyZXdzIHNlbmQgc3Vic2NyaWJlIGVycm9yJywgZXJyb3IpXG4gICAgICAgICAgdGhpcy53cy5jbG9zZSgpXG4gICAgICAgICAgLy8gdGhyb3cgZXJyb3JcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgaWYgKHRoaXMud3Muc3Vic2NyaWJlX2xpc3Rfd2FpdC5sZW5ndGgpIHtcbiAgICAgIGxldCBjYWxsYmFjayA9IGV2ZW50ID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ29uZSB0aW1lIHJlcXVlc3QnLCBldmVudClcbiAgICAgICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpXG4gICAgICAgIGlmICh0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQuaW5jbHVkZXMoZGF0YS5pZCkpIHsgLy8gZmluaXNoIG9uZVxuICAgICAgICAgIGxldCBpbmRleCA9IHRoaXMud3Muc3Vic2NyaWJlX2xpc3Rfd2FpdC5pbmRleE9mKGRhdGEuaWQpXG4gICAgICAgICAgdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0LnNwbGljZShpbmRleCwgMSlcbiAgICAgICAgICB0aGlzLndzLnN1YnNjcmliZV9saXN0LnB1c2goZGF0YS5pZClcbiAgICAgICAgICB0aGlzLnN1YnNjcmliZV9tZXNzYWdlX2RhdGFbZGF0YS5pZF0gPSBkYXRhXG4gICAgICAgICAgaWYgKHRoaXMud3Muc3Vic2NyaWJlX2xpc3Rfd2FpdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMud3Mub25tZXNzYWdlID0gdGhpcy5fb25tZXNzYWdlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgc3Vic2NyaWJlIHN1Y2Nlc3NmdWxseSFgLCB0aGlzLnN1YnNjcmliZV9oaXN0b3J5Lm1hcChvID0+IG8uaWQpLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICBpZiAod3NvZmYpIHtcbiAgICAgICAgICAgICAgdGhpcy53c29mZignb3BlbicsIHdzb2ZmKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnN1YnNjcmliZV9tZXNzYWdlX2RhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IGNhbGxiYWNrXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh3c29mZikge1xuICAgICAgICB0aGlzLndzb2ZmKCdvcGVuJywgd3NvZmYpXG4gICAgICB9XG4gICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICByZXNvbHZlKHt9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBzdWJzY3JpYmUgKGRhdGEpIHtcbiAgICB0aGlzLnN1YnNjcmliZV9oaXN0b3J5LnB1c2goZGF0YSlcbiAgICBpZiAodGhpcy53cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlX2RvKHJlc29sdmUsIHJlamVjdClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjYWxsYmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3N1YnNjcmliZV9kbyhyZXNvbHZlLCByZWplY3QsIGNhbGxiYWNrKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMud3Nvbignb3BlbicsIGNhbGxiYWNrLCB0cnVlKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbiAgc2VuZCAoZGF0YSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLndzLnNlbmQoZGF0YSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ3Jld3Mgc2VuZCBlcnJvcicsIGVycm9yKVxuICAgICAgdGhyb3cgZXJyb3JcbiAgICB9XG4gIH1cbiAgcHJvbWlzZWQgKGRhdGEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGlkID0gZGF0YS5pZFxuICAgICAgbGV0IGNhbGxiYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKVxuICAgICAgICBpZiAoZGF0YS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IHRoaXMuX29ubWVzc2FnZVxuICAgICAgICAgIHJlc29sdmUoZGF0YSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSBjYWxsYmFja1xuICAgICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignc2VuZCBlcnJvciEnLCBlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NlbmQgZXJyb3IhJywgZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMud3Mub3BlbiA9IHRoaXMuX29ub3BlblxuICAgICAgICB9XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gY2FsbGJhY2tcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHN0YXRpYyBvbmVQcm9taXNlICh7dXJsLCBkYXRhLCBzbGVlcCwgY29uZmlnfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgIGxldCB0aW1lb3V0ID0gY29uZmlnICYmIGNvbmZpZy50aW1lb3V0XG4gICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgICAgIGxldCBzZXJ2ZXIgPSBuZXcgV2ViU29ja2V0KHVybClcbiAgICAgICAgbGV0IHRpbWVyXG4gICAgICAgIGxldCB0aW1lb3V0RXJyb3IgPSBmYWxzZVxuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aW1lb3V0RXJyb3IgPSB0cnVlXG4gICAgICAgICAgICBzZXJ2ZXIuY2xvc2UoKVxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgdGltZW91dCAke3RpbWVvdXR9YCkpXG4gICAgICAgICAgfSwgdGltZW91dCAqIDEwMDApXG4gICAgICAgIH1cbiAgICAgICAgc2VydmVyLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAvLyBjbGVhclRpbWVvdXQodGltZXIpXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlcnZlci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignb25lIHByb21pc2Ugc2VuZCBlcnJvcicsIGVycm9yKVxuICAgICAgICAgICAgc2VydmVyLmNsb3NlKClcbiAgICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2VydmVyLm9ubWVzc2FnZSA9IChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpXG4gICAgICAgICAgc2VydmVyLmNsb3NlKClcbiAgICAgICAgICByZXNvbHZlKGRhdGEpXG4gICAgICAgIH1cbiAgICAgICAgc2VydmVyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAoIXRpbWVvdXRFcnJvcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgICAgc2VydmVyLmNsb3NlKClcbiAgICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzbGVlcCkge1xuICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBzbGVlcClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlV2ViU29ja2V0XG4iXX0=