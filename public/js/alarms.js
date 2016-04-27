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

  exports.createFromObject = function(alarm) {
    return exports.create(alarm.day, alarm.hours, alarm.minutes, alarm.mute, alarm.repeat);
  }

  //Return the next occuring date of the alarm
  exports.getNextOccuringDate = function(date, alarm) {
    if(!alarm) return;

    var resultDate = new Date(date.getTime());
    var dayToAdd = (7 + alarm.day - date.getDay()) % 7;
    
  	if(dayToAdd == 0 && (date.getHours() > alarm.hours || (date.getHours() == alarm.hours && date.getMinutes() >= alarm.minutes ) ) ) {
  		dayToAdd += 7;
  	}

      resultDate.setDate(date.getDate() + dayToAdd);
      return resultDate;
  }

  //Calc the minutes gap between now and the alarm
  //@now of form Date()
  //@alarm of form {"day", "hours", "minutes", "mute", "repeat"}
  exports.calcMinutesGap = function(now, alarm) {
  	var day = parseInt(alarm['day']), hours = parseInt(alarm['hours']), minutes = parseInt(alarm['minutes']);
  	var currentDay = now.getDay(), currentHours = now.getHours(), currentMinutes = now.getMinutes();
  	var nDay = 0, nHours = 0, nMinutes = 0;

  	//We count whole day before the alarm
  	if(currentDay < day) { 			  //Case 1: the alarm is the same week
  		nDay = day - currentDay - 1;
  	} else if(currentDay > day) {	 //Case 2: the alarm is the next week
  		nDay = 6 - currentDay + day;
  	} else if(currentDay == day) {	//Case 3: the same day, but the next week
  		if(currentHours > hours || (currentHours == hours && currentMinutes >= minutes)) {
  			nDay = 6;
  		}
  	}

  	//We count whole hours before the alarm (day no longer matters)
  	if(currentHours < hours) { 		  //Case 1: the alarm is the same day
  		nHours = hours - currentHours;
  		if(currentMinutes > minutes) {
  			nHours--;
  		}
  	} else if(currentHours > hours) { //Case 2: the alarm is the another day
  		nHours = 23 - currentHours + hours;
  	} else if(currentHours == hours && currentDay == day && currentMinutes >= minutes) { //Case 3: Same day but next week
  		nHours = 23;
  	}

  	//We count whole minutes before the alarm (day and hours no longer matters)
  	if(currentMinutes < minutes) { 		  //Case 1: the alarm is the same hour
  		nMinutes = minutes - currentMinutes - 1;
  	} else if(currentMinutes >= minutes) { //Case 2: the alarm is the next hour
  		nMinutes = 59 - currentMinutes + minutes;
  	}

  	//Return the result
  	return nDay * 24 * 60 + nHours * 60 + nMinutes;
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
