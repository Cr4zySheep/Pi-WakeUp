//If alarm is in db, execute yes with doc as parameter, else execute no
exports.isInDB = function(alarm, collection, yes, no) {
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
exports.remove = function(alarm, collection) {
  collection.remove({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes});
};

//To call when connected by socket
exports.on = function(socket, collection, Alarm) {
  //Send all alarms
  collection.find({}, function(err, docs) {
    if(err) {
      console.log(err);
      return;
    }
    //TODO create alarms array before sending
    socket.emit('allAlarms', docs);
  });

  socket.on('alarm/add', function(data) {
    //First, check if data are correct
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = Alarm().create(data);
    if(!alarm.isAlarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    //If not already in db, add it !
    exports.isInDB(alarm, collection,
      function(doc) {
        console.log('Cannot add alarm : already exist');
        alarm.sendRawData(socket, 'addError')
      },
      function() {
        collection.insert(alarm.getRawData());
        console.log('Alarm: ' + alarm.display() + ' added');
        alarm.sendRawData(socket.broadcast, 'added');
      });
  });

  socket.on('alarm/delete', function(data) {
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

    exports.remove(alarm.getRawData(), collection);
    alarm.sendRawData(socket.broadcast, 'deleted');
    console.log('Alarm: ' + alarm.display() + ' deleted');
  });

  socket.on('alarm/setMute', function(data) {
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
  });

  socket.on('alarm/stop', function(data) {
    Alarm().sendEmpty(socket.broadcast, 'stopped');
  });

  socket.on('alarm/start', function(data) {
    Alarm().sendEmpty(socket.broadcast, 'started');
  });
};
