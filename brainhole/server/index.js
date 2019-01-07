'use strict';

require('babel-polyfill');

var _config = require('../configs/config.js');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');
var consola = require('consola');

var _require = require('nuxt'),
    Nuxt = _require.Nuxt,
    Builder = _require.Builder;

var app = express();
var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || 3000;

var d = global.d = {};

app.set('port', port);

// Import and Set Nuxt.js options
var config = require('../nuxt.config.js');
config.dev = !(process.env.NODE_ENV === 'production');

async function start() {
  // Init Nuxt.js
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NlcnZlci1zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiZXhwcmVzcyIsInJlcXVpcmUiLCJjb25zb2xhIiwiTnV4dCIsIkJ1aWxkZXIiLCJhcHAiLCJob3N0IiwicHJvY2VzcyIsImVudiIsIkhPU1QiLCJwb3J0IiwiUE9SVCIsImQiLCJnbG9iYWwiLCJzZXQiLCJjb25maWciLCJkZXYiLCJOT0RFX0VOViIsInN0YXJ0IiwibnV4dCIsImJ1aWxkZXIiLCJidWlsZCIsInVzZSIsInJlbmRlciIsImxpc3RlbiIsInJlYWR5IiwibWVzc2FnZSIsImJhZGdlIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOzs7Ozs7QUFDQSxJQUFNQSxVQUFVQyxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7O2VBQzBCQSxRQUFRLE1BQVIsQztJQUFsQkUsSSxZQUFBQSxJO0lBQU1DLE8sWUFBQUEsTzs7QUFDZCxJQUFNQyxNQUFNTCxTQUFaO0FBQ0EsSUFBTU0sT0FBT0MsUUFBUUMsR0FBUixDQUFZQyxJQUFaLElBQW9CLFdBQWpDO0FBQ0EsSUFBTUMsT0FBT0gsUUFBUUMsR0FBUixDQUFZRyxJQUFaLElBQW9CLElBQWpDOztBQUVBLElBQUlDLElBQUlDLE9BQU9ELENBQVAsR0FBVyxFQUFuQjs7QUFFQVAsSUFBSVMsR0FBSixDQUFRLE1BQVIsRUFBZ0JKLElBQWhCOztBQUVBO0FBQ0EsSUFBSUssU0FBU2QsUUFBUSxtQkFBUixDQUFiO0FBQ0FjLE9BQU9DLEdBQVAsR0FBYSxFQUFFVCxRQUFRQyxHQUFSLENBQVlTLFFBQVosS0FBeUIsWUFBM0IsQ0FBYjs7QUFFQSxlQUFlQyxLQUFmLEdBQXVCO0FBQ3JCO0FBQ0EsTUFBTUMsT0FBTyxJQUFJaEIsSUFBSixDQUFTWSxNQUFULENBQWI7O0FBRUE7QUFDQSxNQUFJQSxPQUFPQyxHQUFYLEVBQWdCO0FBQ2QsUUFBTUksVUFBVSxJQUFJaEIsT0FBSixDQUFZZSxJQUFaLENBQWhCO0FBQ0EsVUFBTUMsUUFBUUMsS0FBUixFQUFOO0FBQ0Q7O0FBRUQ7QUFDQWhCLE1BQUlpQixHQUFKLENBQVFILEtBQUtJLE1BQWI7O0FBRUE7QUFDQWxCLE1BQUltQixNQUFKLENBQVdkLElBQVgsRUFBaUJKLElBQWpCO0FBQ0FKLFVBQVF1QixLQUFSLENBQWM7QUFDWkMsNkNBQXVDcEIsSUFBdkMsU0FBK0NJLElBRG5DO0FBRVppQixXQUFPO0FBRkssR0FBZDtBQUlEO0FBQ0RUIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCdcbmltcG9ydCBnbG9iYWxDb25maWcgZnJvbSAnLi4vY29uZmlncy9jb25maWcuanMnXG5jb25zdCBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpXG5jb25zdCBjb25zb2xhID0gcmVxdWlyZSgnY29uc29sYScpXG5jb25zdCB7IE51eHQsIEJ1aWxkZXIgfSA9IHJlcXVpcmUoJ251eHQnKVxuY29uc3QgYXBwID0gZXhwcmVzcygpXG5jb25zdCBob3N0ID0gcHJvY2Vzcy5lbnYuSE9TVCB8fCAnMTI3LjAuMC4xJ1xuY29uc3QgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMFxuXG52YXIgZCA9IGdsb2JhbC5kID0ge31cblxuYXBwLnNldCgncG9ydCcsIHBvcnQpXG5cbi8vIEltcG9ydCBhbmQgU2V0IE51eHQuanMgb3B0aW9uc1xubGV0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL251eHQuY29uZmlnLmpzJylcbmNvbmZpZy5kZXYgPSAhKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpXG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAvLyBJbml0IE51eHQuanNcbiAgY29uc3QgbnV4dCA9IG5ldyBOdXh0KGNvbmZpZylcblxuICAvLyBCdWlsZCBvbmx5IGluIGRldiBtb2RlXG4gIGlmIChjb25maWcuZGV2KSB7XG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKG51eHQpXG4gICAgYXdhaXQgYnVpbGRlci5idWlsZCgpXG4gIH1cblxuICAvLyBHaXZlIG51eHQgbWlkZGxld2FyZSB0byBleHByZXNzXG4gIGFwcC51c2UobnV4dC5yZW5kZXIpXG5cbiAgLy8gTGlzdGVuIHRoZSBzZXJ2ZXJcbiAgYXBwLmxpc3Rlbihwb3J0LCBob3N0KVxuICBjb25zb2xhLnJlYWR5KHtcbiAgICBtZXNzYWdlOiBgU2VydmVyIGxpc3RlbmluZyBvbiBodHRwOi8vJHtob3N0fToke3BvcnR9YCxcbiAgICBiYWRnZTogdHJ1ZVxuICB9KVxufVxuc3RhcnQoKVxuIl19