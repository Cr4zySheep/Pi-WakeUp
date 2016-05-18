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
exports.on = function(socket, collection, alarmsUtility) {
  //Send all alarms
  collection.find({}, function(err, docs) {
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

    var alarm = alarmsUtility.createFromObject(data);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    //If not already in db, add it !
    exports.isInDB(alarm, collection,
      function(doc) {
        console.log('Cannot add alarm : already exist');
        socket.emit('addAlarmError', alarm);
      },
      function() {
        collection.insert(alarm);
        console.log('Alarm at ' + alarmsUtility.getStringDay(alarm.day) + ' ' + alarmsUtility.getStringTime(alarm.hours, alarm.minutes) + ' added');
        socket.broadcast.emit('alarmAdded', alarm);
      });
  });

  socket.on('deleteAlarm', function(data) {
    //Are data correct ?
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = alarmsUtility.createFromObject(data);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    exports.remove(alarm, collection);
    socket.broadcast.emit('alarmDeleted', alarm);
    console.log('Alarm at ' + alarmsUtility.getStringDay(alarm.day) + ' ' + alarmsUtility.getStringTime(alarm.hours, alarm.minutes) + ' deleted');
  });

  socket.on('setAlarmMute', function(data) {
    //Are data correct ?
    if(!data) {
      console.log('Error : no data send');
      return;
    }

    var alarm = alarmsUtility.createFromObject(data);
    if(!alarm) {
      console.log('Cannot add alarm : data incorrect');
      return;
    }

    collection.update({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes}, {$set: {'mute': alarm.mute}});
    console.log('Alarm at ' + alarmsUtility.getStringDay(alarm.day) + ' ' + alarmsUtility.getStringTime(alarm.hours, alarm.minutes) + ' set mute to ' + ((alarm.mute) ? true : false));
    socket.broadcast.emit('alarmMuteSet', alarm);
  });

  socket.on('stopAlarm', function(data) {
    socket.broadcast.emit('alarmStopped', {});
  });

  socket.on('startAlarm', function(data) {
    socket.broadcast.emit('alarmStarted', {});
  });
};
