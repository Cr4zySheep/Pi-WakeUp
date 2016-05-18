function AlarmsHandler(alarmUtility) {
  var alarms = new Array(); //ALarms list
  this.alarmUtility = alarmUtility; //Alarm utility

  this.addAlarm = function(alarm) {
    alarm = alarmUtility.createFromObject(alarm);
    if(!alarm) {
      console.log('Bad alarm info');
      return;
    }

    //Avoid two identicals alarms
  	if(alarms.find(function(current, index, array) {
  		return (current['day']     == alarm.day   &&
              current['hours']   == alarm.hours &&
              current['minutes'] == alarm.minutes);
  	}) == undefined) {
  		alarms.push(alarm);
  		console.log('Add an alarm at ' + alarmUtility.getStringDay(alarm.day) + ' on ' + alarmUtility.getStringTime(alarm.hours, alarm.minutes));
  	} else {
  		console.log('Sorry, but this alarm already exists !');
  	}
  };

  this.removeAlarm = function(index) {
    if(this.checkIndex(index)) {
      alarms.splice(parseInt(index), 1);
      console.log('Alarm deleted with success !');
    }
  };

  this.orderAlarms = function() {
    var now = new Date(),
        minutesArray = new Array();

    //Calc in how many minutes each alarms will ring
  	for(var i = 0; i < alarms.length; i++) {
      minutesArray.push({'gap': alarmUtility.calcMinutesGap(now, alarms[i]), 'originalIndex': i});
    }

    minutesArray.sort(function(a, b) {
      return a.gap - b.gap;
    });

    var orderedAlarms = new Array();
    for(var i = 0; i < minutesArray.length; ++i) {
      orderedAlarms.push(alarms[minutesArray[i].originalIndex]);
    }

    alarms = orderedAlarms;
  };

  this.checkIndex = function(index) {
    return (0 <= index && index < alarms.length);
  };

  this.getIndexFromAlarm = function(alarm) {
    return alarms.findIndex(function(current, index, array) {
      return (current['day']     == alarm.day   &&
              current['hours']   == alarm.hours &&
              current['minutes'] == alarm.minutes);
    });
  };

  this.setMute = function(index, value) {
    if(!this.checkIndex(index)) return;
    alarms[index].mute = value;
  };

  this.getAlarm = function(index) {
    return alarms[index];
  };

  this.getLength = function() {
    return alarms.length;
  };

  this.getDisplayingText = function() {
    return '<ol id="alarms-planning">' + function(){
  		var alarmsList = '', now = new Date();

  		for(var i = 0; i < alarms.length; ++i) {
        var alarm = alarms[i],
            nextOccuringDate = alarmUtility.getNextOccuringDate(now, alarm);

  			alarmsList += '<li>' + alarmUtility.getStringDay(nextOccuringDate.getDay()) + ', ' + nextOccuringDate.getDate() + ' ' + alarmUtility.getStringMonth(nextOccuringDate.getMonth()) + ' at ' + alarmUtility.getStringTime(alarm.hours, alarm.minutes);

  			if(alarm.repeat) {
  				alarmsList += ' <img class="img-repeat" title="This alarm will repeat itself till the end of the world" src="img/blackArrowsCircle.png"/>';
  			}

  			if(alarm.mute) {
  				alarmsList += ' <img class="img-mute" alt="unmute" title="Unmute this alarm" src="img/blackBellSlash.png" onclick="setAlarmMute(' + i + ', false)"/>';
  			} else {
  				alarmsList += ' <img class="img-unmute" alt="mute" title="Mute this alarm" src="img/blackBell.png" onclick="setAlarmMute(' + i + ', true)"/>';
  			}


  			alarmsList += ' <img class="img-delete" alt="delete" title="Delete this alarm" src="img/redCross.png" onclick="deleteAlarm(' + i + ')"/></li>';
  		}

  		return alarmsList;
  	}() + '</ol>';
  };

  this.timeToRing = function(callback) {
    var alarm = alarms[0];
    if(!alarm) return;

    var now = new Date(),
        nowAlarm = alarmUtility.create(now.getDay(), now.getHours(), now.getMinutes());

    if(alarm.day == nowAlarm.day && alarm.hours == nowAlarm.hours && alarm.minutes == nowAlarm.minutes) {
      callback(alarm);
    }
  };

};
