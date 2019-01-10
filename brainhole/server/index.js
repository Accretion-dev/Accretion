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
var Models = require('./models/models').default;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJzZXNzaW9uIiwiY29uc29sYSIsIk51eHQiLCJCdWlsZGVyIiwiYXBwIiwiaG9zdCIsImdsb2JhbENvbmZpZyIsInBvcnQiLCJkIiwibSIsIm1vbmdvb3NlIiwic2V0IiwidXNlIiwianNvbiIsInVybGVuY29kZWQiLCJleHRlbmRlZCIsImN1cnJlbnRTZXNzaW9uIiwic2VjcmV0IiwicmVzYXZlIiwic2F2ZVVuaW5pdGlhbGl6ZWQiLCJwYXNzcG9ydCIsImluaXRpYWxpemUiLCJtb3VudGVkIiwiZGVmYXVsdCIsImNvbmZpZyIsImRldiIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsIm51eHRDb25maWciLCJ5YW1sIiwiZGF0YWJhc2VDb25maWciLCJyZWFkU3luYyIsIk1vZGVscyIsIlVzZXIiLCJMb2NhbFN0cmF0ZWd5IiwiU3RyYXRlZ3kiLCJhdXRoZW50aWNhdGUiLCJzZXJpYWxpemVVc2VyIiwiZGVzZXJpYWxpemVVc2VyIiwic3RhcnQiLCJudXh0IiwiZ2xvYmFsIiwiYnVpbGRlciIsImJ1aWxkIiwicmVuZGVyIiwic2VydmVyIiwibGlzdGVuIiwic3Vid3NzIiwiU3Vid3NzIiwicGF0aCIsIm9uIiwiZGF0YSIsIm5hbWUiLCJ0aGF0Iiwid3NzIiwiaWQiLCJjb25zb2xlIiwibG9nIiwic3Vic2NyaWJlcyIsImdldCIsImZvckVhY2giLCJ3cyIsInNlcXVlbmNlIiwic3Vic2NyaWJlQ291bnQiLCJjb25maWdzIiwic3Vic2NyaWJlQ29uZmlncyIsInNlbmQiLCJKU09OIiwic3RyaW5naWZ5Iiwib2siLCJzdWJzZXF1ZW5jZSIsInJlcyIsInJlYWR5IiwibWVzc2FnZSIsImJhZGdlIiwiZGF0YWJhc2UiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNB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U0FBa0JMLElBQWxCLFFBQTJCRCxJQUEzQjtBQUNBLFFBQUlPLGFBQWFMLEtBQUtLLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CSixFQUFwQixDQUFqQjtBQUNBLFFBQUksQ0FBQ0csVUFBTCxFQUFpQjtBQUNqQkEsZUFBV0UsT0FBWCxDQUFtQixjQUFNO0FBQ3ZCQyxTQUFHQyxRQUFILElBQWUsQ0FBZjtBQUNBRCxTQUFHRSxjQUFILENBQWtCUixFQUFsQixLQUF5QixDQUF6QjtBQUNBLFVBQUlTLFVBQVVILEdBQUdJLGdCQUFILENBQW9CVixFQUFwQixDQUFkO0FBQ0FNLFNBQUdLLElBQUgsQ0FBUUMsS0FBS0MsU0FBTCxDQUFlO0FBQ3JCQyxZQUFJLElBRGlCO0FBRXJCUCxrQkFBVUQsR0FBR0MsUUFGUTtBQUdyQlEscUJBQWFULEdBQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLENBSFE7QUFJckJTLHdCQUpxQjtBQUtyQlQsY0FMcUI7QUFNckJnQixhQUFLcEI7QUFOZ0IsT0FBZixDQUFSO0FBUUQsS0FaRDtBQWFELEdBcEJEO0FBcUJBVixTQUFPbEMsQ0FBUCxDQUFTd0MsTUFBVCxHQUFrQkEsTUFBbEI7O0FBRUEvQyxVQUFRd0UsS0FBUixDQUFjO0FBQ1pDLDZDQUF1Q3JFLElBQXZDLFNBQStDRSxJQURuQztBQUVab0UsV0FBTztBQUZLLEdBQWQ7QUFJQSxNQUFJckUsaUJBQWFzRSxRQUFiLElBQXlCLE1BQTdCLEVBQXFDO0FBQ25DM0UsWUFBUTRFLElBQVIsQ0FBYTtBQUNYSCwrUkFEVztBQUVYQyxhQUFPO0FBRkksS0FBYjtBQUlEO0FBQ0Y7QUFDRG5DIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRlYnVnU2V0dGluZ3MgZnJvbSAnLi9kZWJ1Zy1zZXR0aW5ncydcbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJ1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tICdjb29raWUtcGFyc2VyJ1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInXG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJ1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0J1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJ1xuaW1wb3J0IGRhdGFiYXNlX2luaXQgZnJvbSAnLi9tb2RlbHMnXG5pbXBvcnQgZ2xvYmFsQ29uZmlnIGZyb20gXCIuLi9jb25maWdzL2NvbmZpZy5qc1wiXG5pbXBvcnQgeWFtbCBmcm9tICdub2RlLXlhbWwnXG5pbXBvcnQgU3Vid3NzIGZyb20gJy4vYXBpL3dzc2VydmVyLmpzJ1xuXG5jb25zdCBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpXG5jb25zdCBzZXNzaW9uID0gcmVxdWlyZShcImV4cHJlc3Mtc2Vzc2lvblwiKVxuY29uc3QgY29uc29sYSA9IHJlcXVpcmUoJ2NvbnNvbGEnKVxuLy8gY29uc3QgY29ycyA9IHJlcXVpcmUoJ2NvcnMnKVxuY29uc3QgeyBOdXh0LCBCdWlsZGVyIH0gPSByZXF1aXJlKCdudXh0JylcbmNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuY29uc3QgaG9zdCA9IGdsb2JhbENvbmZpZy5ob3N0XG5jb25zdCBwb3J0ID0gZ2xvYmFsQ29uZmlnLnBvcnRcblxuZC5hcHAgPSBhcHBcbmQuY29uc29sYSA9IGNvbnNvbGFcbmQubSA9IG1vbmdvb3NlXG5cbmFwcC5zZXQoJ3BvcnQnLCBwb3J0KVxuYXBwLnNldCgnc3RyaWN0IHJvdXRpbmcnLCB0cnVlKVxuLy9hcHAudXNlKGNvcnMoe1xuLy8gIC8vIGNyZWRlbnRpYWxzOiB0cnVlLFxuLy8gIC8vIG9yaWdpbjogYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH1gXG4vL30pKVxuYXBwLnVzZShleHByZXNzLmpzb24oKSlcbmFwcC51c2UoZXhwcmVzcy51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IGZhbHNlIH0pKVxuYXBwLnVzZShjb29raWVQYXJzZXIoKSlcbmNvbnN0IGN1cnJlbnRTZXNzaW9uID0gc2Vzc2lvbih7XG4gIHNlY3JldDogJ2tleWJvYXJkIGNhdCcsIC8vIFRPRE86IGJlIHJhbmRvbSBsYXRlclxuICByZXNhdmU6IGZhbHNlLFxuICBzYXZlVW5pbml0aWFsaXplZDogZmFsc2UsXG59KVxuZC5zZXNzaW9uID0gY3VycmVudFNlc3Npb25cbmFwcC51c2UoY3VycmVudFNlc3Npb24pXG5hcHAudXNlKHBhc3Nwb3J0LmluaXRpYWxpemUoKSlcbmFwcC51c2UocGFzc3BvcnQuc2Vzc2lvbigpKVxuXG4vLyBtb3VudCByb3V0ZXJzIGZvciBiYWNrZW5kXG5sZXQgbW91bnRlZCA9IHJlcXVpcmUoJy4vcm91dGVzJykuZGVmYXVsdChhcHApXG5cbi8vIEltcG9ydCBhbmQgU2V0IE51eHQuanMgb3B0aW9uc1xubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL251eHQuY29uZmlnLmpzJylcbmNvbmZpZy5kZXYgPSAhKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpXG5cbmQubnV4dENvbmZpZyA9IGNvbmZpZ1xuZC5jb25maWcgPSBnbG9iYWxDb25maWdcbmQueWFtbCA9IHlhbWxcbmQuYXBwID0gYXBwXG5sZXQgZGF0YWJhc2VDb25maWcgPSB5YW1sLnJlYWRTeW5jKCcuLi9jb25maWdzL21vbmdvZC55bWwnKVxuZC5kYXRhYmFzZUNvbmZpZyA9IGRhdGFiYXNlQ29uZmlnXG5cbi8vIGF1dGhcbi8vIGxldCBVc2VyID0gcmVxdWlyZSgnLi9tb2RlbHMvbW9kZWxzJykuZGVmYXVsdC5Vc2VyXG5jb25zdCBNb2RlbHMgPSByZXF1aXJlKCcuL21vZGVscy9tb2RlbHMnKS5kZWZhdWx0XG5sZXQgVXNlciA9IE1vZGVscy5Vc2VyXG5jb25zdCBMb2NhbFN0cmF0ZWd5ID0gcmVxdWlyZSgncGFzc3BvcnQtbG9jYWwnKS5TdHJhdGVneVxucGFzc3BvcnQudXNlKG5ldyBMb2NhbFN0cmF0ZWd5KFVzZXIuYXV0aGVudGljYXRlKCkpKVxucGFzc3BvcnQuc2VyaWFsaXplVXNlcihVc2VyLnNlcmlhbGl6ZVVzZXIoKSlcbnBhc3Nwb3J0LmRlc2VyaWFsaXplVXNlcihVc2VyLmRlc2VyaWFsaXplVXNlcigpKVxuXG5hc3luYyBmdW5jdGlvbiBzdGFydCgpIHtcbiAgLy8gSW5pdCBOdXh0LmpzXG4gIGF3YWl0IGRhdGFiYXNlX2luaXQoe2NvbmZpZzogZ2xvYmFsQ29uZmlnLCBkYXRhYmFzZUNvbmZpZ30pXG4gIGNvbnN0IG51eHQgPSBuZXcgTnV4dChjb25maWcpXG4gIGdsb2JhbC5kLm51eHQgPSBudXh0XG5cbiAgLy8gQnVpbGQgb25seSBpbiBkZXYgbW9kZVxuICBpZiAoY29uZmlnLmRldikge1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcihudXh0KVxuICAgIGF3YWl0IGJ1aWxkZXIuYnVpbGQoKVxuICB9XG5cbiAgLy8gR2l2ZSBudXh0IG1pZGRsZXdhcmUgdG8gZXhwcmVzc1xuICBhcHAudXNlKG51eHQucmVuZGVyKVxuXG4gIC8vIExpc3RlbiB0aGUgc2VydmVyXG4gIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4ocG9ydCwgaG9zdClcbiAgbGV0IHN1YndzcyA9IG5ldyBTdWJ3c3Moe3NlcnZlciwgcGF0aDogJy9hcGkvd3MvJ30pXG4gIHN1Yndzcy5vbignZWNobzAnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGxldCBuYW1lID0gJ2VjaG8wJ1xuICAgIGxldCB0aGF0ID0gd3NzXG4gICAgbGV0IGlkID0gbmFtZVxuICAgIGNvbnNvbGUubG9nKGBvbiAke25hbWV9OmAsIGRhdGEpXG4gICAgbGV0IHN1YnNjcmliZXMgPSB0aGF0LnN1YnNjcmliZXMuZ2V0KGlkKVxuICAgIGlmICghc3Vic2NyaWJlcykgcmV0dXJuXG4gICAgc3Vic2NyaWJlcy5mb3JFYWNoKHdzID0+IHtcbiAgICAgIHdzLnNlcXVlbmNlICs9IDFcbiAgICAgIHdzLnN1YnNjcmliZUNvdW50W2lkXSArPSAxXG4gICAgICBsZXQgY29uZmlncyA9IHdzLnN1YnNjcmliZUNvbmZpZ3NbaWRdXG4gICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIHNlcXVlbmNlOiB3cy5zZXF1ZW5jZSxcbiAgICAgICAgc3Vic2VxdWVuY2U6IHdzLnN1YnNjcmliZUNvdW50W2lkXSxcbiAgICAgICAgY29uZmlncyxcbiAgICAgICAgaWQsXG4gICAgICAgIHJlczogZGF0YVxuICAgICAgfSkpXG4gICAgfSlcbiAgfSlcbiAgc3Vid3NzLm9uKCdlY2hvMScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgbGV0IG5hbWUgPSAnZWNobzEnXG4gICAgbGV0IHRoYXQgPSB3c3NcbiAgICBsZXQgaWQgPSBuYW1lXG4gICAgY29uc29sZS5sb2coYG9uICR7bmFtZX06YCwgZGF0YSlcbiAgICBsZXQgc3Vic2NyaWJlcyA9IHRoYXQuc3Vic2NyaWJlcy5nZXQoaWQpXG4gICAgaWYgKCFzdWJzY3JpYmVzKSByZXR1cm5cbiAgICBzdWJzY3JpYmVzLmZvckVhY2god3MgPT4ge1xuICAgICAgd3Muc2VxdWVuY2UgKz0gMVxuICAgICAgd3Muc3Vic2NyaWJlQ291bnRbaWRdICs9IDFcbiAgICAgIGxldCBjb25maWdzID0gd3Muc3Vic2NyaWJlQ29uZmlnc1tpZF1cbiAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgc2VxdWVuY2U6IHdzLnNlcXVlbmNlLFxuICAgICAgICBzdWJzZXF1ZW5jZTogd3Muc3Vic2NyaWJlQ291bnRbaWRdLFxuICAgICAgICBjb25maWdzLFxuICAgICAgICBpZCxcbiAgICAgICAgcmVzOiBkYXRhXG4gICAgICB9KSlcbiAgICB9KVxuICB9KVxuICBnbG9iYWwuZC5zdWJ3c3MgPSBzdWJ3c3NcblxuICBjb25zb2xhLnJlYWR5KHtcbiAgICBtZXNzYWdlOiBgU2VydmVyIGxpc3RlbmluZyBvbiBodHRwOi8vJHtob3N0fToke3BvcnR9YCxcbiAgICBiYWRnZTogdHJ1ZVxuICB9KVxuICBpZiAoZ2xvYmFsQ29uZmlnLmRhdGFiYXNlID09ICd0ZXN0Jykge1xuICAgIGNvbnNvbGEud2Fybih7XG4gICAgICBtZXNzYWdlOiBgWW91IGFyZSB1c2luZyB0aGUgJ3Rlc3QnIGRhdGFiYXNlLCBBY2NyZXRpb24gaXMgdGh1cyBpbiB0aGUgdGVzdCBtb2RlLlxcbiAgKiBUaGUgZGF0YWJhc2Ugd2lsbCBiZSByZXNldCBieSB0ZXN0IGRhdGEgZWFjaCB0aW1lIHlvdSBzdGFydCB0aGUgYnJhaW5ob2xlLlxcbiAgKiBVc2Ugb3RoZXIgZGF0YWJhc2UgbmFtZSBpZiB5b3Ugd2FudCB0byB1c2UgdGhlIEFjY3JldGlvbiBub3JtYWxseVxcbiAgKiBTZWUgdGhlIGNvbmZpZyBmaWxlICdjb25maWdzL2NvbmZpZy5qcydgLFxuICAgICAgYmFkZ2U6IHRydWVcbiAgICB9KVxuICB9XG59XG5zdGFydCgpXG4iXX0=