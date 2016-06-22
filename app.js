var config = require('./config.json');
var express = require('express');
var mongojs = require('mongojs');
var db = mongojs(config.db.name, ['alarms']);
var alarmsServer = new (require('./alarmsServer'))(db.alarms);
var app = express();
var server = require('http').Server(app);

//Server
app.use(express.static('public'))

.set('view engine', 'ejs')

.get('/socket.io/socket.io.js', function(req, res) {
  res.sendFile(__dirname + '/node_modules/socket.io-client/socket.io.js')
})

.get('/', function(req, res) {
  res.render('index', {serverIP: config.server.ip, port: config.server.port});
})

.use(function(req, res) {
  res.status(404).sendFile(__dirname + '/404.html');
});

//Socket.io
//Listen client and communicate with him/her !
var io = require('socket.io')(server);
alarmsServer.listenSocket(io);

//Start server !
server.listen(config.server.port, function() {
  console.log('Pi-WakeUp listening at : ' + config.server.ip + ':' + config.server.port);
  alarmsServer.actualizeAlarm(db.alarms)
});
