'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventEmitter = require('./event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebSocketServer = require('ws').Server;

var Subwss = function (_EventEmitter) {
  _inherits(Subwss, _EventEmitter);

  function Subwss(configs) {
    _classCallCheck(this, Subwss);

    var _this = _possibleConstructorReturn(this, (Subwss.__proto__ || Object.getPrototypeOf(Subwss)).call(this));

    _this.subscribes = new Map();
    _this.clients = [];
    _this.previous_clients = [];
    var port = configs.port || 8181;
    _this.wss = new WebSocketServer({ port: port });
    _this.wss.on('connection', function (ws) {
      console.log('client connected');
      /* response format
      {
        ok: true or false,
        msg: info message, if necessary,
        error: should have this if ok is false
        sequence: number of reply from server, remember to increate them in your message function
        req: the raw requests data (except for the 'data' key as there may be bulk data in it)
        res: the returning result data
      }
      */
      ws.sequence = 0;
      ws.on('message', function (message) {
        try {
          message = JSON.parse(message);
        } catch (e) {
          ws.sequence += 1;
          ws.send(JSON.stringify({ ok: false, error: 'data must be json', sequence: ws.sequence }));
          return;
        }
        console.log('server receive:', message);
        if (!ws._initData) {
          ws.sequence += 1;
          ws._initData = message;
          ws.send(JSON.stringify({
            id: message.id,
            sequence: ws.sequence,
            ok: true,
            message: 'init ok'
          }));
          return;
        }
        // do subscribe
        if (message.command === 'subscribe') {
          if (!message.id) {
            ws.sequence += 1;
            ws.send(JSON.stringify({
              ok: false,
              error: "must have id when subscribe",
              sequence: ws.sequence
            }));
            return;
          }
          var id = message.id;
          if (!_this.listeners.has(id)) {
            ws.sequence += 1;
            ws.send(JSON.stringify({
              ok: false,
              error: 'can not subscribe ' + id + ', no callback',
              sequence: ws.sequence
            }));
            return;
          }
          if (!_this.subscribes.has(id)) {
            _this.subscribes.set(id, [ws]);
          } else {
            _this.subscribes.get(id).push(ws);
          }
          // do subscribe successfully

          // ws.subscribeCount record the number of message reply for this subscription
          if (!ws.subscribeCount) {
            ws.subscribeCount = _defineProperty({}, id, 1);
          } else {
            ws.subscribeCount[id] = 1;
          }
          // config for each subscription
          if (!ws.subscribeConfigs) {
            ws.subscribeConfigs = _defineProperty({}, id, message.configs);
          } else {
            ws.subscribeConfigs[id] = message.configs;
          }
          // return good message (MUST have, or it will cause a infinite reconnecting)
          ws.sequence += 1;
          ws.send(JSON.stringify({
            ok: true,
            id: id,
            configs: configs,
            subsequence: ws.subscribeCount[id],
            sequence: ws.sequence
          }));
          console.log('register a subscribe ' + id + ' from ', ws._initData);
        }
      });
      _this.clients.push(ws);
      ws.on('close', function (code, reason) {
        var index = _this.clients.indexOf(ws);
        var last = _this.clients.splice(index, 1)[0];
        _this.previous_clients.push(last);
        // remove subscribe
        _this.subscribes.forEach(function (array) {
          var index = array.indexOf(ws);
          array.splice(index, 1);
        });
        console.log('client closed', ws);
      });
      ws.on('error', function (event) {
        console.log('error', event);
      });
    });
    return _this;
  }

  return Subwss;
}(_eventEmitter2.default);

exports.default = Subwss;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiV2ViU29ja2V0U2VydmVyIiwicmVxdWlyZSIsIlNlcnZlciIsIlN1YndzcyIsImNvbmZpZ3MiLCJzdWJzY3JpYmVzIiwiTWFwIiwiY2xpZW50cyIsInByZXZpb3VzX2NsaWVudHMiLCJwb3J0Iiwid3NzIiwib24iLCJjb25zb2xlIiwibG9nIiwid3MiLCJzZXF1ZW5jZSIsIm1lc3NhZ2UiLCJKU09OIiwicGFyc2UiLCJlIiwic2VuZCIsInN0cmluZ2lmeSIsIm9rIiwiZXJyb3IiLCJfaW5pdERhdGEiLCJpZCIsImNvbW1hbmQiLCJsaXN0ZW5lcnMiLCJoYXMiLCJzZXQiLCJnZXQiLCJwdXNoIiwic3Vic2NyaWJlQ291bnQiLCJzdWJzY3JpYmVDb25maWdzIiwic3Vic2VxdWVuY2UiLCJjb2RlIiwicmVhc29uIiwiaW5kZXgiLCJpbmRleE9mIiwibGFzdCIsInNwbGljZSIsImZvckVhY2giLCJhcnJheSIsImV2ZW50IiwiRXZlbnRFbWl0dGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFDQSxJQUFJQSxrQkFBa0JDLFFBQVEsSUFBUixFQUFjQyxNQUFwQzs7SUFFTUMsTTs7O0FBQ0osa0JBQWFDLE9BQWIsRUFBK0I7QUFBQTs7QUFBQTs7QUFFN0IsVUFBS0MsVUFBTCxHQUFrQixJQUFJQyxHQUFKLEVBQWxCO0FBQ0EsVUFBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxVQUFLQyxnQkFBTCxHQUF3QixFQUF4QjtBQUNBLFFBQUlDLE9BQU9MLFFBQVFLLElBQVIsSUFBZ0IsSUFBM0I7QUFDQSxVQUFLQyxHQUFMLEdBQVcsSUFBSVYsZUFBSixDQUFvQixFQUFFUyxVQUFGLEVBQXBCLENBQVg7QUFDQSxVQUFLQyxHQUFMLENBQVNDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLGNBQU07QUFDOUJDLGNBQVFDLEdBQVIsQ0FBWSxrQkFBWjtBQUNBOzs7Ozs7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R0FBUiwyQkFBb0NZLEVBQXBDLGFBQWdEWCxHQUFHVSxTQUFuRDtBQUNEO0FBQ0YsT0EzRUQ7QUE0RUEsWUFBS2pCLE9BQUwsQ0FBYXdCLElBQWIsQ0FBa0JqQixFQUFsQjtBQUNBQSxTQUFHSCxFQUFILENBQU0sT0FBTixFQUFlLFVBQUN3QixJQUFELEVBQU9DLE1BQVAsRUFBa0I7QUFDL0IsWUFBSUMsUUFBUSxNQUFLOUIsT0FBTCxDQUFhK0IsT0FBYixDQUFxQnhCLEVBQXJCLENBQVo7QUFDQSxZQUFJeUIsT0FBTyxNQUFLaEMsT0FBTCxDQUFhaUMsTUFBYixDQUFvQkgsS0FBcEIsRUFBMkIsQ0FBM0IsRUFBOEIsQ0FBOUIsQ0FBWDtBQUNBLGNBQUs3QixnQkFBTCxDQUFzQnVCLElBQXRCLENBQTJCUSxJQUEzQjtBQUNBO0FBQ0EsY0FBS2xDLFVBQUwsQ0FBZ0JvQyxPQUFoQixDQUF3QixpQkFBUztBQUMvQixjQUFJSixRQUFRSyxNQUFNSixPQUFOLENBQWN4QixFQUFkLENBQVo7QUFDQTRCLGdCQUFNRixNQUFOLENBQWFILEtBQWIsRUFBb0IsQ0FBcEI7QUFDRCxTQUhEO0FBSUF6QixnQkFBUUMsR0FBUixDQUFZLGVBQVosRUFBNkJDLEVBQTdCO0FBQ0QsT0FWRDtBQVdBQSxTQUFHSCxFQUFILENBQU0sT0FBTixFQUFlLGlCQUFTO0FBQ3RCQyxnQkFBUUMsR0FBUixDQUFZLE9BQVosRUFBcUI4QixLQUFyQjtBQUNELE9BRkQ7QUFHRCxLQXhHRDtBQVA2QjtBQWdIOUI7OztFQWpIa0JDLHNCOztrQkFvSE56QyxNIiwiZmlsZSI6InNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnLi9ldmVudC1lbWl0dGVyJ1xubGV0IFdlYlNvY2tldFNlcnZlciA9IHJlcXVpcmUoJ3dzJykuU2VydmVyXG5cbmNsYXNzIFN1YndzcyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yIChjb25maWdzLCAuLi5hcmdzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc3Vic2NyaWJlcyA9IG5ldyBNYXAoKVxuICAgIHRoaXMuY2xpZW50cyA9IFtdXG4gICAgdGhpcy5wcmV2aW91c19jbGllbnRzID0gW11cbiAgICBsZXQgcG9ydCA9IGNvbmZpZ3MucG9ydCB8fCA4MTgxXG4gICAgdGhpcy53c3MgPSBuZXcgV2ViU29ja2V0U2VydmVyKHsgcG9ydH0pXG4gICAgdGhpcy53c3Mub24oJ2Nvbm5lY3Rpb24nLCB3cyA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnY2xpZW50IGNvbm5lY3RlZCcpO1xuICAgICAgLyogcmVzcG9uc2UgZm9ybWF0XG4gICAgICB7XG4gICAgICAgIG9rOiB0cnVlIG9yIGZhbHNlLFxuICAgICAgICBtc2c6IGluZm8gbWVzc2FnZSwgaWYgbmVjZXNzYXJ5LFxuICAgICAgICBlcnJvcjogc2hvdWxkIGhhdmUgdGhpcyBpZiBvayBpcyBmYWxzZVxuICAgICAgICBzZXF1ZW5jZTogbnVtYmVyIG9mIHJlcGx5IGZyb20gc2VydmVyLCByZW1lbWJlciB0byBpbmNyZWF0ZSB0aGVtIGluIHlvdXIgbWVzc2FnZSBmdW5jdGlvblxuICAgICAgICByZXE6IHRoZSByYXcgcmVxdWVzdHMgZGF0YSAoZXhjZXB0IGZvciB0aGUgJ2RhdGEnIGtleSBhcyB0aGVyZSBtYXkgYmUgYnVsayBkYXRhIGluIGl0KVxuICAgICAgICByZXM6IHRoZSByZXR1cm5pbmcgcmVzdWx0IGRhdGFcbiAgICAgIH1cbiAgICAgICovXG4gICAgICB3cy5zZXF1ZW5jZSA9IDBcbiAgICAgIHdzLm9uKCdtZXNzYWdlJywgbWVzc2FnZSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UobWVzc2FnZSlcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHdzLnNlcXVlbmNlICs9IDFcbiAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtvazogZmFsc2UsIGVycm9yOiAnZGF0YSBtdXN0IGJlIGpzb24nLCBzZXF1ZW5jZTogd3Muc2VxdWVuY2V9KSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnc2VydmVyIHJlY2VpdmU6JywgbWVzc2FnZSlcbiAgICAgICAgaWYgKCF3cy5faW5pdERhdGEpIHtcbiAgICAgICAgICB3cy5zZXF1ZW5jZSArPSAxXG4gICAgICAgICAgd3MuX2luaXREYXRhID0gbWVzc2FnZVxuICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgaWQ6IG1lc3NhZ2UuaWQsXG4gICAgICAgICAgICBzZXF1ZW5jZTogd3Muc2VxdWVuY2UsXG4gICAgICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpbml0IG9rJ1xuICAgICAgICAgIH0pKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIC8vIGRvIHN1YnNjcmliZVxuICAgICAgICBpZiAobWVzc2FnZS5jb21tYW5kID09PSAnc3Vic2NyaWJlJykge1xuICAgICAgICAgIGlmICghbWVzc2FnZS5pZCkge1xuICAgICAgICAgICAgd3Muc2VxdWVuY2UgKz0gMVxuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IFwibXVzdCBoYXZlIGlkIHdoZW4gc3Vic2NyaWJlXCIsXG4gICAgICAgICAgICAgIHNlcXVlbmNlOiB3cy5zZXF1ZW5jZVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGlkID0gbWVzc2FnZS5pZFxuICAgICAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaGFzKGlkKSkge1xuICAgICAgICAgICAgd3Muc2VxdWVuY2UgKz0gMVxuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGBjYW4gbm90IHN1YnNjcmliZSAke2lkfSwgbm8gY2FsbGJhY2tgLFxuICAgICAgICAgICAgICBzZXF1ZW5jZTogd3Muc2VxdWVuY2VcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghdGhpcy5zdWJzY3JpYmVzLmhhcyhpZCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlcy5zZXQoaWQsIFt3c10pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlcy5nZXQoaWQpLnB1c2god3MpXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGRvIHN1YnNjcmliZSBzdWNjZXNzZnVsbHlcblxuICAgICAgICAgIC8vIHdzLnN1YnNjcmliZUNvdW50IHJlY29yZCB0aGUgbnVtYmVyIG9mIG1lc3NhZ2UgcmVwbHkgZm9yIHRoaXMgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgaWYgKCF3cy5zdWJzY3JpYmVDb3VudCkge1xuICAgICAgICAgICAgd3Muc3Vic2NyaWJlQ291bnQgPSB7XG4gICAgICAgICAgICAgIFtpZF06IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd3Muc3Vic2NyaWJlQ291bnRbaWRdID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBjb25maWcgZm9yIGVhY2ggc3Vic2NyaXB0aW9uXG4gICAgICAgICAgaWYgKCF3cy5zdWJzY3JpYmVDb25maWdzKSB7XG4gICAgICAgICAgICB3cy5zdWJzY3JpYmVDb25maWdzID0ge1xuICAgICAgICAgICAgICBbaWRdOiBtZXNzYWdlLmNvbmZpZ3NcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd3Muc3Vic2NyaWJlQ29uZmlnc1tpZF0gPSBtZXNzYWdlLmNvbmZpZ3NcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gcmV0dXJuIGdvb2QgbWVzc2FnZSAoTVVTVCBoYXZlLCBvciBpdCB3aWxsIGNhdXNlIGEgaW5maW5pdGUgcmVjb25uZWN0aW5nKVxuICAgICAgICAgIHdzLnNlcXVlbmNlICs9IDFcbiAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG9rOiB0cnVlLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBjb25maWdzLFxuICAgICAgICAgICAgc3Vic2VxdWVuY2U6IHdzLnN1YnNjcmliZUNvdW50W2lkXSxcbiAgICAgICAgICAgIHNlcXVlbmNlOiB3cy5zZXF1ZW5jZSxcbiAgICAgICAgICB9KSlcbiAgICAgICAgICBjb25zb2xlLmxvZyhgcmVnaXN0ZXIgYSBzdWJzY3JpYmUgJHtpZH0gZnJvbSBgLCB3cy5faW5pdERhdGEpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmNsaWVudHMucHVzaCh3cylcbiAgICAgIHdzLm9uKCdjbG9zZScsIChjb2RlLCByZWFzb24pID0+IHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5jbGllbnRzLmluZGV4T2Yod3MpXG4gICAgICAgIGxldCBsYXN0ID0gdGhpcy5jbGllbnRzLnNwbGljZShpbmRleCwgMSlbMF1cbiAgICAgICAgdGhpcy5wcmV2aW91c19jbGllbnRzLnB1c2gobGFzdClcbiAgICAgICAgLy8gcmVtb3ZlIHN1YnNjcmliZVxuICAgICAgICB0aGlzLnN1YnNjcmliZXMuZm9yRWFjaChhcnJheSA9PiB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gYXJyYXkuaW5kZXhPZih3cylcbiAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnNvbGUubG9nKCdjbGllbnQgY2xvc2VkJywgd3MpXG4gICAgICB9KVxuICAgICAgd3Mub24oJ2Vycm9yJywgZXZlbnQgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnZXJyb3InLCBldmVudClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdWJ3c3NcbiJdfQ==