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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var session = require("express-session");
var consola = require('consola');

var _require = require('nuxt'),
    Nuxt = _require.Nuxt,
    Builder = _require.Builder;

var app = express();
var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || 3000;

d.app = app;
d.consola = consola;
d.m = _mongoose2.default;

app.set('port', port);
app.set('strict routing', true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((0, _cookieParser2.default)());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(_passport2.default.initialize());
app.use(_passport2.default.session());

var expressWs = require('express-ws')(app);
// mount routers for backend
var mounted = require('./routes').default(app);

// Import and Set Nuxt.js options
var config = require('../nuxt.config.js');
config.dev = !(process.env.NODE_ENV === 'production');

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
  await (0, _models2.default)();
  var nuxt = new Nuxt(config);

  // Build only in dev mode
  if (config.dev) {
    var builder = new Builder(nuxt);
    await builder.build();
  }

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  app.listen(port, host);
  consola.ready({
    message: 'Server listening on http://' + host + ':' + port,
    badge: true
  });
}
start();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJzZXNzaW9uIiwiY29uc29sYSIsIk51eHQiLCJCdWlsZGVyIiwiYXBwIiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJIT1NUIiwicG9ydCIsIlBPUlQiLCJkIiwibSIsIm1vbmdvb3NlIiwic2V0IiwidXNlIiwianNvbiIsInVybGVuY29kZWQiLCJleHRlbmRlZCIsInNlY3JldCIsInJlc2F2ZSIsInNhdmVVbmluaXRpYWxpemVkIiwicGFzc3BvcnQiLCJpbml0aWFsaXplIiwiZXhwcmVzc1dzIiwibW91bnRlZCIsImRlZmF1bHQiLCJjb25maWciLCJkZXYiLCJOT0RFX0VOViIsIk1vZGVscyIsIlVzZXIiLCJMb2NhbFN0cmF0ZWd5IiwiU3RyYXRlZ3kiLCJhdXRoZW50aWNhdGUiLCJzZXJpYWxpemVVc2VyIiwiZGVzZXJpYWxpemVVc2VyIiwic3RhcnQiLCJudXh0IiwiYnVpbGRlciIsImJ1aWxkIiwicmVuZGVyIiwibGlzdGVuIiwicmVhZHkiLCJtZXNzYWdlIiwiYmFkZ2UiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsVUFBVUMsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxpQkFBUixDQUFoQjtBQUNBLElBQU1FLFVBQVVGLFFBQVEsU0FBUixDQUFoQjs7ZUFDMEJBLFFBQVEsTUFBUixDO0lBQWxCRyxJLFlBQUFBLEk7SUFBTUMsTyxZQUFBQSxPOztBQUNkLElBQU1DLE1BQU1OLFNBQVo7QUFDQSxJQUFNTyxPQUFPQyxRQUFRQyxHQUFSLENBQVlDLElBQVosSUFBb0IsV0FBakM7QUFDQSxJQUFNQyxPQUFPSCxRQUFRQyxHQUFSLENBQVlHLElBQVosSUFBb0IsSUFBakM7O0FBRUFDLEVBQUVQLEdBQUYsR0FBUUEsR0FBUjtBQUNBTyxFQUFFVixPQUFGLEdBQVlBLE9BQVo7QUFDQVUsRUFBRUMsQ0FBRixHQUFNQyxrQkFBTjs7QUFFQVQsSUFBSVUsR0FBSixDQUFRLE1BQVIsRUFBZ0JMLElBQWhCO0FBQ0FMLElBQUlVLEdBQUosQ0FBUSxnQkFBUixFQUEwQixJQUExQjtBQUNBVixJQUFJVyxHQUFKLENBQVFqQixRQUFRa0IsSUFBUixFQUFSO0FBQ0FaLElBQUlXLEdBQUosQ0FBUWpCLFFBQVFtQixVQUFSLENBQW1CLEVBQUVDLFVBQVUsS0FBWixFQUFuQixDQUFSO0FBQ0FkLElBQUlXLEdBQUosQ0FBUSw2QkFBUjtBQUNBWCxJQUFJVyxHQUFKLENBQVFmLFFBQVE7QUFDZG1CLFVBQVEsY0FETTtBQUVkQyxVQUFRLEtBRk07QUFHZEMscUJBQW1CO0FBSEwsQ0FBUixDQUFSO0FBS0FqQixJQUFJVyxHQUFKLENBQVFPLG1CQUFTQyxVQUFULEVBQVI7QUFDQW5CLElBQUlXLEdBQUosQ0FBUU8sbUJBQVN0QixPQUFULEVBQVI7O0FBRUEsSUFBSXdCLFlBQVl6QixRQUFRLFlBQVIsRUFBc0JLLEdBQXRCLENBQWhCO0FBQ0E7QUFDQSxJQUFJcUIsVUFBVTFCLFFBQVEsVUFBUixFQUFvQjJCLE9BQXBCLENBQTRCdEIsR0FBNUIsQ0FBZDs7QUFFQTtBQUNBLElBQUl1QixTQUFTNUIsUUFBUSxtQkFBUixDQUFiO0FBQ0E0QixPQUFPQyxHQUFQLEdBQWEsRUFBRXRCLFFBQVFDLEdBQVIsQ0FBWXNCLFFBQVosS0FBeUIsWUFBM0IsQ0FBYjs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsU0FBUy9CLFFBQVEsaUJBQVIsRUFBMkIyQixPQUExQztBQUNBLElBQUlLLE9BQU9ELE9BQU9DLElBQWxCO0FBQ0EsSUFBTUMsZ0JBQWdCakMsUUFBUSxnQkFBUixFQUEwQmtDLFFBQWhEO0FBQ0FYLG1CQUFTUCxHQUFULENBQWEsSUFBSWlCLGFBQUosQ0FBa0JELEtBQUtHLFlBQUwsRUFBbEIsQ0FBYjtBQUNBWixtQkFBU2EsYUFBVCxDQUF1QkosS0FBS0ksYUFBTCxFQUF2QjtBQUNBYixtQkFBU2MsZUFBVCxDQUF5QkwsS0FBS0ssZUFBTCxFQUF6Qjs7QUFFQSxlQUFlQyxLQUFmLEdBQXVCO0FBQ3JCO0FBQ0EsUUFBTSx1QkFBTjtBQUNBLE1BQU1DLE9BQU8sSUFBSXBDLElBQUosQ0FBU3lCLE1BQVQsQ0FBYjs7QUFFQTtBQUNBLE1BQUlBLE9BQU9DLEdBQVgsRUFBZ0I7QUFDZCxRQUFNVyxVQUFVLElBQUlwQyxPQUFKLENBQVltQyxJQUFaLENBQWhCO0FBQ0EsVUFBTUMsUUFBUUMsS0FBUixFQUFOO0FBQ0Q7O0FBRUQ7QUFDQXBDLE1BQUlXLEdBQUosQ0FBUXVCLEtBQUtHLE1BQWI7O0FBRUE7QUFDQXJDLE1BQUlzQyxNQUFKLENBQVdqQyxJQUFYLEVBQWlCSixJQUFqQjtBQUNBSixVQUFRMEMsS0FBUixDQUFjO0FBQ1pDLDZDQUF1Q3ZDLElBQXZDLFNBQStDSSxJQURuQztBQUVab0MsV0FBTztBQUZLLEdBQWQ7QUFJRDtBQUNEUiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkZWJ1Z1NldHRpbmdzIGZyb20gJy4vZGVidWctc2V0dGluZ3MnXG5pbXBvcnQgJ2JhYmVsLXBvbHlmaWxsJ1xuaW1wb3J0IFdlYlNvY2tldCBmcm9tICd3cydcbmltcG9ydCBjb29raWVQYXJzZXIgZnJvbSAnY29va2llLXBhcnNlcidcbmltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJ1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYydcbmltcG9ydCBwYXNzcG9ydCBmcm9tICdwYXNzcG9ydCdcbmltcG9ydCBtb25nb29zZSBmcm9tICdtb25nb29zZSdcbmltcG9ydCBkYXRhYmFzZV9pbml0IGZyb20gJy4vbW9kZWxzJ1xuXG5jb25zdCBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpXG5jb25zdCBzZXNzaW9uID0gcmVxdWlyZShcImV4cHJlc3Mtc2Vzc2lvblwiKVxuY29uc3QgY29uc29sYSA9IHJlcXVpcmUoJ2NvbnNvbGEnKVxuY29uc3QgeyBOdXh0LCBCdWlsZGVyIH0gPSByZXF1aXJlKCdudXh0JylcbmNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LkhPU1QgfHwgJzEyNy4wLjAuMSdcbmNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDBcblxuZC5hcHAgPSBhcHBcbmQuY29uc29sYSA9IGNvbnNvbGFcbmQubSA9IG1vbmdvb3NlXG5cbmFwcC5zZXQoJ3BvcnQnLCBwb3J0KVxuYXBwLnNldCgnc3RyaWN0IHJvdXRpbmcnLCB0cnVlKVxuYXBwLnVzZShleHByZXNzLmpzb24oKSlcbmFwcC51c2UoZXhwcmVzcy51cmxlbmNvZGVkKHsgZXh0ZW5kZWQ6IGZhbHNlIH0pKVxuYXBwLnVzZShjb29raWVQYXJzZXIoKSlcbmFwcC51c2Uoc2Vzc2lvbih7XG4gIHNlY3JldDogJ2tleWJvYXJkIGNhdCcsXG4gIHJlc2F2ZTogZmFsc2UsXG4gIHNhdmVVbmluaXRpYWxpemVkOiBmYWxzZSxcbn0pKVxuYXBwLnVzZShwYXNzcG9ydC5pbml0aWFsaXplKCkpXG5hcHAudXNlKHBhc3Nwb3J0LnNlc3Npb24oKSlcblxubGV0IGV4cHJlc3NXcyA9IHJlcXVpcmUoJ2V4cHJlc3Mtd3MnKShhcHApXG4vLyBtb3VudCByb3V0ZXJzIGZvciBiYWNrZW5kXG5sZXQgbW91bnRlZCA9IHJlcXVpcmUoJy4vcm91dGVzJykuZGVmYXVsdChhcHApXG5cbi8vIEltcG9ydCBhbmQgU2V0IE51eHQuanMgb3B0aW9uc1xubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL251eHQuY29uZmlnLmpzJylcbmNvbmZpZy5kZXYgPSAhKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpXG5cbi8vIGF1dGhcbi8vIGxldCBVc2VyID0gcmVxdWlyZSgnLi9tb2RlbHMvbW9kZWxzJykuZGVmYXVsdC5Vc2VyXG5jb25zdCBNb2RlbHMgPSByZXF1aXJlKCcuL21vZGVscy9tb2RlbHMnKS5kZWZhdWx0XG5sZXQgVXNlciA9IE1vZGVscy5Vc2VyXG5jb25zdCBMb2NhbFN0cmF0ZWd5ID0gcmVxdWlyZSgncGFzc3BvcnQtbG9jYWwnKS5TdHJhdGVneVxucGFzc3BvcnQudXNlKG5ldyBMb2NhbFN0cmF0ZWd5KFVzZXIuYXV0aGVudGljYXRlKCkpKVxucGFzc3BvcnQuc2VyaWFsaXplVXNlcihVc2VyLnNlcmlhbGl6ZVVzZXIoKSlcbnBhc3Nwb3J0LmRlc2VyaWFsaXplVXNlcihVc2VyLmRlc2VyaWFsaXplVXNlcigpKVxuXG5hc3luYyBmdW5jdGlvbiBzdGFydCgpIHtcbiAgLy8gSW5pdCBOdXh0LmpzXG4gIGF3YWl0IGRhdGFiYXNlX2luaXQoKVxuICBjb25zdCBudXh0ID0gbmV3IE51eHQoY29uZmlnKVxuXG4gIC8vIEJ1aWxkIG9ubHkgaW4gZGV2IG1vZGVcbiAgaWYgKGNvbmZpZy5kZXYpIHtcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIobnV4dClcbiAgICBhd2FpdCBidWlsZGVyLmJ1aWxkKClcbiAgfVxuXG4gIC8vIEdpdmUgbnV4dCBtaWRkbGV3YXJlIHRvIGV4cHJlc3NcbiAgYXBwLnVzZShudXh0LnJlbmRlcilcblxuICAvLyBMaXN0ZW4gdGhlIHNlcnZlclxuICBhcHAubGlzdGVuKHBvcnQsIGhvc3QpXG4gIGNvbnNvbGEucmVhZHkoe1xuICAgIG1lc3NhZ2U6IGBTZXJ2ZXIgbGlzdGVuaW5nIG9uIGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH1gLFxuICAgIGJhZGdlOiB0cnVlXG4gIH0pXG59XG5zdGFydCgpXG4iXX0=