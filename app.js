var config = require('./config.json');
var express = require('express');
var mongojs = require('mongojs');
var alarms = require('./public/js/alarms');

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

  //Send all alarms
  db.alarms.find({}, function(err, docs) {
    if(err) {
      console.log(err);
      return;
    }

    socket.emit('allAlarms', docs);
  });

  socket.on('addAlarm', function(data) {
    //First, check if data are correct
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = alarms.create(data.day, data.hours, data.minutes, data.mute, data.repeat);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    //If not already in db, add it !
    alarms.isInDB(alarm, db.alarms,
      function(doc) {
        console.log('Cannot add alarm : already exist');
        socket.emit('addAlarmError', alarm);
      },
      function() {
        db.alarms.insert(alarm);
        console.log('Alarm at ' + alarms.getStringDay(alarm.day) + ' ' + alarms.getStringTime(alarm.hours, alarm.minutes) + ' added');
        socket.broadcast.emit('alarmAdded', alarm);
      });
  });

  socket.on('deleteAlarm', function(data) {
    //Are data correct ?
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = alarms.create(data.day, data.hours, data.minutes, data.mute, data.repeat);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    alarms.remove(alarm, db.alarms);
    socket.broadcast.emit('alarmDeleted', alarm);
    console.log('Alarm at ' + alarms.getStringDay(alarm.day) + ' ' + alarms.getStringTime(alarm.hours, alarm.minutes) + ' deleted');
  });

  socket.on('setAlarmMute', function(data) {
    //Are data correct ?
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = alarms.create(data.day, data.hours, data.minutes, data.mute, data.repeat);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    db.alarms.update({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes}, {$set: {'mute': alarm.mute}});
    console.log('Alarm at ' + alarms.getStringDay(alarm.day) + ' ' + alarms.getStringTime(alarm.hours, alarm.minutes) + ' set mute to ' + ((alarm.mute) ? true : false));
    socket.broadcast.emit('alarmMuteSet', alarm);
  });

});

//Start server !
server.listen(config.server.port, function() {
  console.log('Pi-WakeUp listening on port : ' + config.server.port);
});
