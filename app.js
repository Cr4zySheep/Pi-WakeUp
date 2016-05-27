var config = require('./config.json');
var express = require('express');
var mongojs = require('mongojs');
var Alarm = require('./public/js/alarm').Alarm;
var alarmsServer = require('./alarmsServer');

var db = mongojs(config.db.name, ['alarms']);
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
io.on('connection', function(socket) {
  console.log('A new client is connected !');
  alarmsServer.on(socket, db.alarms, Alarm);
});

//Start server !
server.listen(config.server.port, function() {
  console.log('Pi-WakeUp listening on port : ' + config.server.port);
});
