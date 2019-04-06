'use strict';

var _index = require('../index.js');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ws = new _index2.default({
  reconnectTime: 5,
  name: 'test-ws',
  reconnectMaxCount: 20
}, 'ws://127.0.0.1:8181');
global.ws = ws;

ws.wson('open', async function (event) {
  //ws.send('bad data') // test bad data
  await ws.init({
    id: 'init',
    "client-name": ws.name,
    "client-type": 'test client'
  });
  ws.subscribe([{ id: 'echo0', command: 'subscribe', configs: { from: 'echo0' } }, { id: 'echo1', command: 'subscribe', configs: { from: 'echo1' } }]);
});

ws.wson('message', function (data) {
  console.log('client ' + ws.name + ' receive: ', JSON.parse(data.data));
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3V0aWxzL3JlY29ubmVjdC13cy90ZXN0L2NsaWVudC5qcyJdLCJuYW1lcyI6WyJ3cyIsIlJld3MiLCJyZWNvbm5lY3RUaW1lIiwibmFtZSIsInJlY29ubmVjdE1heENvdW50IiwiZ2xvYmFsIiwid3NvbiIsImV2ZW50IiwiaW5pdCIsImlkIiwic3Vic2NyaWJlIiwiY29tbWFuZCIsImNvbmZpZ3MiLCJmcm9tIiwiY29uc29sZSIsImxvZyIsIkpTT04iLCJwYXJzZSIsImRhdGEiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztBQUVBLElBQUlBLEtBQUssSUFBSUMsZUFBSixDQUFTO0FBQ2hCQyxpQkFBZSxDQURDO0FBRWhCQyxRQUFLLFNBRlc7QUFHaEJDLHFCQUFtQjtBQUhILENBQVQsRUFJSixxQkFKSSxDQUFUO0FBS0FDLE9BQU9MLEVBQVAsR0FBWUEsRUFBWjs7QUFFQUEsR0FBR00sSUFBSCxDQUFRLE1BQVIsRUFBZ0IsZ0JBQU1DLEtBQU4sRUFBZTtBQUM3QjtBQUNBLFFBQU1QLEdBQUdRLElBQUgsQ0FBUTtBQUNaQyxRQUFJLE1BRFE7QUFFWixtQkFBZVQsR0FBR0csSUFGTjtBQUdaLG1CQUFlO0FBSEgsR0FBUixDQUFOO0FBS0FILEtBQUdVLFNBQUgsQ0FBYSxDQUNYLEVBQUNELElBQUksT0FBTCxFQUFjRSxTQUFTLFdBQXZCLEVBQW9DQyxTQUFTLEVBQUNDLE1BQU0sT0FBUCxFQUE3QyxFQURXLEVBRVgsRUFBQ0osSUFBSSxPQUFMLEVBQWNFLFNBQVMsV0FBdkIsRUFBb0NDLFNBQVMsRUFBQ0MsTUFBTSxPQUFQLEVBQTdDLEVBRlcsQ0FBYjtBQUlELENBWEQ7O0FBYUFiLEdBQUdNLElBQUgsQ0FBUSxTQUFSLEVBQW1CLGdCQUFRO0FBQ3pCUSxVQUFRQyxHQUFSLGFBQXNCZixHQUFHRyxJQUF6QixpQkFBMkNhLEtBQUtDLEtBQUwsQ0FBV0MsS0FBS0EsSUFBaEIsQ0FBM0M7QUFDRCxDQUZEIiwiZmlsZSI6ImNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZXdzIGZyb20gJy4uL2luZGV4LmpzJ1xuXG5sZXQgd3MgPSBuZXcgUmV3cyh7XG4gIHJlY29ubmVjdFRpbWU6IDUsXG4gIG5hbWU6J3Rlc3Qtd3MnLFxuICByZWNvbm5lY3RNYXhDb3VudDogMjAsXG4gIH0sICd3czovLzEyNy4wLjAuMTo4MTgxJylcbmdsb2JhbC53cyA9IHdzXG5cbndzLndzb24oJ29wZW4nLCBhc3luYyBldmVudCA9PiB7XG4gIC8vd3Muc2VuZCgnYmFkIGRhdGEnKSAvLyB0ZXN0IGJhZCBkYXRhXG4gIGF3YWl0IHdzLmluaXQoe1xuICAgIGlkOiAnaW5pdCcsXG4gICAgXCJjbGllbnQtbmFtZVwiOiB3cy5uYW1lLFxuICAgIFwiY2xpZW50LXR5cGVcIjogJ3Rlc3QgY2xpZW50JyxcbiAgfSlcbiAgd3Muc3Vic2NyaWJlKFtcbiAgICB7aWQ6ICdlY2hvMCcsIGNvbW1hbmQ6ICdzdWJzY3JpYmUnLCBjb25maWdzOiB7ZnJvbTogJ2VjaG8wJ319LFxuICAgIHtpZDogJ2VjaG8xJywgY29tbWFuZDogJ3N1YnNjcmliZScsIGNvbmZpZ3M6IHtmcm9tOiAnZWNobzEnfX0sXG4gIF0pXG59KVxuXG53cy53c29uKCdtZXNzYWdlJywgZGF0YSA9PiB7XG4gIGNvbnNvbGUubG9nKGBjbGllbnQgJHt3cy5uYW1lfSByZWNlaXZlOiBgLCBKU09OLnBhcnNlKGRhdGEuZGF0YSkpXG59KVxuIl19