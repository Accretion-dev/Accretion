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
var cors = require('cors');

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJzZXNzaW9uIiwiY29uc29sYSIsImNvcnMiLCJOdXh0IiwiQnVpbGRlciIsImFwcCIsImhvc3QiLCJnbG9iYWxDb25maWciLCJwb3J0IiwiZCIsIm0iLCJtb25nb29zZSIsInNldCIsInVzZSIsImpzb24iLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJjdXJyZW50U2Vzc2lvbiIsInNlY3JldCIsInJlc2F2ZSIsInNhdmVVbmluaXRpYWxpemVkIiwicGFzc3BvcnQiLCJpbml0aWFsaXplIiwibW91bnRlZCIsImRlZmF1bHQiLCJjb25maWciLCJkZXYiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJudXh0Q29uZmlnIiwieWFtbCIsImRhdGFiYXNlQ29uZmlnIiwicmVhZFN5bmMiLCJNb2RlbHMiLCJVc2VyIiwiTG9jYWxTdHJhdGVneSIsIlN0cmF0ZWd5IiwiYXV0aGVudGljYXRlIiwic2VyaWFsaXplVXNlciIsImRlc2VyaWFsaXplVXNlciIsInN0YXJ0IiwibnV4dCIsImdsb2JhbCIsImJ1aWxkZXIiLCJidWlsZCIsInJlbmRlciIsInNlcnZlciIsImxpc3RlbiIsInN1YndzcyIsIlN1YndzcyIsInBhdGgiLCJvbiIsImRhdGEiLCJuYW1lIiwidGhhdCIsIndzcyIsImlkIiwiY29uc29sZSIsImxvZyIsInN1YnNjcmliZXMiLCJnZXQiLCJmb3JFYWNoIiwid3MiLCJzZXF1ZW5jZSIsInN1YnNjcmliZUNvdW50IiwiY29uZmlncyIsInN1YnNjcmliZUNvbmZpZ3MiLCJzZW5kIiwiSlNPTiIsInN0cmluZ2lmeSIsIm9rIiwic3Vic2VxdWVuY2UiLCJyZXMiLCJyZWFkeSIsIm1lc3NhZ2UiLCJiYWRnZSIsImRhdGFiYXNlIiwid2FybiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7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LFFBQUlDLEtBQUtILElBQVQ7QUFDQUksWUFBUUMsR0FBUixTQUFrQkwsSUFBbEIsUUFBMkJELElBQTNCO0FBQ0EsUUFBSU8sYUFBYUwsS0FBS0ssVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0JKLEVBQXBCLENBQWpCO0FBQ0EsUUFBSSxDQUFDRyxVQUFMLEVBQWlCO0FBQ2pCQSxlQUFXRSxPQUFYLENBQW1CLGNBQU07QUFDdkJDLFNBQUdDLFFBQUgsSUFBZSxDQUFmO0FBQ0FELFNBQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLEtBQXlCLENBQXpCO0FBQ0EsVUFBSVMsVUFBVUgsR0FBR0ksZ0JBQUgsQ0FBb0JWLEVBQXBCLENBQWQ7QUFDQU0sU0FBR0ssSUFBSCxDQUFRQyxLQUFLQyxTQUFMLENBQWU7QUFDckJDLFlBQUksSUFEaUI7QUFFckJQLGtCQUFVRCxHQUFHQyxRQUZRO0FBR3JCUSxxQkFBYVQsR0FBR0UsY0FBSCxDQUFrQlIsRUFBbEIsQ0FIUTtBQUlyQlMsd0JBSnFCO0FBS3JCVCxjQUxxQjtBQU1yQmdCLGFBQUtwQjtBQU5nQixPQUFmLENBQVI7QUFRRCxLQVpEO0FBYUQsR0FwQkQ7QUFxQkFWLFNBQU9sQyxDQUFQLENBQVN3QyxNQUFULEdBQWtCQSxNQUFsQjs7QUFFQWhELFVBQVF5RSxLQUFSLENBQWM7QUFDWkMsNkNBQXVDckUsSUFBdkMsU0FBK0NFLElBRG5DO0FBRVpvRSxXQUFPO0FBRkssR0FBZDtBQUlBLE1BQUlyRSxpQkFBYXNFLFFBQWIsSUFBeUIsTUFBN0IsRUFBcUM7QUFDbkM1RSxZQUFRNkUsSUFBUixDQUFhO0FBQ1hILCtSQURXO0FBRVhDLGFBQU87QUFGSSxLQUFiO0FBSUQ7QUFDRjtBQUNEbkMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZGVidWdTZXR0aW5ncyBmcm9tICcuL2RlYnVnLXNldHRpbmdzJ1xuaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCdcbmltcG9ydCBXZWJTb2NrZXQgZnJvbSAnd3MnXG5pbXBvcnQgY29va2llUGFyc2VyIGZyb20gJ2Nvb2tpZS1wYXJzZXInXG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcidcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnXG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnXG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnXG5pbXBvcnQgZGF0YWJhc2VfaW5pdCBmcm9tICcuL21vZGVscydcbmltcG9ydCBnbG9iYWxDb25maWcgZnJvbSBcIi4uL2NvbmZpZ3MvY29uZmlnLmpzXCJcbmltcG9ydCB5YW1sIGZyb20gJ25vZGUteWFtbCdcbmltcG9ydCBTdWJ3c3MgZnJvbSAnLi9hcGkvd3NzZXJ2ZXIuanMnXG5cbmNvbnN0IGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJylcbmNvbnN0IHNlc3Npb24gPSByZXF1aXJlKFwiZXhwcmVzcy1zZXNzaW9uXCIpXG5jb25zdCBjb25zb2xhID0gcmVxdWlyZSgnY29uc29sYScpXG5jb25zdCBjb3JzID0gcmVxdWlyZSgnY29ycycpXG5jb25zdCB7IE51eHQsIEJ1aWxkZXIgfSA9IHJlcXVpcmUoJ251eHQnKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG5jb25zdCBob3N0ID0gZ2xvYmFsQ29uZmlnLmhvc3RcbmNvbnN0IHBvcnQgPSBnbG9iYWxDb25maWcucG9ydFxuXG5kLmFwcCA9IGFwcFxuZC5jb25zb2xhID0gY29uc29sYVxuZC5tID0gbW9uZ29vc2VcblxuYXBwLnNldCgncG9ydCcsIHBvcnQpXG5hcHAuc2V0KCdzdHJpY3Qgcm91dGluZycsIHRydWUpXG4vL2FwcC51c2UoY29ycyh7XG4vLyAgLy8gY3JlZGVudGlhbHM6IHRydWUsXG4vLyAgLy8gb3JpZ2luOiBgaHR0cDovLyR7aG9zdH06JHtwb3J0fWBcbi8vfSkpXG5hcHAudXNlKGV4cHJlc3MuanNvbigpKVxuYXBwLnVzZShleHByZXNzLnVybGVuY29kZWQoeyBleHRlbmRlZDogZmFsc2UgfSkpXG5hcHAudXNlKGNvb2tpZVBhcnNlcigpKVxuY29uc3QgY3VycmVudFNlc3Npb24gPSBzZXNzaW9uKHtcbiAgc2VjcmV0OiAna2V5Ym9hcmQgY2F0JywgLy8gVE9ETzogYmUgcmFuZG9tIGxhdGVyXG4gIHJlc2F2ZTogZmFsc2UsXG4gIHNhdmVVbmluaXRpYWxpemVkOiBmYWxzZSxcbn0pXG5kLnNlc3Npb24gPSBjdXJyZW50U2Vzc2lvblxuYXBwLnVzZShjdXJyZW50U2Vzc2lvbilcbmFwcC51c2UocGFzc3BvcnQuaW5pdGlhbGl6ZSgpKVxuYXBwLnVzZShwYXNzcG9ydC5zZXNzaW9uKCkpXG5cbi8vIG1vdW50IHJvdXRlcnMgZm9yIGJhY2tlbmRcbmxldCBtb3VudGVkID0gcmVxdWlyZSgnLi9yb3V0ZXMnKS5kZWZhdWx0KGFwcClcblxuLy8gSW1wb3J0IGFuZCBTZXQgTnV4dC5qcyBvcHRpb25zXG5sZXQgY29uZmlnID0gcmVxdWlyZSgnLi4vbnV4dC5jb25maWcuanMnKVxuY29uZmlnLmRldiA9ICEocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJylcblxuZC5udXh0Q29uZmlnID0gY29uZmlnXG5kLmNvbmZpZyA9IGdsb2JhbENvbmZpZ1xuZC55YW1sID0geWFtbFxuZC5hcHAgPSBhcHBcbmxldCBkYXRhYmFzZUNvbmZpZyA9IHlhbWwucmVhZFN5bmMoJy4uL2NvbmZpZ3MvbW9uZ29kLnltbCcpXG5kLmRhdGFiYXNlQ29uZmlnID0gZGF0YWJhc2VDb25maWdcblxuLy8gYXV0aFxuLy8gbGV0IFVzZXIgPSByZXF1aXJlKCcuL21vZGVscy9tb2RlbHMnKS5kZWZhdWx0LlVzZXJcbmNvbnN0IE1vZGVscyA9IHJlcXVpcmUoJy4vbW9kZWxzL21vZGVscycpLmRlZmF1bHRcbmxldCBVc2VyID0gTW9kZWxzLlVzZXJcbmNvbnN0IExvY2FsU3RyYXRlZ3kgPSByZXF1aXJlKCdwYXNzcG9ydC1sb2NhbCcpLlN0cmF0ZWd5XG5wYXNzcG9ydC51c2UobmV3IExvY2FsU3RyYXRlZ3koVXNlci5hdXRoZW50aWNhdGUoKSkpXG5wYXNzcG9ydC5zZXJpYWxpemVVc2VyKFVzZXIuc2VyaWFsaXplVXNlcigpKVxucGFzc3BvcnQuZGVzZXJpYWxpemVVc2VyKFVzZXIuZGVzZXJpYWxpemVVc2VyKCkpXG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAvLyBJbml0IE51eHQuanNcbiAgYXdhaXQgZGF0YWJhc2VfaW5pdCh7Y29uZmlnOiBnbG9iYWxDb25maWcsIGRhdGFiYXNlQ29uZmlnfSlcbiAgY29uc3QgbnV4dCA9IG5ldyBOdXh0KGNvbmZpZylcbiAgZ2xvYmFsLmQubnV4dCA9IG51eHRcblxuICAvLyBCdWlsZCBvbmx5IGluIGRldiBtb2RlXG4gIGlmIChjb25maWcuZGV2KSB7XG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKG51eHQpXG4gICAgYXdhaXQgYnVpbGRlci5idWlsZCgpXG4gIH1cblxuICAvLyBHaXZlIG51eHQgbWlkZGxld2FyZSB0byBleHByZXNzXG4gIGFwcC51c2UobnV4dC5yZW5kZXIpXG5cbiAgLy8gTGlzdGVuIHRoZSBzZXJ2ZXJcbiAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3Rlbihwb3J0LCBob3N0KVxuICBsZXQgc3Vid3NzID0gbmV3IFN1Yndzcyh7c2VydmVyLCBwYXRoOiAnL2FwaS93cy8nfSlcbiAgc3Vid3NzLm9uKCdlY2hvMCcsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgbGV0IG5hbWUgPSAnZWNobzAnXG4gICAgbGV0IHRoYXQgPSB3c3NcbiAgICBsZXQgaWQgPSBuYW1lXG4gICAgY29uc29sZS5sb2coYG9uICR7bmFtZX06YCwgZGF0YSlcbiAgICBsZXQgc3Vic2NyaWJlcyA9IHRoYXQuc3Vic2NyaWJlcy5nZXQoaWQpXG4gICAgaWYgKCFzdWJzY3JpYmVzKSByZXR1cm5cbiAgICBzdWJzY3JpYmVzLmZvckVhY2god3MgPT4ge1xuICAgICAgd3Muc2VxdWVuY2UgKz0gMVxuICAgICAgd3Muc3Vic2NyaWJlQ291bnRbaWRdICs9IDFcbiAgICAgIGxldCBjb25maWdzID0gd3Muc3Vic2NyaWJlQ29uZmlnc1tpZF1cbiAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgc2VxdWVuY2U6IHdzLnNlcXVlbmNlLFxuICAgICAgICBzdWJzZXF1ZW5jZTogd3Muc3Vic2NyaWJlQ291bnRbaWRdLFxuICAgICAgICBjb25maWdzLFxuICAgICAgICBpZCxcbiAgICAgICAgcmVzOiBkYXRhXG4gICAgICB9KSlcbiAgICB9KVxuICB9KVxuICBzdWJ3c3Mub24oJ2VjaG8xJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBsZXQgbmFtZSA9ICdlY2hvMSdcbiAgICBsZXQgdGhhdCA9IHdzc1xuICAgIGxldCBpZCA9IG5hbWVcbiAgICBjb25zb2xlLmxvZyhgb24gJHtuYW1lfTpgLCBkYXRhKVxuICAgIGxldCBzdWJzY3JpYmVzID0gdGhhdC5zdWJzY3JpYmVzLmdldChpZClcbiAgICBpZiAoIXN1YnNjcmliZXMpIHJldHVyblxuICAgIHN1YnNjcmliZXMuZm9yRWFjaCh3cyA9PiB7XG4gICAgICB3cy5zZXF1ZW5jZSArPSAxXG4gICAgICB3cy5zdWJzY3JpYmVDb3VudFtpZF0gKz0gMVxuICAgICAgbGV0IGNvbmZpZ3MgPSB3cy5zdWJzY3JpYmVDb25maWdzW2lkXVxuICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG9rOiB0cnVlLFxuICAgICAgICBzZXF1ZW5jZTogd3Muc2VxdWVuY2UsXG4gICAgICAgIHN1YnNlcXVlbmNlOiB3cy5zdWJzY3JpYmVDb3VudFtpZF0sXG4gICAgICAgIGNvbmZpZ3MsXG4gICAgICAgIGlkLFxuICAgICAgICByZXM6IGRhdGFcbiAgICAgIH0pKVxuICAgIH0pXG4gIH0pXG4gIGdsb2JhbC5kLnN1YndzcyA9IHN1Yndzc1xuXG4gIGNvbnNvbGEucmVhZHkoe1xuICAgIG1lc3NhZ2U6IGBTZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH1gLFxuICAgIGJhZGdlOiB0cnVlXG4gIH0pXG4gIGlmIChnbG9iYWxDb25maWcuZGF0YWJhc2UgPT0gJ3Rlc3QnKSB7XG4gICAgY29uc29sYS53YXJuKHtcbiAgICAgIG1lc3NhZ2U6IGBZb3UgYXJlIHVzaW5nIHRoZSAndGVzdCcgZGF0YWJhc2UsIEFjY3JldGlvbiBpcyB0aHVzIGluIHRoZSB0ZXN0IG1vZGUuXFxuICAqIFRoZSBkYXRhYmFzZSB3aWxsIGJlIHJlc2V0IGJ5IHRlc3QgZGF0YSBlYWNoIHRpbWUgeW91IHN0YXJ0IHRoZSBicmFpbmhvbGUuXFxuICAqIFVzZSBvdGhlciBkYXRhYmFzZSBuYW1lIGlmIHlvdSB3YW50IHRvIHVzZSB0aGUgQWNjcmV0aW9uIG5vcm1hbGx5XFxuICAqIFNlZSB0aGUgY29uZmlnIGZpbGUgJ2NvbmZpZ3MvY29uZmlnLmpzJ2AsXG4gICAgICBiYWRnZTogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cbnN0YXJ0KClcbiJdfQ==