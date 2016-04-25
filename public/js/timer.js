var clock; //The Flip Clock AKA the displayed clock
var allAlarms = new Array(); //Contains all alarms of form {"day", "hours", "minutes", "mute", "repeat"}
var checkInterval; //Store the checking interval
var audio; //Store html audio element (could be a class later)
var socket = io.connect('http://192.168.1.52:8080/');
var alarms = this.alarms;

// ECMA-262, Edition 5, 15.4.4.18
// Référence: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var T, k;
    if (this == null) {
      throw new TypeError(' this vaut null ou n est pas défini');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' n est pas une fonction');
    }
    if (arguments.length > 1) {
      T = thisArg;
    }
    k = 0;

    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex appelé sur null ou undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate doit être une fonction');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find was called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

socket.on('allAlarms', function(alarms) {
  alarms.forEach(function(current, index, array) {
    allAlarms.push(current);
  });
  orderAlarms();
});

//Init everything on window load
window.onload = function() {
	initClock();
	initAlarmForm();
	initChecks();
	audio = $('audio')[0];
	$('audio').hide();
	audio.addEventListener('pause', function() {
		$('audio').hide();
		audio.load();
		orderAlarms();
	});
}

//Set all check on the first second of each minute
function initChecks() {
	window.setTimeout(function(){
		checkAlarms();
		checkSync();
		checkInterval = window.setInterval(function() {
			checkAlarms();
			checkSync();
		}, 60 * 1000);
	}, (60 - new Date().getSeconds() + 1) * 1000);
}

//Make ring the alarm
function ringAlarm() {
	if(audio == null) {
		return;
	}

	//Don't work
	$('#alarms-planning').html('');
	$('audio').show();
	audio.play();
}

//Check if this is the time to ring
//If yes, ring, order alarms and wait for the next !
function checkAlarms() {
	if(allAlarms.length < 1) {
		return;
	}

	var date = new Date(), alarm = allAlarms[0];
	if(alarm['day'] == date.getDay() && alarm['hours'] == date.getHours() && alarm['minutes'] == date.getMinutes()) {
		if(!alarm['mute']) {
			ringAlarm();
		} else {
			orderAlarms();
		}

		if(!alarm['repeat']) {
			deleteAlarm(0);
		}

	}
}

//Check if the display time still corresponds to the real time
function checkSync() {
	var date = new Date();
	var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
	var delay = Math.abs(time - clock.getTime());

	if(delay > 2) {
		clock.setTime(time);
		orderAlarms();
	}
}

//Init alarm form event
function initAlarmForm() {
	$('#alarm-form-submit')[0].addEventListener('click', addAlarm, false);

	//Set form at now by default
	var now = new Date();
	$('#day')[0][now.getDay()].selected = 'selected';
	$('#hours')[0][now.getHours()].selected = 'selected';
	$('#minutes')[0][now.getMinutes()].selected = 'selected';
}

//Add an alarm on the list
function addAlarm(event) {
  var alarm = alarms.create($('#day')[0].value, $('#hours')[0].value, $('#minutes')[0].value, false, $('#repeat')[0].checked);

  allAlarms.push(alarm);
  console.log('Set an alarm on : ' + alarms.getStringDay(alarm.day) + ', ' + alarms.getStringTime(alarm.hours, alarm.minutes));
  orderAlarms();

  //Send alarm to server in order to add it to the db
  socket.emit('addAlarm', alarm);

	return false;
}

socket.on('addAlarmError', function(alarm) {
  removeAlarm(getAlarmIndex(alarm));

  console.log('Error : alarm already exist');
});

socket.on('alarmAdded', function(alarm) {
  allAlarms.push(alarm);
  orderAlarms();
});

//Delete an alarm (local list and db)
function deleteAlarm(index) {
	if(0 <= index && index < allAlarms.length) {
    socket.emit('deleteAlarm', allAlarms[index]);
    removeAlarm(index);
	}
}

//Remove alarm from local list
function removeAlarm(index) {
	if(0 <= index && index < allAlarms.length) {
		allAlarms.splice(parseInt(index), 1);
		orderAlarms();
	}
}

socket.on('alarmDeleted', function(alarm) {
  if(!alarm) return;

  removeAlarm(getAlarmIndex(alarm));
});

function getAlarmIndex(alarm) {
  return allAlarms.findIndex(function(element, index, array) {
    return (element['day'] == alarm.day && element['hours'] == alarm.hours && element['minutes'] == alarm.minutes);
  });
}

function setAlarmMute(index, mute) {
  if(0 <= index && index < allAlarms.length) {
    allAlarms[index].mute = (mute) ? true : false;
    displayAlarms();
    socket.emit('setAlarmMute', {'alarm': allAlarms[index], 'mute': mute});
  }
}

socket.on('alarmMuteSet', function(data) {
  if(!data || !data.alarm) return;
  allAlarms[getAlarmIndex(data.alarm)].mute = (data.mute) ? true : false;
  displayAlarms();
});

//Calc the minutes gap between now and the alarm
//@now of form Date()
//@alarm of form {"day", "hours", "minutes", "mute", "repeat"}
function calcMinutesGap(now, alarm) {
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

//Order the alarms list
function orderAlarms() {
	var now = new Date();
	var minutesArray = new Array();

	//Calc in how many minutes each alarms will ring
	for(var i = 0; i < allAlarms.length; i++) {
		minutesArray[i] = [calcMinutesGap(now, allAlarms[i]), i]; //Store minutes count and index in the alarms array
	}

	//Order the array from smallest to biggest minutes count !
	minutesArray.sort(function(a, b) {
		return a[0] - b[0];
	});

	//Order the alarms list
	var alarmsOrdered = new Array();
	for(var i = 0; i < allAlarms.length; i++) {
		alarmsOrdered.push(allAlarms[minutesArray[i][1]]);
	}
	allAlarms = alarmsOrdered;

	//Conclude
	displayAlarms();
}

//Return the next occuring date of the alarm
function getNextOccuringDate(date, alarm) {
    var resultDate = new Date(date.getTime());
    var dayToAdd = (7 + alarm.day - date.getDay()) % 7;

	if(dayToAdd == 0 && (date.getHours() > alarm.hours || (date.getHours() == alarm.hours && date.getMinutes() >= alarm.minutes ) ) ) {
		dayToAdd += 7;
	}

    resultDate.setDate(date.getDate() + dayToAdd);

    return resultDate;
}

//Display alarms from the nearest to the farest
function displayAlarms() {
	var text = '<ol id="alarms-planning">' + function(){
		var alarmsList = '', now = new Date();

		for(var i = 0; i < allAlarms.length; i++) {
			var nextOccuringDate = getNextOccuringDate(now, allAlarms[i]);

			alarmsList += '<li>' + alarms.getStringDay(nextOccuringDate.getDay()) + ', ' + nextOccuringDate.getDate() + ' ' + alarms.getStringMonth(nextOccuringDate.getMonth()) + ' at ' + alarms.getStringTime(allAlarms[i].hours, allAlarms[i].minutes);

			if(allAlarms[i].repeat) {
				alarmsList += ' <img class="img-repeat" title="This alarm will repeat itself till the end of the world" src="img/blackArrowsCircle.png"/>';
			}

			if(allAlarms[i].mute) {
				alarmsList += ' <img class="img-mute" alt="unmute" title="Unmute this alarm" src="img/blackBellSlash.png" onclick="setAlarmMute(' + i + ', false)"/>';
			} else {
				alarmsList += ' <img class="img-unmute" alt="mute" title="Mute this alarm" src="img/blackBell.png" onclick="setAlarmMute(' + i + ', true)"/>';
			}


			alarmsList += ' <img class="img-delete" alt="delete" title="Delete this alarm" src="img/redCross.png" onclick="deleteAlarm(' + i + ')"/></li>';
		}

		return alarmsList;
	}() + '</ol>';

	$('#alarms-planning').html(text);
}

//Init the displayed clock
function initClock() {
	console.log('Init timer');

	var date = new Date();
	clock = $('.clock').FlipClock(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(), {});
}
