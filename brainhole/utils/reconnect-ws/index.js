'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventEmitter = require('./event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isNode = new Function("try {return this===global;}catch(e){return false;}");
if (isNode()) {
  global.WebSocket = require('ws');
  global.Promise = require('promise');
}

var ReWebSocket = function (_EventEmitter) {
  _inherits(ReWebSocket, _EventEmitter);

  function ReWebSocket(configs) {
    _classCallCheck(this, ReWebSocket);

    /* each time you lose the connection, we will try max reconnectMaxCount times and then throw error
       if your total retry times is larger than reconnectTotalMaxCount, we will also throw a error
    */
    var _this = _possibleConstructorReturn(this, (ReWebSocket.__proto__ || Object.getPrototypeOf(ReWebSocket)).call(this));

    _this.reconnectMaxCount = configs.reconnectMaxCount === undefined ? 5 : configs.reconnectMaxCount;
    _this.reconnectTime = configs.reconnectTime || 2;
    _this.reconnectDelay = configs.reconnectDelay || 0;
    // name to use in the log output
    _this.name = configs.name || '';
    // force reconnect event in normal close
    _this.forceReconnect = configs.forceReconnect || false;
    _this._reconnectCount = 0;
    _this._reconnectTotalCount = 0;

    _this.subscribe_history = [];
    _this.raise = configs.raise === undefined ? true : configs.raise;
    _this.badRate = configs.badRate;
    _this.startTime = new Date();
    _this.reconnect_history = [];
    // on open
    _this._onopens = []; // store callbacks when ws is open
    _this._onopen = async function (event) {
      // redo onopens
      if (_this._onopens.length) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _this._onopens[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var eachCallback = _step.value;

            await eachCallback(event);
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
      // then redo subscribe
      if (_this._reconnectCount > 0) {
        if (_this.subscribe_history.length) {
          console.info(_this.name + ' reconnect ' + _this.url + ' successfully!! redo subscribe', _this.subscribe_history, 'reconnectMaxCount: ' + configs.reconnectMaxCount);
          var reconnectCount = _this._reconnectCount;
          _this._subscribe_do();
          // all subscribes must have reply, or do reconnect again
          setTimeout(function () {
            if (_this.ws.subscribe_list_wait.length !== 0) {
              _this._reconnectCount = reconnectCount;
              _this.ws.close();
            }
          }, _this.reconnectTime * 1000 + _this.reconnectDelay);
        } else {
          console.info(_this.name + ' reconnect ' + _this.url + ' successfully!! nothing to subscribe');
        }
        // the reconnect is now successful, reset reconnectCount to 0
        _this._reconnectCount = 0;
      }
    };
    // on close
    _this._oncloses = [];
    _this._onclose = function (event) {
      _this.ws._meetclose = true;
      if (_this.forceReconnect || !event.reason) {
        if (!_this.ws._meeterror) {
          console.log(_this.name + ': ' + _this.url + ' abnormally closed with no reason');
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

    // init behaviors

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
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
        console.log(this.name + '  reconnecting ' + this.url + ' tries: ' + this._reconnectCount + '|' + this.reconnectMaxCount + ', total tries: ' + this._reconnectTotalCount);
        if (this._reconnectCount < this.reconnectMaxCount) {
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
            throw Error(this.name + '  Max reconnect number reached for ' + this.url + '! with single:' + this._reconnectCount);
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
        // send subscribe command and push the id into wait list
        if (!_this3.ws.subscribe_list_wait.includes(id)) {
          _this3.ws.subscribe_list_wait.push(id);
          try {
            _this3.ws.send(JSON.stringify(item));
          } catch (error) {
            console.log('rews send subscribe error:', error.message, item);
            _this3.ws.close();
            if (reject) {
              return reject(error);
            }
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
              // replace onmessage function to receive subscription message
              _this3.ws.onmessage = _this3._onmessage;
              console.log('subscribe successfully!', _this3.subscribe_history.map(function (o) {
                return o.id;
              }), _this3.name);
              if (wsoff) {
                _this3.wsoff('open', wsoff);
              }
              if (resolve) {
                // do not return here
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
    value: function subscribe(datas) {
      var _this4 = this;

      // datas is a array of data, all data should have id
      // return a promise, you should add new ws.onmessage after this promise is resolved
      if (!datas.every(function (_) {
        return !!_.id;
      })) {
        throw Error('all subscribe data must have id');
      }
      this.subscribe_history = datas;
      if (this.ws.readyState === WebSocket.OPEN) {
        // when you add a subscription after ws is open
        return new Promise(function (resolve, reject) {
          _this4._subscribe_do(resolve, reject);
        });
      } else {
        return new Promise(function (resolve, reject) {
          // when you add a subscription before ws is open
          var callback = function callback(event) {
            _this4._subscribe_do(resolve, reject, callback);
          };
          _this4.wson('open', callback, true); // add this callback into ws.open callbacks
        });
      }
    }
  }, {
    key: 'send',
    value: function send(data) {
      try {
        this.ws.send(data);
      } catch (error) {
        console.log('rews send error:', error.message, data);
        throw error;
      }
    }
  }, {
    key: 'init',
    value: function init(data) {
      var _this5 = this;

      // assume this is the first data send to server, the server will repeat the id
      return new Promise(function (resolve, reject) {
        var id = data.id;
        var callback = function callback(event) {
          var data = JSON.parse(event.data);
          if (data.id === id) {
            _this5.ws.onmessage = _this5._onmessage;
            return resolve(data);
          }
        };
        _this5.ws.onmessage = callback;
        if (_this5.ws.readyState === WebSocket.OPEN) {
          try {
            _this5.ws.send(JSON.stringify(data));
          } catch (error) {
            console.error('init send error:', error.message, data);
            return reject(error);
          }
        } else {
          var _callback = function _callback() {
            try {
              _this5.ws.send(JSON.stringify(data));
            } catch (error) {
              console.error('init send error:', error.message, data);
              return reject(error);
            }
            _this5.ws.open = _this5._onopen;
          };
          _this5.ws.onopen = _callback;
        }
      });
    }
  }, {
    key: 'promised',
    value: function promised(data) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        var id = data.id;
        var callback = function callback(event) {
          var data = JSON.parse(event.data);
          if (data.id === id) {
            _this6.ws.onmessage = _this6._onmessage;
            return resolve(data);
          }
        };
        _this6.ws.onmessage = callback;
        if (_this6.ws.readyState === WebSocket.OPEN) {
          try {
            _this6.ws.send(JSON.stringify(data));
          } catch (error) {
            console.error('send error:', error.message, data);
            return reject(error);
          }
        } else {
          var _callback2 = function _callback2() {
            try {
              _this6.ws.send(JSON.stringify(data));
            } catch (error) {
              console.error('send error:', error.message, data);
              return reject(error);
            }
            _this6.ws.open = _this6._onopen;
          };
          _this6.ws.onopen = _callback2;
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

      // connect to a ws, send data, wait for response and then close
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
              return reject(new Error('timeout ' + timeout));
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
              return reject(error);
            }
          };
          server.onmessage = function (message) {
            clearTimeout(timer);
            var data = JSON.parse(message.data);
            server.close();
            return resolve(data);
          };
          server.onerror = function (error) {
            if (!timeoutError) {
              clearTimeout(timer);
              server.close();
              return reject(error);
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
}(_eventEmitter2.default);

exports.default = ReWebSocket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy9pbmRleC5qcyJdLCJuYW1lcyI6WyJpc05vZGUiLCJGdW5jdGlvbiIsImdsb2JhbCIsIldlYlNvY2tldCIsInJlcXVpcmUiLCJQcm9taXNlIiwiUmVXZWJTb2NrZXQiLCJjb25maWdzIiwicmVjb25uZWN0TWF4Q291bnQiLCJ1bmRlZmluZWQiLCJyZWNvbm5lY3RUaW1lIiwicmVjb25uZWN0RGVsYXkiLCJuYW1lIiwiZm9yY2VSZWNvbm5lY3QiLCJfcmVjb25uZWN0Q291bnQiLCJfcmVjb25uZWN0VG90YWxDb3VudCIsInN1YnNjcmliZV9oaXN0b3J5IiwicmFpc2UiLCJiYWRSYXRlIiwic3RhcnRUaW1lIiwiRGF0ZSIsInJlY29ubmVjdF9oaXN0b3J5IiwiX29ub3BlbnMiLCJfb25vcGVuIiwiZXZlbnQiLCJsZW5ndGgiLCJlYWNoQ2FsbGJhY2siLCJjb25zb2xlIiwiaW5mbyIsInVybCIsInJlY29ubmVjdENvdW50IiwiX3N1YnNjcmliZV9kbyIsInNldFRpbWVvdXQiLCJ3cyIsInN1YnNjcmliZV9saXN0X3dhaXQiLCJjbG9zZSIsIl9vbmNsb3NlcyIsIl9vbmNsb3NlIiwiX21lZXRjbG9zZSIsInJlYXNvbiIsIl9tZWV0ZXJyb3IiLCJsb2ciLCJfcmVjb25uZWN0IiwiX29uZXJyb3JzIiwiX29uZXJyb3IiLCJfb25tZXNzYWdlcyIsIl9vbm1lc3NhZ2UiLCJhcmdzIiwiX19yZXdzX18iLCJfY29uZmlnIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJvbm1lc3NhZ2UiLCJzdWJzY3JpYmVfbGlzdCIsInJlYWR5U3RhdGUiLCJDTE9TRUQiLCJDTE9TSU5HIiwicHVzaCIsIkVycm9yIiwiZXJyb3IiLCJjYWxsYmFjayIsImFkZCIsImluY2x1ZGVzIiwic3BsaWNlIiwiaW5kZXhPZiIsInJlc29sdmUiLCJyZWplY3QiLCJ3c29mZiIsInN1YnNjcmliZV9tZXNzYWdlX2RhdGEiLCJmb3JFYWNoIiwiaWQiLCJpdGVtIiwic2VuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJtZXNzYWdlIiwiZGF0YSIsInBhcnNlIiwiaW5kZXgiLCJtYXAiLCJvIiwiZGF0YXMiLCJldmVyeSIsIl8iLCJPUEVOIiwid3NvbiIsIm9wZW4iLCJzbGVlcCIsImNvbmZpZyIsInRpbWVvdXQiLCJub3ciLCJzZXJ2ZXIiLCJ0aW1lciIsInRpbWVvdXRFcnJvciIsImNsZWFyVGltZW91dCIsIkV2ZW50RW1pdHRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFDQSxJQUFNQSxTQUFPLElBQUlDLFFBQUosQ0FBYSxvREFBYixDQUFiO0FBQ0EsSUFBSUQsUUFBSixFQUFjO0FBQ1pFLFNBQU9DLFNBQVAsR0FBbUJDLFFBQVEsSUFBUixDQUFuQjtBQUNBRixTQUFPRyxPQUFQLEdBQWlCRCxRQUFRLFNBQVIsQ0FBakI7QUFDRDs7SUFFS0UsVzs7O0FBQ0osdUJBQWFDLE9BQWIsRUFBK0I7QUFBQTs7QUFFN0I7OztBQUY2Qjs7QUFLN0IsVUFBS0MsaUJBQUwsR0FBeUJELFFBQVFDLGlCQUFSLEtBQThCQyxTQUE5QixHQUEwQyxDQUExQyxHQUE4Q0YsUUFBUUMsaUJBQS9FO0FBQ0EsVUFBS0UsYUFBTCxHQUFxQkgsUUFBUUcsYUFBUixJQUF5QixDQUE5QztBQUNBLFVBQUtDLGNBQUwsR0FBc0JKLFFBQVFJLGNBQVIsSUFBMEIsQ0FBaEQ7QUFDQTtBQUNBLFVBQUtDLElBQUwsR0FBWUwsUUFBUUssSUFBUixJQUFnQixFQUE1QjtBQUNBO0FBQ0EsVUFBS0MsY0FBTCxHQUFzQk4sUUFBUU0sY0FBUixJQUEwQixLQUFoRDtBQUNBLFVBQUtDLGVBQUwsR0FBdUIsQ0FBdkI7QUFDQSxVQUFLQyxvQkFBTCxHQUE0QixDQUE1Qjs7QUFFQSxVQUFLQyxpQkFBTCxHQUF5QixFQUF6QjtBQUNBLFVBQUtDLEtBQUwsR0FBYVYsUUFBUVUsS0FBUixLQUFrQlIsU0FBbEIsR0FBOEIsSUFBOUIsR0FBcUNGLFFBQVFVLEtBQTFEO0FB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cUJBQU96RCxLQUFQO0FBQ0EscUJBQU9nQyxPQUFPUCxLQUFQLENBQVA7QUFDRDtBQUNGLFdBVkQ7QUFXQWdDLGlCQUFPdkMsU0FBUCxHQUFtQixVQUFDdUIsT0FBRCxFQUFhO0FBQzlCbUIseUJBQWFGLEtBQWI7QUFDQSxnQkFBSWhCLE9BQU9ILEtBQUtJLEtBQUwsQ0FBV0YsUUFBUUMsSUFBbkIsQ0FBWDtBQUNBZSxtQkFBT3pELEtBQVA7QUFDQSxtQkFBTytCLFFBQVFXLElBQVIsQ0FBUDtBQUNELFdBTEQ7QUFNQWUsaUJBQU94QyxPQUFQLEdBQWlCLFVBQUNRLEtBQUQsRUFBVztBQUMxQixnQkFBSSxDQUFDa0MsWUFBTCxFQUFtQjtBQUNqQkMsMkJBQWFGLEtBQWI7QUFDQUQscUJBQU96RCxLQUFQO0FBQ0EscUJBQU9nQyxPQUFPUCxLQUFQLENBQVA7QUFDRDtBQUNGLFdBTkQ7QUFPRCxTQXJDRDtBQXNDQSxZQUFJNEIsS0FBSixFQUFXO0FBQ1R4RCxxQkFBVzZCLFFBQVgsRUFBcUIyQixLQUFyQjtBQUNELFNBRkQsTUFFTztBQUNMM0I7QUFDRDtBQUNGLE9BNUNNLENBQVA7QUE2Q0Q7Ozs7RUEvWXVCbUMsc0I7O2tCQWtaWDFGLFciLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJy4vZXZlbnQtZW1pdHRlcidcbmNvbnN0IGlzTm9kZT1uZXcgRnVuY3Rpb24oXCJ0cnkge3JldHVybiB0aGlzPT09Z2xvYmFsO31jYXRjaChlKXtyZXR1cm4gZmFsc2U7fVwiKTtcbmlmIChpc05vZGUoKSkge1xuICBnbG9iYWwuV2ViU29ja2V0ID0gcmVxdWlyZSgnd3MnKVxuICBnbG9iYWwuUHJvbWlzZSA9IHJlcXVpcmUoJ3Byb21pc2UnKVxufVxuXG5jbGFzcyBSZVdlYlNvY2tldCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yIChjb25maWdzLCAuLi5hcmdzKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qIGVhY2ggdGltZSB5b3UgbG9zZSB0aGUgY29ubmVjdGlvbiwgd2Ugd2lsbCB0cnkgbWF4IHJlY29ubmVjdE1heENvdW50IHRpbWVzIGFuZCB0aGVuIHRocm93IGVycm9yXG4gICAgICAgaWYgeW91ciB0b3RhbCByZXRyeSB0aW1lcyBpcyBsYXJnZXIgdGhhbiByZWNvbm5lY3RUb3RhbE1heENvdW50LCB3ZSB3aWxsIGFsc28gdGhyb3cgYSBlcnJvclxuICAgICovXG4gICAgdGhpcy5yZWNvbm5lY3RNYXhDb3VudCA9IGNvbmZpZ3MucmVjb25uZWN0TWF4Q291bnQgPT09IHVuZGVmaW5lZCA/IDUgOiBjb25maWdzLnJlY29ubmVjdE1heENvdW50XG4gICAgdGhpcy5yZWNvbm5lY3RUaW1lID0gY29uZmlncy5yZWNvbm5lY3RUaW1lIHx8IDJcbiAgICB0aGlzLnJlY29ubmVjdERlbGF5ID0gY29uZmlncy5yZWNvbm5lY3REZWxheSB8fCAwXG4gICAgLy8gbmFtZSB0byB1c2UgaW4gdGhlIGxvZyBvdXRwdXRcbiAgICB0aGlzLm5hbWUgPSBjb25maWdzLm5hbWUgfHwgJydcbiAgICAvLyBmb3JjZSByZWNvbm5lY3QgZXZlbnQgaW4gbm9ybWFsIGNsb3NlXG4gICAgdGhpcy5mb3JjZVJlY29ubmVjdCA9IGNvbmZpZ3MuZm9yY2VSZWNvbm5lY3QgfHwgZmFsc2VcbiAgICB0aGlzLl9yZWNvbm5lY3RDb3VudCA9IDBcbiAgICB0aGlzLl9yZWNvbm5lY3RUb3RhbENvdW50ID0gMFxuXG4gICAgdGhpcy5zdWJzY3JpYmVfaGlzdG9yeSA9IFtdXG4gICAgdGhpcy5yYWlzZSA9IGNvbmZpZ3MucmFpc2UgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBjb25maWdzLnJhaXNlXG4gICAgdGhpcy5iYWRSYXRlID0gY29uZmlncy5iYWRSYXRlXG4gICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpXG4gICAgdGhpcy5yZWNvbm5lY3RfaGlzdG9yeSA9IFtdXG4gICAgLy8gb24gb3BlblxuICAgIHRoaXMuX29ub3BlbnMgPSBbXSAvLyBzdG9yZSBjYWxsYmFja3Mgd2hlbiB3cyBpcyBvcGVuXG4gICAgdGhpcy5fb25vcGVuID0gYXN5bmMgZXZlbnQgPT4ge1xuICAgICAgLy8gcmVkbyBvbm9wZW5zXG4gICAgICBpZiAodGhpcy5fb25vcGVucy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChsZXQgZWFjaENhbGxiYWNrIG9mIHRoaXMuX29ub3BlbnMpIHtcbiAgICAgICAgICBhd2FpdCBlYWNoQ2FsbGJhY2soZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHRoZW4gcmVkbyBzdWJzY3JpYmVcbiAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RDb3VudCA+IDApIHtcbiAgICAgICAgaWYgKHRoaXMuc3Vic2NyaWJlX2hpc3RvcnkubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc29sZS5pbmZvKGAke3RoaXMubmFtZX0gcmVjb25uZWN0ICR7dGhpcy51cmx9IHN1Y2Nlc3NmdWxseSEhIHJlZG8gc3Vic2NyaWJlYCwgdGhpcy5zdWJzY3JpYmVfaGlzdG9yeSwgYHJlY29ubmVjdE1heENvdW50OiAke2NvbmZpZ3MucmVjb25uZWN0TWF4Q291bnR9YClcbiAgICAgICAgICBsZXQgcmVjb25uZWN0Q291bnQgPSB0aGlzLl9yZWNvbm5lY3RDb3VudFxuICAgICAgICAgIHRoaXMuX3N1YnNjcmliZV9kbygpXG4gICAgICAgICAgLy8gYWxsIHN1YnNjcmliZXMgbXVzdCBoYXZlIHJlcGx5LCBvciBkbyByZWNvbm5lY3QgYWdhaW5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdENvdW50ID0gcmVjb25uZWN0Q291bnRcbiAgICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgdGhpcy5yZWNvbm5lY3RUaW1lICogMTAwMCArIHRoaXMucmVjb25uZWN0RGVsYXkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5pbmZvKGAke3RoaXMubmFtZX0gcmVjb25uZWN0ICR7dGhpcy51cmx9IHN1Y2Nlc3NmdWxseSEhIG5vdGhpbmcgdG8gc3Vic2NyaWJlYClcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGUgcmVjb25uZWN0IGlzIG5vdyBzdWNjZXNzZnVsLCByZXNldCByZWNvbm5lY3RDb3VudCB0byAwXG4gICAgICAgIHRoaXMuX3JlY29ubmVjdENvdW50ID0gMFxuICAgICAgfVxuICAgIH1cbiAgICAvLyBvbiBjbG9zZVxuICAgIHRoaXMuX29uY2xvc2VzID0gW11cbiAgICB0aGlzLl9vbmNsb3NlID0gZXZlbnQgPT4ge1xuICAgICAgdGhpcy53cy5fbWVldGNsb3NlID0gdHJ1ZVxuICAgICAgaWYgKHRoaXMuZm9yY2VSZWNvbm5lY3QgfHwgIWV2ZW50LnJlYXNvbikge1xuICAgICAgICBpZiAoIXRoaXMud3MuX21lZXRlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMubmFtZX06ICR7dGhpcy51cmx9IGFibm9ybWFsbHkgY2xvc2VkIHdpdGggbm8gcmVhc29uYClcbiAgICAgICAgICB0aGlzLl9yZWNvbm5lY3QoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMubmFtZX06ICR7dGhpcy51cmx9IG5vcm1hbCBjbG9zZSBiZWNhdXNlYCwgZXZlbnQucmVhc29uKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29uY2xvc2VzLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBlYWNoQ2FsbGJhY2sgb2YgdGhpcy5fb25jbG9zZXMpIHtcbiAgICAgICAgICBlYWNoQ2FsbGJhY2soZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gb24gZXJyb3JcbiAgICB0aGlzLl9vbmVycm9ycyA9IFtdXG4gICAgdGhpcy5fb25lcnJvciA9IGV2ZW50ID0+IHtcbiAgICAgIHRoaXMud3MuX21lZXRlcnJvciA9IHRydWVcbiAgICAgIGlmICghdGhpcy53cy5fbWVldGNsb3NlKSB7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdChldmVudClcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChsZXQgZWFjaENhbGxiYWNrIG9mIHRoaXMuX29uZXJyb3JzKSB7XG4gICAgICAgICAgZWFjaENhbGxiYWNrKGV2ZW50KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIG9uIG1lc3NhZ2VcbiAgICB0aGlzLl9vbm1lc3NhZ2VzID0gW11cbiAgICB0aGlzLl9vbm1lc3NhZ2UgPSBldmVudCA9PiB7XG4gICAgICBpZiAodGhpcy5fb25tZXNzYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChsZXQgZWFjaENhbGxiYWNrIG9mIHRoaXMuX29ubWVzc2FnZXMpIHtcbiAgICAgICAgICBlYWNoQ2FsbGJhY2soZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpbml0IGJlaGF2aW9yc1xuICAgIHRoaXMuYXJncyA9IGFyZ3NcbiAgICB0aGlzLndzID0gbmV3IFdlYlNvY2tldCguLi5hcmdzKVxuICAgIHRoaXMud3MuX19yZXdzX18gPSB0aGlzLm5hbWVcbiAgICB0aGlzLl9jb25maWcoKVxuICAgIHRoaXMudXJsID0gdGhpcy53cy51cmxcbiAgfVxuICBfY29uZmlnICgpIHtcbiAgICB0aGlzLndzLm9ub3BlbiA9IHRoaXMuX29ub3BlblxuICAgIHRoaXMud3Mub25jbG9zZSA9IHRoaXMuX29uY2xvc2VcbiAgICB0aGlzLndzLm9uZXJyb3IgPSB0aGlzLl9vbmVycm9yXG4gICAgdGhpcy53cy5vbm1lc3NhZ2UgPSB0aGlzLl9vbm1lc3NhZ2VcbiAgICB0aGlzLndzLl9tZWV0ZXJyb3IgPSBmYWxzZVxuICAgIHRoaXMud3MuX21lZXRjbG9zZSA9IGZhbHNlXG4gICAgdGhpcy53cy5zdWJzY3JpYmVfbGlzdCA9IFtdXG4gICAgdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0ID0gW11cbiAgfVxuICBfcmVjb25uZWN0IChldmVudCkge1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoZXZlbnQpXG4gICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0LkNMT1NFRCB8fCB0aGlzLndzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TSU5HKSB7XG4gICAgICB0aGlzLl9yZWNvbm5lY3RUb3RhbENvdW50ICs9IDFcbiAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMubmFtZX0gIHJlY29ubmVjdGluZyAke3RoaXMudXJsfSB0cmllczogJHt0aGlzLl9yZWNvbm5lY3RDb3VudH18JHt0aGlzLnJlY29ubmVjdE1heENvdW50fSwgdG90YWwgdHJpZXM6ICR7dGhpcy5fcmVjb25uZWN0VG90YWxDb3VudH1gKVxuICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdENvdW50IDwgdGhpcy5yZWNvbm5lY3RNYXhDb3VudCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLl9vbm9wZW4sIHRoaXMuX29uY2xvc2UsIHRoaXMuX29uZXJyb3IsIHRoaXMuX29ubWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnJlY29ubmVjdF9oaXN0b3J5LnB1c2gobmV3IERhdGUoKSlcbiAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RDb3VudCArPSAxXG4gICAgICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQoLi4udGhpcy5hcmdzKVxuICAgICAgICAgIHRoaXMud3MuX19yZXdzX18gPSB0aGlzLm5hbWVcbiAgICAgICAgICB0aGlzLl9jb25maWcoKVxuICAgICAgICB9LCB0aGlzLnJlY29ubmVjdFRpbWUgKiAxMDAwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMucmFpc2UpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcihgJHt0aGlzLm5hbWV9ICBNYXggcmVjb25uZWN0IG51bWJlciByZWFjaGVkIGZvciAke3RoaXMudXJsfSEgd2l0aCBzaW5nbGU6JHt0aGlzLl9yZWNvbm5lY3RDb3VudH1gKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7dGhpcy5uYW1lfSAgTWF4IHJlY29ubmVjdCBudW1iZXIgcmVhY2hlZCBmb3IgJHt0aGlzLnVybH0hYClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdzaG91bGQgbm90IGJlIGhlcmUnLCB0aGlzLndzLnJlYWR5U3RhdGUsIHRoaXMud3MpXG4gICAgfVxuICB9XG4gIHdzb24gKG5hbWUsIGNhbGxiYWNrLCBhZGQpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ21lc3NhZ2UnOlxuICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgdGhpcy5fb25tZXNzYWdlcy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29ubWVzc2FnZXMgPSBbY2FsbGJhY2tdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgIHRoaXMuX29uZXJyb3JzLnB1c2goY2FsbGJhY2spXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25lcnJvcnMgPSBbY2FsbGJhY2tdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgIHRoaXMuX29uY2xvc2VzLnB1c2goY2FsbGJhY2spXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25jbG9zZXMgPSBbY2FsbGJhY2tdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgdGhpcy5fb25vcGVucy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29ub3BlbnMgPSBbY2FsbGJhY2tdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IEVycm9yKGBvbmx5IHN1cHBvcnQgbWVzc2FnZSwgY2xvc2UgYW5kIG9wZW4gZXZlbnQsIG5vdCAke25hbWV9YClcbiAgICB9XG4gIH1cbiAgd3NvZmYgKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdtZXNzYWdlJzpcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX29ubWVzc2FnZXMuaW5jbHVkZXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICB0aGlzLl9vbm1lc3NhZ2VzLnNwbGljZSh0aGlzLl9vbm1lc3NhZ2VzLmluZGV4T2YoY2FsbGJhY2spLCAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbm1lc3NhZ2VzID0gW11cbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBpZiAodGhpcy5fb25jbG9zZXMuaW5jbHVkZXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICB0aGlzLl9vbmNsb3Nlcy5zcGxpY2UodGhpcy5fb25jbG9zZXMuaW5kZXhPZihjYWxsYmFjayksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX29uY2xvc2VzID0gW11cbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGlmICh0aGlzLl9vbm9wZW5zLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgdGhpcy5fb25vcGVucy5zcGxpY2UodGhpcy5fb25vcGVucy5pbmRleE9mKGNhbGxiYWNrKSwgMSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25vcGVucyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX29uZXJyb3JzLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgdGhpcy5fb25lcnJvcnMuc3BsaWNlKHRoaXMuX29uZXJyb3JzLmluZGV4T2YoY2FsbGJhY2spLCAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbmVycm9ycyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgX3N1YnNjcmliZV9kbyAocmVzb2x2ZSwgcmVqZWN0LCB3c29mZikge1xuICAgIHRoaXMuc3Vic2NyaWJlX21lc3NhZ2VfZGF0YSA9IHt9XG4gICAgdGhpcy5zdWJzY3JpYmVfaGlzdG9yeS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgbGV0IGlkID0gaXRlbS5pZFxuICAgICAgLy8gc2VuZCBzdWJzY3JpYmUgY29tbWFuZCBhbmQgcHVzaCB0aGUgaWQgaW50byB3YWl0IGxpc3RcbiAgICAgIGlmICghdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0LmluY2x1ZGVzKGlkKSkge1xuICAgICAgICB0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQucHVzaChpZClcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoaXRlbSkpXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ3Jld3Mgc2VuZCBzdWJzY3JpYmUgZXJyb3I6JywgZXJyb3IubWVzc2FnZSwgaXRlbSlcbiAgICAgICAgICB0aGlzLndzLmNsb3NlKClcbiAgICAgICAgICBpZiAocmVqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB0aHJvdyBlcnJvclxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAodGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0Lmxlbmd0aCkge1xuICAgICAgbGV0IGNhbGxiYWNrID0gZXZlbnQgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnb25lIHRpbWUgcmVxdWVzdCcsIGV2ZW50KVxuICAgICAgICBsZXQgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSlcbiAgICAgICAgaWYgKHRoaXMud3Muc3Vic2NyaWJlX2xpc3Rfd2FpdC5pbmNsdWRlcyhkYXRhLmlkKSkgeyAvLyBmaW5pc2ggb25lXG4gICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0LmluZGV4T2YoZGF0YS5pZClcbiAgICAgICAgICB0aGlzLndzLnN1YnNjcmliZV9saXN0X3dhaXQuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgIHRoaXMud3Muc3Vic2NyaWJlX2xpc3QucHVzaChkYXRhLmlkKVxuICAgICAgICAgIHRoaXMuc3Vic2NyaWJlX21lc3NhZ2VfZGF0YVtkYXRhLmlkXSA9IGRhdGFcbiAgICAgICAgICBpZiAodGhpcy53cy5zdWJzY3JpYmVfbGlzdF93YWl0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8gcmVwbGFjZSBvbm1lc3NhZ2UgZnVuY3Rpb24gdG8gcmVjZWl2ZSBzdWJzY3JpcHRpb24gbWVzc2FnZVxuICAgICAgICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSB0aGlzLl9vbm1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBzdWJzY3JpYmUgc3VjY2Vzc2Z1bGx5IWAsIHRoaXMuc3Vic2NyaWJlX2hpc3RvcnkubWFwKG8gPT4gby5pZCksIHRoaXMubmFtZSlcbiAgICAgICAgICAgIGlmICh3c29mZikge1xuICAgICAgICAgICAgICB0aGlzLndzb2ZmKCdvcGVuJywgd3NvZmYpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAvLyBkbyBub3QgcmV0dXJuIGhlcmVcbiAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnN1YnNjcmliZV9tZXNzYWdlX2RhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IGNhbGxiYWNrXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh3c29mZikge1xuICAgICAgICB0aGlzLndzb2ZmKCdvcGVuJywgd3NvZmYpXG4gICAgICB9XG4gICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICByZXNvbHZlKHt9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBzdWJzY3JpYmUgKGRhdGFzKSB7XG4gICAgLy8gZGF0YXMgaXMgYSBhcnJheSBvZiBkYXRhLCBhbGwgZGF0YSBzaG91bGQgaGF2ZSBpZFxuICAgIC8vIHJldHVybiBhIHByb21pc2UsIHlvdSBzaG91bGQgYWRkIG5ldyB3cy5vbm1lc3NhZ2UgYWZ0ZXIgdGhpcyBwcm9taXNlIGlzIHJlc29sdmVkXG4gICAgaWYgKCFkYXRhcy5ldmVyeShfID0+ICEhXy5pZCkpIHtcbiAgICAgIHRocm93IEVycm9yKCdhbGwgc3Vic2NyaWJlIGRhdGEgbXVzdCBoYXZlIGlkJylcbiAgICB9XG4gICAgdGhpcy5zdWJzY3JpYmVfaGlzdG9yeSA9IGRhdGFzXG4gICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHsgLy8gd2hlbiB5b3UgYWRkIGEgc3Vic2NyaXB0aW9uIGFmdGVyIHdzIGlzIG9wZW5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZV9kbyhyZXNvbHZlLCByZWplY3QpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4geyAvLyB3aGVuIHlvdSBhZGQgYSBzdWJzY3JpcHRpb24gYmVmb3JlIHdzIGlzIG9wZW5cbiAgICAgICAgbGV0IGNhbGxiYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgdGhpcy5fc3Vic2NyaWJlX2RvKHJlc29sdmUsIHJlamVjdCwgY2FsbGJhY2spXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53c29uKCdvcGVuJywgY2FsbGJhY2ssIHRydWUpIC8vIGFkZCB0aGlzIGNhbGxiYWNrIGludG8gd3Mub3BlbiBjYWxsYmFja3NcbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIHNlbmQgKGRhdGEpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy53cy5zZW5kKGRhdGEpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdyZXdzIHNlbmQgZXJyb3I6JywgZXJyb3IubWVzc2FnZSwgZGF0YSlcbiAgICAgIHRocm93IGVycm9yXG4gICAgfVxuICB9XG4gIGluaXQgKGRhdGEpIHtcbiAgICAvLyBhc3N1bWUgdGhpcyBpcyB0aGUgZmlyc3QgZGF0YSBzZW5kIHRvIHNlcnZlciwgdGhlIHNlcnZlciB3aWxsIHJlcGVhdCB0aGUgaWRcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGlkID0gZGF0YS5pZFxuICAgICAgbGV0IGNhbGxiYWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKVxuICAgICAgICBpZiAoZGF0YS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IHRoaXMuX29ubWVzc2FnZVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMud3Mub25tZXNzYWdlID0gY2FsbGJhY2tcbiAgICAgIGlmICh0aGlzLndzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2luaXQgc2VuZCBlcnJvcjonLCBlcnJvci5tZXNzYWdlLCBkYXRhKVxuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBjYWxsYmFjayA9ICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdpbml0IHNlbmQgZXJyb3I6JywgZXJyb3IubWVzc2FnZSwgZGF0YSlcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMud3Mub3BlbiA9IHRoaXMuX29ub3BlblxuICAgICAgICB9XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gY2FsbGJhY2tcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHByb21pc2VkIChkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBpZCA9IGRhdGEuaWRcbiAgICAgIGxldCBjYWxsYmFjayA9IChldmVudCkgPT4ge1xuICAgICAgICBsZXQgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSlcbiAgICAgICAgaWYgKGRhdGEuaWQgPT09IGlkKSB7XG4gICAgICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSB0aGlzLl9vbm1lc3NhZ2VcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkYXRhKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IGNhbGxiYWNrXG4gICAgICBpZiAodGhpcy53cy5yZWFkeVN0YXRlID09PSBXZWJTb2NrZXQuT1BFTikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMud3Muc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdzZW5kIGVycm9yOicsIGVycm9yLm1lc3NhZ2UsIGRhdGEpXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcilcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NlbmQgZXJyb3I6JywgZXJyb3IubWVzc2FnZSwgZGF0YSlcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMud3Mub3BlbiA9IHRoaXMuX29ub3BlblxuICAgICAgICB9XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gY2FsbGJhY2tcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHN0YXRpYyBvbmVQcm9taXNlICh7dXJsLCBkYXRhLCBzbGVlcCwgY29uZmlnfSkge1xuICAgIC8vIGNvbm5lY3QgdG8gYSB3cywgc2VuZCBkYXRhLCB3YWl0IGZvciByZXNwb25zZSBhbmQgdGhlbiBjbG9zZVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgIGxldCB0aW1lb3V0ID0gY29uZmlnICYmIGNvbmZpZy50aW1lb3V0XG4gICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgICAgIGxldCBzZXJ2ZXIgPSBuZXcgV2ViU29ja2V0KHVybClcbiAgICAgICAgbGV0IHRpbWVyXG4gICAgICAgIGxldCB0aW1lb3V0RXJyb3IgPSBmYWxzZVxuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aW1lb3V0RXJyb3IgPSB0cnVlXG4gICAgICAgICAgICBzZXJ2ZXIuY2xvc2UoKVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoYHRpbWVvdXQgJHt0aW1lb3V0fWApKVxuICAgICAgICAgIH0sIHRpbWVvdXQgKiAxMDAwKVxuICAgICAgICB9XG4gICAgICAgIHNlcnZlci5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICAgICAgLy8gY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzZXJ2ZXIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ29uZSBwcm9taXNlIHNlbmQgZXJyb3InLCBlcnJvcilcbiAgICAgICAgICAgIHNlcnZlci5jbG9zZSgpXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXJ2ZXIub25tZXNzYWdlID0gKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpXG4gICAgICAgICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSlcbiAgICAgICAgICBzZXJ2ZXIuY2xvc2UoKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRhdGEpXG4gICAgICAgIH1cbiAgICAgICAgc2VydmVyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAoIXRpbWVvdXRFcnJvcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgICAgc2VydmVyLmNsb3NlKClcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2xlZXApIHtcbiAgICAgICAgc2V0VGltZW91dChjYWxsYmFjaywgc2xlZXApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjaygpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZVdlYlNvY2tldFxuIl19