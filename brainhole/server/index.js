'use strict';

var _debugSettings = require('./debug-settings');

var _debugSettings2 = _interopRequireDefault(_debugSettings);

var _buildTest = require('./buildTest');

var _buildTest2 = _interopRequireDefault(_buildTest);

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

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

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
d.mongodb = _mongodb2.default;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJzZXNzaW9uIiwiY29uc29sYSIsIk51eHQiLCJCdWlsZGVyIiwiYXBwIiwiaG9zdCIsImdsb2JhbENvbmZpZyIsInBvcnQiLCJkIiwibSIsIm1vbmdvb3NlIiwibW9uZ29kYiIsInNldCIsInVzZSIsImpzb24iLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJjdXJyZW50U2Vzc2lvbiIsInNlY3JldCIsInJlc2F2ZSIsInNhdmVVbmluaXRpYWxpemVkIiwicGFzc3BvcnQiLCJpbml0aWFsaXplIiwibW91bnRlZCIsImRlZmF1bHQiLCJjb25maWciLCJkZXYiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJudXh0Q29uZmlnIiwieWFtbCIsImRhdGFiYXNlQ29uZmlnIiwicmVhZFN5bmMiLCJNb2RlbHMiLCJhcGkiLCJVc2VyIiwiTG9jYWxTdHJhdGVneSIsIlN0cmF0ZWd5IiwiYXV0aGVudGljYXRlIiwic2VyaWFsaXplVXNlciIsImRlc2VyaWFsaXplVXNlciIsInN0YXJ0IiwibnV4dCIsImdsb2JhbCIsImJ1aWxkZXIiLCJidWlsZCIsInJlbmRlciIsInNlcnZlciIsImxpc3RlbiIsInN1YndzcyIsIlN1YndzcyIsInBhdGgiLCJvbiIsImRhdGEiLCJuYW1lIiwidGhhdCIsIndzcyIsImlkIiwiY29uc29sZSIsImxvZyIsInN1YnNjcmliZXMiLCJnZXQiLCJmb3JFYWNoIiwid3MiLCJzZXF1ZW5jZSIsInN1YnNjcmliZUNvdW50IiwiY29uZmlncyIsInN1YnNjcmliZUNvbmZpZ3MiLCJzZW5kIiwiSlNPTiIsInN0cmluZ2lmeSIsIm9rIiwic3Vic2VxdWVuY2UiLCJyZXMiLCJyZWFkeSIsIm1lc3NhZ2UiLCJiYWRnZSIsImRhdGFiYXNlIiwid2FybiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNB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Z0I7QUFDakMsUUFBSUMsT0FBTyxPQUFYO0FBQ0EsUUFBSUMsT0FBT0MsR0FBWDtBQUNBLFFBQUlDLEtBQUtILElBQVQ7QUFDQUksWUFBUUMsR0FBUixTQUFrQkwsSUFBbEIsUUFBMkJELElBQTNCO0FBQ0EsUUFBSU8sYUFBYUwsS0FBS0ssVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0JKLEVBQXBCLENBQWpCO0FBQ0EsUUFBSSxDQUFDRyxVQUFMLEVBQWlCO0FBQ2pCQSxlQUFXRSxPQUFYLENBQW1CLGNBQU07QUFDdkJDLFNBQUdDLFFBQUgsSUFBZSxDQUFmO0FBQ0FELFNBQUdFLGNBQUgsQ0FBa0JSLEVBQWxCLEtBQXlCLENBQXpCO0FBQ0EsVUFBSVMsVUFBVUgsR0FBR0ksZ0JBQUgsQ0FBb0JWLEVBQXBCLENBQWQ7QUFDQU0sU0FBR0ssSUFBSCxDQUFRQyxLQUFLQyxTQUFMLENBQWU7QUFDckJDLFlBQUksSUFEaUI7QUFFckJQLGtCQUFVRCxHQUFHQyxRQUZRO0FBR3JCUSxxQkFBYVQsR0FBR0UsY0FBSCxDQUFrQlIsRUFBbEIsQ0FIUTtBQUlyQlMsd0JBSnFCO0FBS3JCVCxjQUxxQjtBQU1yQmdCLGFBQUtwQjtBQU5nQixPQUFmLENBQVI7QUFRRCxLQVpEO0FBYUQsR0FwQkQ7QUFxQkFWLFNBQU9wQyxDQUFQLENBQVMwQyxNQUFULEdBQWtCQSxNQUFsQjs7QUFFQWpELFVBQVEwRSxLQUFSLENBQWM7QUFDWkMsNkNBQXVDdkUsSUFBdkMsU0FBK0NFLElBRG5DO0FBRVpzRSxXQUFPO0FBRkssR0FBZDtBQUlBLE1BQUl2RSxpQkFBYXdFLFFBQWIsSUFBeUIsTUFBN0IsRUFBcUM7QUFDbkM3RSxZQUFROEUsSUFBUixDQUFhO0FBQ1hILCtSQURXO0FBRVhDLGFBQU87QUFGSSxLQUFiO0FBSUQ7QUFDRjtBQUNEbkMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZGVidWdTZXR0aW5ncyBmcm9tICcuL2RlYnVnLXNldHRpbmdzJ1xuaW1wb3J0IGJ1aWxkVGVzdCBmcm9tICcuL2J1aWxkVGVzdCdcbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJ1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tICdjb29raWUtcGFyc2VyJ1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInXG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJ1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0J1xuaW1wb3J0IG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJ1xuaW1wb3J0IG1vbmdvZGIgZnJvbSAnbW9uZ29kYidcbmltcG9ydCBkYXRhYmFzZV9pbml0IGZyb20gJy4vbW9kZWxzJ1xuaW1wb3J0IGdsb2JhbENvbmZpZyBmcm9tIFwiLi4vY29uZmlncy9jb25maWcuanNcIlxuaW1wb3J0IHlhbWwgZnJvbSAnbm9kZS15YW1sJ1xuaW1wb3J0IFN1YndzcyBmcm9tICcuL2FwaS93c3NlcnZlci5qcydcblxuY29uc3QgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKVxuY29uc3Qgc2Vzc2lvbiA9IHJlcXVpcmUoXCJleHByZXNzLXNlc3Npb25cIilcbmNvbnN0IGNvbnNvbGEgPSByZXF1aXJlKCdjb25zb2xhJylcbi8vIGNvbnN0IGNvcnMgPSByZXF1aXJlKCdjb3JzJylcbmNvbnN0IHsgTnV4dCwgQnVpbGRlciB9ID0gcmVxdWlyZSgnbnV4dCcpXG5jb25zdCBhcHAgPSBleHByZXNzKClcbmNvbnN0IGhvc3QgPSBnbG9iYWxDb25maWcuaG9zdFxuY29uc3QgcG9ydCA9IGdsb2JhbENvbmZpZy5wb3J0XG5cbmQuYXBwID0gYXBwXG5kLmNvbnNvbGEgPSBjb25zb2xhXG5kLm0gPSBtb25nb29zZVxuZC5tb25nb2RiID0gbW9uZ29kYlxuXG5hcHAuc2V0KCdwb3J0JywgcG9ydClcbmFwcC5zZXQoJ3N0cmljdCByb3V0aW5nJywgdHJ1ZSlcbi8vYXBwLnVzZShjb3JzKHtcbi8vICAvLyBjcmVkZW50aWFsczogdHJ1ZSxcbi8vICAvLyBvcmlnaW46IGBodHRwOi8vJHtob3N0fToke3BvcnR9YFxuLy99KSlcbmFwcC51c2UoZXhwcmVzcy5qc29uKCkpXG5hcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiBmYWxzZSB9KSlcbmFwcC51c2UoY29va2llUGFyc2VyKCkpXG5jb25zdCBjdXJyZW50U2Vzc2lvbiA9IHNlc3Npb24oe1xuICBzZWNyZXQ6ICdrZXlib2FyZCBjYXQnLCAvLyBUT0RPOiBiZSByYW5kb20gbGF0ZXJcbiAgcmVzYXZlOiBmYWxzZSxcbiAgc2F2ZVVuaW5pdGlhbGl6ZWQ6IGZhbHNlLFxufSlcbmQuc2Vzc2lvbiA9IGN1cnJlbnRTZXNzaW9uXG5hcHAudXNlKGN1cnJlbnRTZXNzaW9uKVxuYXBwLnVzZShwYXNzcG9ydC5pbml0aWFsaXplKCkpXG5hcHAudXNlKHBhc3Nwb3J0LnNlc3Npb24oKSlcblxuLy8gbW91bnQgcm91dGVycyBmb3IgYmFja2VuZFxubGV0IG1vdW50ZWQgPSByZXF1aXJlKCcuL3JvdXRlcycpLmRlZmF1bHQoYXBwKVxuXG4vLyBJbXBvcnQgYW5kIFNldCBOdXh0LmpzIG9wdGlvbnNcbmxldCBjb25maWcgPSByZXF1aXJlKCcuLi9udXh0LmNvbmZpZy5qcycpXG5jb25maWcuZGV2ID0gIShwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKVxuXG5kLm51eHRDb25maWcgPSBjb25maWdcbmQuY29uZmlnID0gZ2xvYmFsQ29uZmlnXG5kLnlhbWwgPSB5YW1sXG5kLmFwcCA9IGFwcFxubGV0IGRhdGFiYXNlQ29uZmlnID0geWFtbC5yZWFkU3luYygnLi4vY29uZmlncy9tb25nb2QueW1sJylcbmQuZGF0YWJhc2VDb25maWcgPSBkYXRhYmFzZUNvbmZpZ1xuXG4vLyBhdXRoXG4vLyBsZXQgVXNlciA9IHJlcXVpcmUoJy4vbW9kZWxzL21vZGVscycpLmRlZmF1bHQuVXNlclxuY29uc3Qge01vZGVscywgYXBpfSA9IHJlcXVpcmUoJy4vbW9kZWxzL21vZGVscycpLmRlZmF1bHRcbmxldCBVc2VyID0gTW9kZWxzLlVzZXJcbmNvbnN0IExvY2FsU3RyYXRlZ3kgPSByZXF1aXJlKCdwYXNzcG9ydC1sb2NhbCcpLlN0cmF0ZWd5XG5wYXNzcG9ydC51c2UobmV3IExvY2FsU3RyYXRlZ3koVXNlci5hdXRoZW50aWNhdGUoKSkpXG5wYXNzcG9ydC5zZXJpYWxpemVVc2VyKFVzZXIuc2VyaWFsaXplVXNlcigpKVxucGFzc3BvcnQuZGVzZXJpYWxpemVVc2VyKFVzZXIuZGVzZXJpYWxpemVVc2VyKCkpXG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAvLyBJbml0IE51eHQuanNcbiAgYXdhaXQgZGF0YWJhc2VfaW5pdCh7Y29uZmlnOiBnbG9iYWxDb25maWcsIGRhdGFiYXNlQ29uZmlnfSlcbiAgY29uc3QgbnV4dCA9IG5ldyBOdXh0KGNvbmZpZylcbiAgZ2xvYmFsLmQubnV4dCA9IG51eHRcblxuICAvLyBCdWlsZCBvbmx5IGluIGRldiBtb2RlXG4gIGlmIChjb25maWcuZGV2KSB7XG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKG51eHQpXG4gICAgYXdhaXQgYnVpbGRlci5idWlsZCgpXG4gIH1cblxuICAvLyBHaXZlIG51eHQgbWlkZGxld2FyZSB0byBleHByZXNzXG4gIGFwcC51c2UobnV4dC5yZW5kZXIpXG5cbiAgLy8gTGlzdGVuIHRoZSBzZXJ2ZXJcbiAgY29uc3Qgc2VydmVyID0gYXBwLmxpc3Rlbihwb3J0LCBob3N0KVxuICBsZXQgc3Vid3NzID0gbmV3IFN1Yndzcyh7c2VydmVyLCBwYXRoOiAnL2FwaS93cy8nfSlcbiAgc3Vid3NzLm9uKCdlY2hvMCcsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgbGV0IG5hbWUgPSAnZWNobzAnXG4gICAgbGV0IHRoYXQgPSB3c3NcbiAgICBsZXQgaWQgPSBuYW1lXG4gICAgY29uc29sZS5sb2coYG9uICR7bmFtZX06YCwgZGF0YSlcbiAgICBsZXQgc3Vic2NyaWJlcyA9IHRoYXQuc3Vic2NyaWJlcy5nZXQoaWQpXG4gICAgaWYgKCFzdWJzY3JpYmVzKSByZXR1cm5cbiAgICBzdWJzY3JpYmVzLmZvckVhY2god3MgPT4ge1xuICAgICAgd3Muc2VxdWVuY2UgKz0gMVxuICAgICAgd3Muc3Vic2NyaWJlQ291bnRbaWRdICs9IDFcbiAgICAgIGxldCBjb25maWdzID0gd3Muc3Vic2NyaWJlQ29uZmlnc1tpZF1cbiAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgc2VxdWVuY2U6IHdzLnNlcXVlbmNlLFxuICAgICAgICBzdWJzZXF1ZW5jZTogd3Muc3Vic2NyaWJlQ291bnRbaWRdLFxuICAgICAgICBjb25maWdzLFxuICAgICAgICBpZCxcbiAgICAgICAgcmVzOiBkYXRhXG4gICAgICB9KSlcbiAgICB9KVxuICB9KVxuICBzdWJ3c3Mub24oJ2VjaG8xJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBsZXQgbmFtZSA9ICdlY2hvMSdcbiAgICBsZXQgdGhhdCA9IHdzc1xuICAgIGxldCBpZCA9IG5hbWVcbiAgICBjb25zb2xlLmxvZyhgb24gJHtuYW1lfTpgLCBkYXRhKVxuICAgIGxldCBzdWJzY3JpYmVzID0gdGhhdC5zdWJzY3JpYmVzLmdldChpZClcbiAgICBpZiAoIXN1YnNjcmliZXMpIHJldHVyblxuICAgIHN1YnNjcmliZXMuZm9yRWFjaCh3cyA9PiB7XG4gICAgICB3cy5zZXF1ZW5jZSArPSAxXG4gICAgICB3cy5zdWJzY3JpYmVDb3VudFtpZF0gKz0gMVxuICAgICAgbGV0IGNvbmZpZ3MgPSB3cy5zdWJzY3JpYmVDb25maWdzW2lkXVxuICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG9rOiB0cnVlLFxuICAgICAgICBzZXF1ZW5jZTogd3Muc2VxdWVuY2UsXG4gICAgICAgIHN1YnNlcXVlbmNlOiB3cy5zdWJzY3JpYmVDb3VudFtpZF0sXG4gICAgICAgIGNvbmZpZ3MsXG4gICAgICAgIGlkLFxuICAgICAgICByZXM6IGRhdGFcbiAgICAgIH0pKVxuICAgIH0pXG4gIH0pXG4gIGdsb2JhbC5kLnN1YndzcyA9IHN1Yndzc1xuXG4gIGNvbnNvbGEucmVhZHkoe1xuICAgIG1lc3NhZ2U6IGBTZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH1gLFxuICAgIGJhZGdlOiB0cnVlXG4gIH0pXG4gIGlmIChnbG9iYWxDb25maWcuZGF0YWJhc2UgPT0gJ3Rlc3QnKSB7XG4gICAgY29uc29sYS53YXJuKHtcbiAgICAgIG1lc3NhZ2U6IGBZb3UgYXJlIHVzaW5nIHRoZSAndGVzdCcgZGF0YWJhc2UsIEFjY3JldGlvbiBpcyB0aHVzIGluIHRoZSB0ZXN0IG1vZGUuXFxuICAqIFRoZSBkYXRhYmFzZSB3aWxsIGJlIHJlc2V0IGJ5IHRlc3QgZGF0YSBlYWNoIHRpbWUgeW91IHN0YXJ0IHRoZSBicmFpbmhvbGUuXFxuICAqIFVzZSBvdGhlciBkYXRhYmFzZSBuYW1lIGlmIHlvdSB3YW50IHRvIHVzZSB0aGUgQWNjcmV0aW9uIG5vcm1hbGx5XFxuICAqIFNlZSB0aGUgY29uZmlnIGZpbGUgJ2NvbmZpZ3MvY29uZmlnLmpzJ2AsXG4gICAgICBiYWRnZTogdHJ1ZVxuICAgIH0pXG4gIH1cbn1cbnN0YXJ0KClcbiJdfQ==