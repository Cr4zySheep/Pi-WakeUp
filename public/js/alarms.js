(function (exports) {
  //Return false if wrong parameters, else return an alarm object
  exports.create = function(day, hours, minutes, mute, repeat) {
    if(!(0 <= day     && day < 7)    ||
       !(0 <= hours   && hours < 24) ||
       !(0 <= minutes && minutes < 60)
      ) {
      return false;
    }

    return {'day': parseInt(day), 'hours': parseInt(hours), 'minutes': parseInt(minutes),
            'mute': (mute) ? true : false,
            'repeat': (repeat) ? true : false
        };
  }

  exports.getStringMonth = function(month) {
    if(!(0 <= month && month < 12)) {
      return 'wrong parameter';
    }

    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month];
  }

  exports.getStringDay = function(day) {
    if(!(0 <= day && day < 7)) {
      return 'wrong parameter';
    }
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
  }

  function makeNiceNumber(n) {
    if(n < 10) return '0'+n;
    else return n;
  }

  exports.getStringTime = function(hours, minutes) {
    if(!(0 <= hours   && hours < 24) ||
       !(0 <= minutes && minutes < 60)
      ) {
      return 'wrong parameter';
    }

    return makeNiceNumber(hours) + ':' + makeNiceNumber(minutes);
  }

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

  exports.remove = function(alarm, collection) {
    collection.remove({day: alarm.day, hours: alarm.hours, minutes: alarm.minutes});
  };
})(typeof exports === 'undefined'? this.alarms={}: exports);
