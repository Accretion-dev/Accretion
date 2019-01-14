'use strict';

var _debugSettings = require('./debug-settings');

var _debugSettings2 = _interopRequireDefault(_debugSettings);

require('babel-polyfill');

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _config = require('../configs/config.js');

var _config2 = _interopRequireDefault(_config);

var _nodeYaml = require('node-yaml');

var _nodeYaml2 = _interopRequireDefault(_nodeYaml);

var _wsserver = require('./api/wsserver.js');

var _wsserver2 = _interopRequireDefault(_wsserver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var session = require("express-session");
var consola = require('consola');
// const cors = require('cors')

var _require = require('nuxt'),
    Nuxt = _require.Nuxt,
    Builder = _require.Builder;

var app = express();
var host = _config2.default.host;
var port = _config2.default.port;

d.app = app;
d.consola = consola;
d.m = _mongoose2.default;

app.set('port', port);
app.set('strict routing', true);
//app.use(cors({
//  // credentials: true,
//  // origin: `http://${host}:${port}`
//}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((0, _cookieParser2.default)());
var currentSession = session({
  secret: 'keyboard cat', // TODO: be random later
  resave: false,
  saveUninitialized: false
});
d.session = currentSession;
app.use(currentSession);
app.use(_passport2.default.initialize());
app.use(_passport2.default.session());

// mount routers for backend
var mounted = require('./routes').default(app);

// Import and Set Nuxt.js options
var config = require('../nuxt.config.js');
config.dev = !(process.env.NODE_ENV === 'production');

d.nuxtConfig = config;
d.config = _config2.default;
d.yaml = _nodeYaml2.default;
d.app = app;
var databaseConfig = _nodeYaml2.default.readSync('../configs/mongod.yml');
d.databaseConfig = databaseConfig;

// auth
// let User = require('./models/models').default.User

var _require$default = require('./models/models').default,
    Models = _require$default.Models,
    api = _require$default.api;

var User = Models.User;
var LocalStrategy = require('passport-local').Strategy;
_passport2.default.use(new LocalStrategy(User.authenticate()));
_passport2.default.serializeUser(User.serializeUser());
_passport2.default.deserializeUser(User.deserializeUser());

async function start() {
  // Init Nuxt.js
  await (0, _models2.default)({ config: _config2.default, databaseConfig: databaseConfig });
  var nuxt = new Nuxt(config);
  global.d.nuxt = nuxt;

  // Build only in dev mode
  if (config.dev) {
    var builder = new Builder(nuxt);
    await builder.build();
  }

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  var server = app.listen(port, host);
  var subwss = new _wsserver2.default({ server: server, path: '/api/ws/' });
  subwss.on('echo0', function (data) {
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
  subwss.on('echo1', function (data) {
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
  global.d.subwss = subwss;

  consola.ready({
    message: 'Server listening on http://' + host + ':' + port,
    badge: true
  });
  if (_config2.default.database == 'test') {
    consola.warn({
      message: 'You are using the \'test\' database, Accretion is thus in the test mode.\n  * The database will be reset by test data each time you start the brainhole.\n  * Use other database name if you want to use the Accretion normally\n  * See the config file \'configs/config.js\'',
      badge: true
    });
  }
}
start();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJzZXNzaW9uIiwiY29uc29sYSIsIk51eHQiLCJCdWlsZGVyIiwiYXBwIiwiaG9zdCIsImdsb2JhbENvbmZpZyIsInBvcnQiLCJkIiwibSIsIm1vbmdvb3NlIiwic2V0IiwidXNlIiwianNvbiIsInVybGVuY29kZWQiLCJleHRlbmRlZCIsImN1cnJlbnRTZXNzaW9uIiwic2VjcmV0IiwicmVzYXZlIiwic2F2ZVVuaW5pdGlhbGl6ZWQiLCJwYXNzcG9ydCIsImluaXRpYWxpemUiLCJtb3VudGVkIiwiZGVmYXVsdCIsImNvbmZpZyIsImRldiIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsIm51eHRDb25maWciLCJ5YW1sIiwiZGF0YWJhc2VDb25maWciLCJyZWFkU3luYyIsIk1vZGVscyIsImFwaSIsIlVzZXIiLCJMb2NhbFN0cmF0ZWd5IiwiU3RyYXRlZ3kiLCJhdXRoZW50aWNhdGUiLCJzZXJpYWxpemVVc2VyIiwiZGVzZXJpYWxpemVVc2VyIiwic3RhcnQiLCJudXh0IiwiZ2xvYmFsIiwiYnVpbGRlciIsImJ1aWxkIiwicmVuZGVyIiwic2VydmVyIiwibGlzdGVuIiwic3Vid3NzIiwiU3Vid3NzIiwicGF0aCIsIm9uIiwiZGF0YSIsIm5hbWUiLCJ0aGF0Iiwid3NzIiwiaWQiLCJjb25zb2xlIiwibG9nIiwic3Vic2NyaWJlcyIsImdldCIsImZvckVhY2giLCJ3cyIsInNlcXVlbmNlIiwic3Vic2NyaWJlQ291bnQiLCJjb25maWdzIiwic3Vic2NyaWJlQ29uZmlncyIsInNlbmQiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJzdWJzZXF1ZW5jZSIsInJlcyIsInJlYWR5IiwibWVzc2FnZSIsImJhZGdlIiwiZGF0YWJhc2UiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFVBQVVDLFFBQVEsU0FBUixDQUFoQjtBQUNBLElBQU1DLFVBQVVELFFBQVEsaUJBQVIsQ0FBaEI7QUFDQSxJQUFNRSxVQUFVRixRQUFRLFNBQVIsQ0FBaEI7QUFDQTs7ZUFDMEJBLFFBQVEsTUFBUixDO0lBQWxCRyxJLFlBQUFBLEk7SUFBTUMsTyxZQUFBQSxPOztBQUNkLElBQU1DLE1BQU1OLFNBQVo7QUFDQSxJQUFNTyxPQUFPQyxpQkFBYUQsSUFBMUI7QUFDQSxJQUFNRSxPQUFPRCxpQkFBYUMsSUFBMUI7O0FBRUFDLEVBQUVKLEdBQUYsR0FBUUEsR0FBUjtBQUNBSSxFQUFFUCxPQUFGLEdBQVlBLE9BQVo7QUFDQU8sRUFBRUMsQ0FBRixHQUFNQyxrQkFBTjs7QUFFQU4sSUFBSU8sR0FBSixDQUFRLE1BQVIsRUFBZ0JKLElBQWhCO0FBQ0FILElBQUlPLEdBQUosQ0FBUSxnQkFBUixFQUEwQixJQUExQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FQLElBQUlRLEdBQUosQ0FBUWQsUUFBUWUsSUFBUixFQUFSO0FBQ0FULElBQUlRLEdBQUosQ0FBUWQsUUFBUWdCLFVBQVIsQ0FBbUIsRUFBRUMsVUFBVSxLQUFaLEVBQW5CLENBQVI7QUFDQVgsSUFBSVEsR0FBSixDQUFRLDZCQUFSO0FBQ0EsSUFBTUksaUJBQWlCaEIsUUFBUTtBQUM3QmlCLFVBQVEsY0FEcUIsRUFDTDtBQUN4QkMsVUFBUSxLQUZxQjtBQUc3QkMscUJBQW1CO0FBSFUsQ0FBUixDQUF2QjtBQUtBWCxFQUFFUixPQUFGLEdBQVlnQixjQUFaO0FBQ0FaLElBQUlRLEdBQUosQ0FBUUksY0FBUjtBQUNBWixJQUFJUSxHQUFKLENBQVFRLG1CQUFTQyxVQUFULEVBQVI7QUFDQWpCLElBQUlRLEdBQUosQ0FBUVEsbUJBQVNwQixPQUFULEVBQVI7O0FBRUE7QUFDQSxJQUFJc0IsVUFBVXZCLFFBQVEsVUFBUixFQUFvQndCLE9BQXBCLENBQTRCbkIsR0FBNUIsQ0FBZDs7QUFFQTtBQUNBLElBQUlvQixTQUFTekIsUUFBUSxtQkFBUixDQUFiO0FBQ0F5QixPQUFPQyxHQUFQLEdBQWEsRUFBRUMsUUFBUUMsR0FBUixDQUFZQyxRQUFaLEtBQXlCLFlBQTNCLENBQWI7O0FBRUFwQixFQUFFcUIsVUFBRixHQUFlTCxNQUFmO0FBQ0FoQixFQUFFZ0IsTUFBRixHQUFXbEIsZ0JBQVg7QUFDQUUsRUFBRXNCLElBQUYsR0FBU0Esa0JBQVQ7QUFDQXRCLEVBQUVKLEdBQUYsR0FBUUEsR0FBUjtBQUNBLElBQUkyQixpQkFBaUJELG1CQUFLRSxRQUFMLENBQWMsdUJBQWQsQ0FBckI7QUFDQXhCLEVBQUV1QixjQUFGLEdBQW1CQSxjQUFuQjs7QUFFQTtBQUNBOzt1QkFDc0JoQyxRQUFRLGlCQUFSLEVBQTJCd0IsTztJQUExQ1UsTSxvQkFBQUEsTTtJQUFRQyxHLG9CQUFBQSxHOztBQUNmLElBQUlDLE9BQU9GLE9BQU9FLElBQWxCO0FBQ0EsSUFBTUMsZ0JBQWdCckMsUUFBUSxnQkFBUixFQUEwQnNDLFFBQWhEO0FBQ0FqQixtQkFBU1IsR0FBVCxDQUFhLElBQUl3QixhQUFKLENBQWtCRCxLQUFLRyxZQUFMLEVBQWxCLENBQWI7QUFDQWxCLG1CQUFTbUIsYUFBVCxDQUF1QkosS0FBS0ksYUFBTCxFQUF2QjtBQUNBbkIsbUJBQVNvQixlQUFULENBQXlCTCxLQUFLSyxlQUFMLEVBQXpCOztBQUVBLGVBQWVDLEtBQWYsR0FBdUI7QUFDckI7QUFDQSxRQUFNLHNCQUFjLEVBQUNqQixRQUFRbEIsZ0JBQVQsRUFBdUJ5Qiw4QkFBdkIsRUFBZCxDQUFOO0FBQ0EsTUFBTVcsT0FBTyxJQUFJeEMsSUFBSixDQUFTc0IsTUFBVCxDQUFiO0FBQ0FtQixTQUFPbkMsQ0FBUCxDQUFTa0MsSUFBVCxHQUFnQkEsSUFBaEI7O0FBRUE7QUFDQSxNQUFJbEIsT0FBT0MsR0FBWCxFQUFnQjtBQUNkLFFBQU1tQixVQUFVLElBQUl6QyxPQUFKLENBQVl1QyxJQUFaLENBQWhCO0FBQ0EsVUFBTUUsUUFBUUMsS0FBUixFQUFOO0FBQ0Q7O0FBRUQ7QUFDQXpDLE1BQUlRLEdBQUosQ0FBUThCLEtBQUtJLE1BQWI7O0FBRUE7QUFDQSxNQUFNQyxTQUFTM0MsSUFBSTRDLE1BQUosQ0FBV3pDLElBQVgsRUFBaUJGLElBQWpCLENBQWY7QUFDQSxNQUFJNEMsU0FBUyxJQUFJQyxrQkFBSixDQUFXLEVBQUNILGNBQUQsRUFBU0ksTUFBTSxVQUFmLEVBQVgsQ0FBYjtBQUNBRixTQUFPRyxFQUFQLENBQVUsT0FBVixFQUFtQixVQUFVQyxJQUFWLEVBQWdCO0FBQ2pDLFFBQUlDLE9BQU8sT0FBWDtBQUNBLFFBQUlDLE9BQU9DLEdBQVg7QUFDQSxRQUFJQyxLQUFLSCxJQUFUO0FBQ0FJLFlBQVFDLEdBQVIsU0FBa0JMLElBQWxCLFFBQTJCRCxJQUEzQjtBQUNBLFFBQUlPLGFBQWFMLEtBQUtLLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CSixFQUFwQixDQUFqQjtBQUNBLFFBQUksQ0FBQ0csVUFBTCxFQUFpQjtBQUNqQkEsZUFBV0UsT0FBWCxDQUFtQixjQUFNO0FBQ3ZCQyxTQUFHQyxRQUFILElBQWUsQ0FBZjtBQUNBRCxTQUFHRSxjQUFILENBQWtCUixFQUFsQixLQUF5QixDQUF6QjtBQUNBLFVBQUlTLFVBQVVILEdBQUdJLGdCQUFILENBQW9CVixFQUFwQixDQUFkO0FBQ0FNLFNBQUdLLElBQUgsQ0FBUUMsS0FBS0MsU0FBTCxDQUFlO0FBQ3JCQyxZQUFJLElBRGlCO0FBRXJCUCxrQkFBVUQsR0FBR0MsUUFGUTtBQUdyQlEscUJBQWFULEdBQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLENBSFE7QUFJckJTLHdCQUpxQjtBQUtyQlQsY0FMcUI7QUFNckJnQixhQUFLcEI7QUFOZ0IsT0FBZixDQUFSO0FBUUQsS0FaRDtBQWFELEdBcEJEO0FBcUJBSixTQUFPRyxFQUFQLENBQVUsT0FBVixFQUFtQixVQUFVQyxJQUFWLEVBQWdCO0FBQ2pDLFFBQUlDLE9BQU8sT0FBWDtBQUNBLFFBQUlDLE9BQU9DLEdBQVg7QUFDQSxRQUFJQyxLQUFLSCxJQUFUO0FBQ0FJLFlBQVFDLEdBQVIsU0FBa0JMLElBQWxCLFFBQTJCRCxJQUEzQjtBQUNBLFFBQUlPLGFBQWFMLEtBQUtLLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CSixFQUFwQixDQUFqQjtBQUNBLFFBQUksQ0FBQ0csVUFBTCxFQUFpQjtBQUNqQkEsZUFBV0UsT0FBWCxDQUFtQixjQUFNO0FBQ3ZCQyxTQUFHQyxRQUFILElBQWUsQ0FBZjtBQUNBRCxTQUFHRSxjQUFILENBQWtCUixFQUFsQixLQUF5QixDQUF6QjtBQUNBLFVBQUlTLFVBQVVILEdBQUdJLGdCQUFILENBQW9CVixFQUFwQixDQUFkO0FBQ0FNLFNBQUdLLElBQUgsQ0FBUUMsS0FBS0MsU0FBTCxDQUFlO0FBQ3JCQyxZQUFJLElBRGlCO0FBRXJCUCxrQkFBVUQsR0FBR0MsUUFGUTtBQUdyQlEscUJBQWFULEdBQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLENBSFE7QUFJckJTLHdCQUpxQjtBQUtyQlQsY0FMcUI7QUFNckJnQixhQUFLcEI7QUFOZ0IsT0FBZixDQUFSO0FBUUQsS0FaRDtBQWFELEdBcEJEO0FBcUJBVixTQUFPbkMsQ0FBUCxDQUFTeUMsTUFBVCxHQUFrQkEsTUFBbEI7O0FBRUFoRCxVQUFReUUsS0FBUixDQUFjO0FBQ1pDLDZDQUF1Q3RFLElBQXZDLFNBQStDRSxJQURuQztBQUVacUUsV0FBTztBQUZLLEdBQWQ7QUFJQSxNQUFJdEUsaUJBQWF1RSxRQUFiLElBQXlCLE1BQTdCLEVBQXFDO0FBQ25DNUUsWUFBUTZFLElBQVIsQ0FBYTtBQUNYSCwrUkFEVztBQUVYQyxhQUFPO0FBRkksS0FBYjtBQUlEO0FBQ0Y7QUFDRG5DIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRlYnVnU2V0dGluZ3MgZnJvbSAnLi9kZWJ1Zy1zZXR0aW5ncydcbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJ1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tICdjb29raWUtcGFyc2VyJ1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInXG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJ1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0J1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJ1xuaW1wb3J0IGRhdGFiYXNlX2luaXQgZnJvbSAnLi9tb2RlbHMnXG5pbXBvcnQgZ2xvYmFsQ29uZmlnIGZyb20gXCIuLi9jb25maWdzL2NvbmZpZy5qc1wiXG5pbXBvcnQgeWFtbCBmcm9tICdub2RlLXlhbWwnXG5pbXBvcnQgU3Vid3NzIGZyb20gJy4vYXBpL3dzc2VydmVyLmpzJ1xuXG5jb25zdCBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpXG5jb25zdCBzZXNzaW9uID0gcmVxdWlyZShcImV4cHJlc3Mtc2Vzc2lvblwiKVxuY29uc3QgY29uc29sYSA9IHJlcXVpcmUoJ2NvbnNvbGEnKVxuLy8gY29uc3QgY29ycyA9IHJlcXVpcmUoJ2NvcnMnKVxuY29uc3QgeyBOdXh0LCBCdWlsZGVyIH0gPSByZXF1aXJlKCdudXh0JylcbmNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuY29uc3QgaG9zdCA9IGdsb2JhbENvbmZpZy5ob3N0XG5jb25zdCBwb3J0ID0gZ2xvYmFsQ29uZmlnLnBvcnRcblxuZC5hcHAgPSBhcHBcbmQuY29uc29sYSA9IGNvbnNvbGFcbmQubSA9IG1vbmdvb3NlXG5cbmFwcC5zZXQoJ3BvcnQnLCBwb3J0KVxuYXBwLnNldCgnc3RyaWN0IHJvdXRpbmcnLCB0cnVlKVxuLy9hcHAudXNlKGNvcnMoe1xuLy8gIC8vIGNyZWRlbnRpYWxzOiB0cnVlLFxuLy8gIC8vIG9yaWdpbjogYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH1gXG4vL30pKVxuYXBwLnVzZShleHByZXNzLmpzb24oKSlcbmFwcC51c2UoZXhwcmVzcy51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IGZhbHNlIH0pKVxuYXBwLnVzZShjb29raWVQYXJzZXIoKSlcbmNvbnN0IGN1cnJlbnRTZXNzaW9uID0gc2Vzc2lvbih7XG4gIHNlY3JldDogJ2tleWJvYXJkIGNhdCcsIC8vIFRPRE86IGJlIHJhbmRvbSBsYXRlclxuICByZXNhdmU6IGZhbHNlLFxuICBzYXZlVW5pbml0aWFsaXplZDogZmFsc2UsXG59KVxuZC5zZXNzaW9uID0gY3VycmVudFNlc3Npb25cbmFwcC51c2UoY3VycmVudFNlc3Npb24pXG5hcHAudXNlKHBhc3Nwb3J0LmluaXRpYWxpemUoKSlcbmFwcC51c2UocGFzc3BvcnQuc2Vzc2lvbigpKVxuXG4vLyBtb3VudCByb3V0ZXJzIGZvciBiYWNrZW5kXG5sZXQgbW91bnRlZCA9IHJlcXVpcmUoJy4vcm91dGVzJykuZGVmYXVsdChhcHApXG5cbi8vIEltcG9ydCBhbmQgU2V0IE51eHQuanMgb3B0aW9uc1xubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL251eHQuY29uZmlnLmpzJylcbmNvbmZpZy5kZXYgPSAhKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpXG5cbmQubnV4dENvbmZpZyA9IGNvbmZpZ1xuZC5jb25maWcgPSBnbG9iYWxDb25maWdcbmQueWFtbCA9IHlhbWxcbmQuYXBwID0gYXBwXG5sZXQgZGF0YWJhc2VDb25maWcgPSB5YW1sLnJlYWRTeW5jKCcuLi9jb25maWdzL21vbmdvZC55bWwnKVxuZC5kYXRhYmFzZUNvbmZpZyA9IGRhdGFiYXNlQ29uZmlnXG5cbi8vIGF1dGhcbi8vIGxldCBVc2VyID0gcmVxdWlyZSgnLi9tb2RlbHMvbW9kZWxzJykuZGVmYXVsdC5Vc2VyXG5jb25zdCB7TW9kZWxzLCBhcGl9ID0gcmVxdWlyZSgnLi9tb2RlbHMvbW9kZWxzJykuZGVmYXVsdFxubGV0IFVzZXIgPSBNb2RlbHMuVXNlclxuY29uc3QgTG9jYWxTdHJhdGVneSA9IHJlcXVpcmUoJ3Bhc3Nwb3J0LWxvY2FsJykuU3RyYXRlZ3lcbnBhc3Nwb3J0LnVzZShuZXcgTG9jYWxTdHJhdGVneShVc2VyLmF1dGhlbnRpY2F0ZSgpKSlcbnBhc3Nwb3J0LnNlcmlhbGl6ZVVzZXIoVXNlci5zZXJpYWxpemVVc2VyKCkpXG5wYXNzcG9ydC5kZXNlcmlhbGl6ZVVzZXIoVXNlci5kZXNlcmlhbGl6ZVVzZXIoKSlcblxuYXN5bmMgZnVuY3Rpb24gc3RhcnQoKSB7XG4gIC8vIEluaXQgTnV4dC5qc1xuICBhd2FpdCBkYXRhYmFzZV9pbml0KHtjb25maWc6IGdsb2JhbENvbmZpZywgZGF0YWJhc2VDb25maWd9KVxuICBjb25zdCBudXh0ID0gbmV3IE51eHQoY29uZmlnKVxuICBnbG9iYWwuZC5udXh0ID0gbnV4dFxuXG4gIC8vIEJ1aWxkIG9ubHkgaW4gZGV2IG1vZGVcbiAgaWYgKGNvbmZpZy5kZXYpIHtcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIobnV4dClcbiAgICBhd2FpdCBidWlsZGVyLmJ1aWxkKClcbiAgfVxuXG4gIC8vIEdpdmUgbnV4dCBtaWRkbGV3YXJlIHRvIGV4cHJlc3NcbiAgYXBwLnVzZShudXh0LnJlbmRlcilcblxuICAvLyBMaXN0ZW4gdGhlIHNlcnZlclxuICBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKHBvcnQsIGhvc3QpXG4gIGxldCBzdWJ3c3MgPSBuZXcgU3Vid3NzKHtzZXJ2ZXIsIHBhdGg6ICcvYXBpL3dzLyd9KVxuICBzdWJ3c3Mub24oJ2VjaG8wJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBsZXQgbmFtZSA9ICdlY2hvMCdcbiAgICBsZXQgdGhhdCA9IHdzc1xuICAgIGxldCBpZCA9IG5hbWVcbiAgICBjb25zb2xlLmxvZyhgb24gJHtuYW1lfTpgLCBkYXRhKVxuICAgIGxldCBzdWJzY3JpYmVzID0gdGhhdC5zdWJzY3JpYmVzLmdldChpZClcbiAgICBpZiAoIXN1YnNjcmliZXMpIHJldHVyblxuICAgIHN1YnNjcmliZXMuZm9yRWFjaCh3cyA9PiB7XG4gICAgICB3cy5zZXF1ZW5jZSArPSAxXG4gICAgICB3cy5zdWJzY3JpYmVDb3VudFtpZF0gKz0gMVxuICAgICAgbGV0IGNvbmZpZ3MgPSB3cy5zdWJzY3JpYmVDb25maWdzW2lkXVxuICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG9rOiB0cnVlLFxuICAgICAgICBzZXF1ZW5jZTogd3Muc2VxdWVuY2UsXG4gICAgICAgIHN1YnNlcXVlbmNlOiB3cy5zdWJzY3JpYmVDb3VudFtpZF0sXG4gICAgICAgIGNvbmZpZ3MsXG4gICAgICAgIGlkLFxuICAgICAgICByZXM6IGRhdGFcbiAgICAgIH0pKVxuICAgIH0pXG4gIH0pXG4gIHN1Yndzcy5vbignZWNobzEnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGxldCBuYW1lID0gJ2VjaG8xJ1xuICAgIGxldCB0aGF0ID0gd3NzXG4gICAgbGV0IGlkID0gbmFtZVxuICAgIGNvbnNvbGUubG9nKGBvbiAke25hbWV9OmAsIGRhdGEpXG4gICAgbGV0IHN1YnNjcmliZXMgPSB0aGF0LnN1YnNjcmliZXMuZ2V0KGlkKVxuICAgIGlmICghc3Vic2NyaWJlcykgcmV0dXJuXG4gICAgc3Vic2NyaWJlcy5mb3JFYWNoKHdzID0+IHtcbiAgICAgIHdzLnNlcXVlbmNlICs9IDFcbiAgICAgIHdzLnN1YnNjcmliZUNvdW50W2lkXSArPSAxXG4gICAgICBsZXQgY29uZmlncyA9IHdzLnN1YnNjcmliZUNvbmZpZ3NbaWRdXG4gICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIHNlcXVlbmNlOiB3cy5zZXF1ZW5jZSxcbiAgICAgICAgc3Vic2VxdWVuY2U6IHdzLnN1YnNjcmliZUNvdW50W2lkXSxcbiAgICAgICAgY29uZmlncyxcbiAgICAgICAgaWQsXG4gICAgICAgIHJlczogZGF0YVxuICAgICAgfSkpXG4gICAgfSlcbiAgfSlcbiAgZ2xvYmFsLmQuc3Vid3NzID0gc3Vid3NzXG5cbiAgY29uc29sYS5yZWFkeSh7XG4gICAgbWVzc2FnZTogYFNlcnZlciBsaXN0ZW5pbmcgb24gaHR0cDovLyR7aG9zdH06JHtwb3J0fWAsXG4gICAgYmFkZ2U6IHRydWVcbiAgfSlcbiAgaWYgKGdsb2JhbENvbmZpZy5kYXRhYmFzZSA9PSAndGVzdCcpIHtcbiAgICBjb25zb2xhLndhcm4oe1xuICAgICAgbWVzc2FnZTogYFlvdSBhcmUgdXNpbmcgdGhlICd0ZXN0JyBkYXRhYmFzZSwgQWNjcmV0aW9uIGlzIHRodXMgaW4gdGhlIHRlc3QgbW9kZS5cXG4gICogVGhlIGRhdGFiYXNlIHdpbGwgYmUgcmVzZXQgYnkgdGVzdCBkYXRhIGVhY2ggdGltZSB5b3Ugc3RhcnQgdGhlIGJyYWluaG9sZS5cXG4gICogVXNlIG90aGVyIGRhdGFiYXNlIG5hbWUgaWYgeW91IHdhbnQgdG8gdXNlIHRoZSBBY2NyZXRpb24gbm9ybWFsbHlcXG4gICogU2VlIHRoZSBjb25maWcgZmlsZSAnY29uZmlncy9jb25maWcuanMnYCxcbiAgICAgIGJhZGdlOiB0cnVlXG4gICAgfSlcbiAgfVxufVxuc3RhcnQoKVxuIl19