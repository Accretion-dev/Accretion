'use strict';

var _server = require('../server.js');

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var wss = new _server2.default({ port: 8181 });
global.wss = wss;
var name = void 0;

// must use function () {} instead of () => {}
wss.on('echo0', function (data) {
  var name = 'echo0';
  var that = wss;
  var id = name;
  console.log('on ' + name + ':', data);
  var subscribes = that.subscribes.get(id);
  if (!subscribes) return;
  subscribes.forEach(function (ws) {
    ws.sequence += 1;
    ws.subscribeCount[id] += 1;
    var configs = ws.subscribeConfigs[id];
    ws.send(JSON.stringify({
      ok: true,
      sequence: ws.sequence,
      subsequence: ws.subscribeCount[id],
      configs: configs,
      id: id,
      res: data
    }));
  });
});

wss.on('echo1', function (data) {
  var name = 'echo1';
  var that = wss;
  var id = name;
  console.log('on ' + name + ':', data);
  var subscribes = that.subscribes.get(id);
  if (!subscribes) return;
  subscribes.forEach(function (ws) {
    ws.sequence += 1;
    ws.subscribeCount[id] += 1;
    var configs = ws.subscribeConfigs[id];
    ws.send(JSON.stringify({
      ok: true,
      sequence: ws.sequence,
      subsequence: ws.subscribeCount[id],
      configs: configs,
      id: id,
      res: data
    }));
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy90ZXN0L3NlcnZlci5qcyJdLCJuYW1lcyI6WyJ3c3MiLCJTdXdzcyIsInBvcnQiLCJnbG9iYWwiLCJuYW1lIiwib24iLCJkYXRhIiwidGhhdCIsImlkIiwiY29uc29sZSIsImxvZyIsInN1YnNjcmliZXMiLCJnZXQiLCJmb3JFYWNoIiwid3MiLCJzZXF1ZW5jZSIsInN1YnNjcmliZUNvdW50IiwiY29uZmlncyIsInN1YnNjcmliZUNvbmZpZ3MiLCJzZW5kIiwiSlNPTiIsInN0cmluZ2lmeSIsIm9rIiwic3Vic2VxdWVuY2UiLCJyZXMiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztBQUVBLElBQUlBLE1BQU0sSUFBSUMsZ0JBQUosQ0FBVSxFQUFDQyxNQUFNLElBQVAsRUFBVixDQUFWO0FBQ0FDLE9BQU9ILEdBQVAsR0FBYUEsR0FBYjtBQUNBLElBQUlJLGFBQUo7O0FBRUE7QUFDQUosSUFBSUssRUFBSixDQUFPLE9BQVAsRUFBZ0IsVUFBVUMsSUFBVixFQUFnQjtBQUM5QixNQUFJRixPQUFPLE9BQVg7QUFDQSxNQUFJRyxPQUFPUCxHQUFYO0FBQ0EsTUFBSVEsS0FBS0osSUFBVDtBQUNBSyxVQUFRQyxHQUFSLFNBQWtCTixJQUFsQixRQUEyQkUsSUFBM0I7QUFDQSxNQUFJSyxhQUFhSixLQUFLSSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQkosRUFBcEIsQ0FBakI7QUFDQSxNQUFJLENBQUNHLFVBQUwsRUFBaUI7QUFDakJBLGFBQVdFLE9BQVgsQ0FBbUIsY0FBTTtBQUN2QkMsT0FBR0MsUUFBSCxJQUFlLENBQWY7QUFDQUQsT0FBR0UsY0FBSCxDQUFrQlIsRUFBbEIsS0FBeUIsQ0FBekI7QUFDQSxRQUFJUyxVQUFVSCxHQUFHSSxnQkFBSCxDQUFvQlYsRUFBcEIsQ0FBZDtBQUNBTSxPQUFHSyxJQUFILENBQVFDLEtBQUtDLFNBQUwsQ0FBZTtBQUNyQkMsVUFBSSxJQURpQjtBQUVyQlAsZ0JBQVVELEdBQUdDLFFBRlE7QUFHckJRLG1CQUFhVCxHQUFHRSxjQUFILENBQWtCUixFQUFsQixDQUhRO0FBSXJCUyxzQkFKcUI7QUFLckJULFlBTHFCO0FBTXJCZ0IsV0FBS2xCO0FBTmdCLEtBQWYsQ0FBUjtBQVFELEdBWkQ7QUFhRCxDQXBCRDs7QUFzQkFOLElBQUlLLEVBQUosQ0FBTyxPQUFQLEVBQWdCLFVBQVVDLElBQVYsRUFBZ0I7QUFDOUIsTUFBSUYsT0FBTyxPQUFYO0FBQ0EsTUFBSUcsT0FBT1AsR0FBWDtBQUNBLE1BQUlRLEtBQUtKLElBQVQ7QUFDQUssVUFBUUMsR0FBUixTQUFrQk4sSUFBbEIsUUFBMkJFLElBQTNCO0FBQ0EsTUFBSUssYUFBYUosS0FBS0ksVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0JKLEVBQXBCLENBQWpCO0FBQ0EsTUFBSSxDQUFDRyxVQUFMLEVBQWlCO0FBQ2pCQSxhQUFXRSxPQUFYLENBQW1CLGNBQU07QUFDdkJDLE9BQUdDLFFBQUgsSUFBZSxDQUFmO0FBQ0FELE9BQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLEtBQXlCLENBQXpCO0FBQ0EsUUFBSVMsVUFBVUgsR0FBR0ksZ0JBQUgsQ0FBb0JWLEVBQXBCLENBQWQ7QUFDQU0sT0FBR0ssSUFBSCxDQUFRQyxLQUFLQyxTQUFMLENBQWU7QUFDckJDLFVBQUksSUFEaUI7QUFFckJQLGdCQUFVRCxHQUFHQyxRQUZRO0FBR3JCUSxtQkFBYVQsR0FBR0UsY0FBSCxDQUFrQlIsRUFBbEIsQ0FIUTtBQUlyQlMsc0JBSnFCO0FBS3JCVCxZQUxxQjtBQU1yQmdCLFdBQUtsQjtBQU5nQixLQUFmLENBQVI7QUFRRCxHQVpEO0FBYUQsQ0FwQkQiLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFN1d3NzIGZyb20gJy4uL3NlcnZlci5qcydcblxubGV0IHdzcyA9IG5ldyBTdXdzcyh7cG9ydDogODE4MX0pXG5nbG9iYWwud3NzID0gd3NzXG5sZXQgbmFtZVxuXG4vLyBtdXN0IHVzZSBmdW5jdGlvbiAoKSB7fSBpbnN0ZWFkIG9mICgpID0+IHt9XG53c3Mub24oJ2VjaG8wJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgbGV0IG5hbWUgPSAnZWNobzAnXG4gIGxldCB0aGF0ID0gd3NzXG4gIGxldCBpZCA9IG5hbWVcbiAgY29uc29sZS5sb2coYG9uICR7bmFtZX06YCwgZGF0YSlcbiAgbGV0IHN1YnNjcmliZXMgPSB0aGF0LnN1YnNjcmliZXMuZ2V0KGlkKVxuICBpZiAoIXN1YnNjcmliZXMpIHJldHVyblxuICBzdWJzY3JpYmVzLmZvckVhY2god3MgPT4ge1xuICAgIHdzLnNlcXVlbmNlICs9IDFcbiAgICB3cy5zdWJzY3JpYmVDb3VudFtpZF0gKz0gMVxuICAgIGxldCBjb25maWdzID0gd3Muc3Vic2NyaWJlQ29uZmlnc1tpZF1cbiAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIG9rOiB0cnVlLFxuICAgICAgc2VxdWVuY2U6IHdzLnNlcXVlbmNlLFxuICAgICAgc3Vic2VxdWVuY2U6IHdzLnN1YnNjcmliZUNvdW50W2lkXSxcbiAgICAgIGNvbmZpZ3MsXG4gICAgICBpZCxcbiAgICAgIHJlczogZGF0YVxuICAgIH0pKVxuICB9KVxufSlcblxud3NzLm9uKCdlY2hvMScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gIGxldCBuYW1lID0gJ2VjaG8xJ1xuICBsZXQgdGhhdCA9IHdzc1xuICBsZXQgaWQgPSBuYW1lXG4gIGNvbnNvbGUubG9nKGBvbiAke25hbWV9OmAsIGRhdGEpXG4gIGxldCBzdWJzY3JpYmVzID0gdGhhdC5zdWJzY3JpYmVzLmdldChpZClcbiAgaWYgKCFzdWJzY3JpYmVzKSByZXR1cm5cbiAgc3Vic2NyaWJlcy5mb3JFYWNoKHdzID0+IHtcbiAgICB3cy5zZXF1ZW5jZSArPSAxXG4gICAgd3Muc3Vic2NyaWJlQ291bnRbaWRdICs9IDFcbiAgICBsZXQgY29uZmlncyA9IHdzLnN1YnNjcmliZUNvbmZpZ3NbaWRdXG4gICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICBvazogdHJ1ZSxcbiAgICAgIHNlcXVlbmNlOiB3cy5zZXF1ZW5jZSxcbiAgICAgIHN1YnNlcXVlbmNlOiB3cy5zdWJzY3JpYmVDb3VudFtpZF0sXG4gICAgICBjb25maWdzLFxuICAgICAgaWQsXG4gICAgICByZXM6IGRhdGFcbiAgICB9KSlcbiAgfSlcbn0pXG4iXX0=