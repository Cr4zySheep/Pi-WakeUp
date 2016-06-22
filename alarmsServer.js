function AlarmsServer(collection) {
  //Private
  var player = new (require('./mp3player'))(__dirname+'/public/musics/TheDarkness-GhostVitaz5.mp3');
  var Alarm = require('./public/js/alarm').Alarm;
  var lastSocket;
  var nextOccuringAlarm;
  var self = this;

  player.on('stop', () => {
    if(!lastSocket) return;
    Alarm().sendEmpty(lastSocket, 'stopped');
    Alarm().sendEmpty(lastSocket.broadcast, 'stopped');
  });

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
          Alarm().sendEmpty(lastSocket, 'started');
          Alarm().sendEmpty(lastSocket.broadcast, 'started');
        }
      }

      if(!alarm.repeat) {
        remove(alarm.getRawData());
        console.log('Alarm: ' + alarm.display() + ' deleted');
        alarm.sendRawData(lastSocket, 'deleted');
        alarm.sendRawData(lastSocket.broadcast, 'deleted');
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

  //Remove alarm from collection
  function remove(alarm) {
    collection.remove({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes});
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

      if(!player.paused) Alarm().sendEmpty(socket, 'started');

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
            alarm.sendRawData(socket, 'addError')
          },
          function() {
            collection.insert(alarm.getRawData());
            console.log('Alarm: ' + alarm.display() + ' added');
            alarm.sendRawData(socket.broadcast, 'added');

            self.actualizeAlarm();
          });
      });

      socket.on('delete', function(data) {
        //Are data correct ?
        if(!data) {
          console.log('Error : no data send');
          return;
        }

        var alarm = Alarm().create(data);
        if(!alarm.isAlarm) {
          console.log('Cannot remove alarm : data incorrect');
          return;
        }

        remove(alarm.getRawData());
        alarm.sendRawData(socket.broadcast, 'deleted');
        console.log('Alarm: ' + alarm.display() + ' deleted');

        self.actualizeAlarm();
      });

      socket.on('setMute', function(data) {
        //Are data correct ?
        if(!data) {
          console.log('Error : no data send');
          return;
        }

        var alarm = new Alarm().create(data);
        if(!alarm.isAlarm) {
          console.log('Cannot change mute : data incorrect');
          return;
        }

        //TODO USE ALARM ID INSTEAD
        var rawData = alarm.getRawData();
        collection.update({day: rawData.day, hours: rawData.hours, minutes: rawData.minutes}, {$set: {'mute': rawData.mute}});
        console.log('Alarm: ' + alarm.display() + ' set mute to ' + ((rawData.mute) ? true : false));
        alarm.sendRawData(socket.broadcast, 'muteSet');

        self.actualizeAlarm();
      });

      socket.on('stop', function(data) {
        player.stop();
        Alarm().sendEmpty(socket.broadcast, 'stopped');
      });
    });
  }
}

module.exports = AlarmsServer;
