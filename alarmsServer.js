function AlarmsServer(collection) {
  //Private
  var player = new (require('./mp3player'))(__dirname+'/public/musics/TheDarkness-GhostVitaz5.mp3');
  var Alarm = require('./public/js/alarm').Alarm;
  var lastSocket;
  var nextOccuringAlarm;
  var self = this;

  player.on('stop', () => {
    broadcast('stopped');
  });

  function broadcast(msg, data) {
    if(!lastSocket) return;

    lastSocket.emit(msg, data);
    lastSocket.broadcast.emit(msg, data);
  }

  function scheduleNextAlarm(alarm) {
    if(nextOccuringAlarm) nextOccuringAlarm.cancel();
    if(!alarm) return;

    var schedule  = require('node-schedule');
    console.log('Alarm scheduled at ' + alarm.toCron());

    nextOccuringAlarm = schedule.scheduleJob(alarm.toCron(), () => {
      if(!alarm.mute && player.paused) {
        player.shuffle();
        player.play();

        if(lastSocket) {
          broadcast('started');
        }
      }

      if(!alarm.repeat) {
        removeById(alarm._id);
        console.log('Alarm: ' + alarm.display() + ' deleted');
        broadcast('deleted', alarm._id);
      }

      self.actualizeAlarm();
    });
  }

  //If alarm is in db, execute yes with doc as parameter, else execute no
  function isInDB(alarm, yes, no) {
    collection.findOne({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes}, function(err, doc) {
      if(err) {
        console.log(err);
        return;
      } else if(doc) {
        if(typeof(yes) == 'function') yes(doc)
        return;
      }
      if(typeof(no) == 'function') no();
    });
  };

  //Remove alarm using his id from collection
  function removeById(id) {
    collection.remove({"_id": require('mongojs').ObjectId(id)});
  };

  //Public
  this.actualizeAlarm = function() {
    var alarmsHandler = new (require('./public/js/alarmsHandler'))(Alarm);

    collection.find({}, function(err, docs) {
      if(err) {
        console.log(err);
        return;
      }

      docs.forEach(function(current, index, array) {
        var alarm = new Alarm().create(current);
        if(alarm.isAlarm) alarmsHandler.addAlarm(alarm);
      });

      alarmsHandler.orderAlarms();
      if(nextOccuringAlarm) nextOccuringAlarm.cancel();

      var alarm;
      if(alarm = alarmsHandler.getAlarm(0)) scheduleNextAlarm(alarm);
    });
  }

  this.listenSocket = function(io) {
    //Set up a namespace
    io.of('/alarm').on('connection', function(socket) {
      console.log('New client connected on namespace : ' + '/alarm');
      lastSocket = socket;

      //Send all alarms
      collection.find({}, function(err, docs) {
        if(err) {
          console.log(err);
          return;
        }
        //TODO create alarms array before sending
        socket.emit('allAlarms', docs);
      });

      if(!player.paused) socket.emit('started');

      socket.on('add', function(data) {
        //First, check if data are correct
        if(!data) {
          console.log('Error : no data send');
          return;
        }

        var alarm = new Alarm().create(data);
        if(!alarm.isAlarm) {
          console.log('Cannot add alarm : data incorrect');
          return;
        }

        //If not already in db, add it !
        isInDB(alarm,
          function(doc) {
            console.log('Cannot add alarm : already exist');
            socket.emit('addError');
          },
          function() {
            collection.insert(alarm.getRawData(), (err, doc) => {
              if(err) return;

              var alarm = new Alarm().create(doc);
              console.log('Alarm: ' + alarm.display() + ' added');
              broadcast('added', alarm.getRawData());
              self.actualizeAlarm();
            });
          });
      });

      socket.on('delete', function(alarmId) {
        //Are data correct ?
        if(!alarmId) {
          console.log('Error : no data send');
          return;
        }

        removeById(alarmId);
        socket.broadcast.emit('deleted', alarmId);
        console.log('Alarm: ' + alarmId + ' deleted');

        self.actualizeAlarm();
      });

      socket.on('setMute', function(data) {
        //Are data correct ?
        if(!data || !data._id) {
          console.log('Error : no data send');
          return;
        }

        collection.update({'_id': require('mongojs').ObjectId(data._id)}, {$set: {mute: data.value}}, (err, doc) => {
          if(err) return;

          console.log('Alarm : ' + data._id + ' set mute to ' + data.value);
          socket.broadcast.emit('muteSet', data);
          self.actualizeAlarm();
        });
      });

      socket.on('stop', function(data) {
        player.stop();
      });
    });
  }
}

module.exports = AlarmsServer;
