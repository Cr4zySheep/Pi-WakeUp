var clock; //The Flip Clock AKA the displayed clock
var days = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}; //Array to convert int in string for day (Could also be a function later)
var months = {0: "January", 1: "February", 2: "March", 3: "April", 4: "May", 5: "June", 6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"}; //Array to convert int in string for month (Could also be a function later)
var alarms = new Array(); //Contains all alarms of form {"day", "hours", "minutes", "mute", "repeat"}
var checkInterval; //Store the checking interval
var audio; //Store html audio element (could be a class later)

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
	if(alarms.length < 1) {
		return;
	}

	var date = new Date();
	if(alarms[0]['day'] == date.getDay() && alarms[0]['hours'] == date.getHours() && alarms[0]['minutes'] == date.getMinutes()) {
		if(!alarms[0]['mute']) {
			ringAlarm();
		} else {
			orderAlarms();
		}

		if(!alarms[0]['repeat']) {
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
	$('#day')[0][now.getDay() - 1].selected = 'selected';
	$('#hours')[0][now.getHours()].selected = 'selected';
	$('#minutes')[0][now.getMinutes()].selected = 'selected';
}

//Add an alarm on the list
function addAlarm(event) {
	var day = $('select#day')[0].value;
	var hours = $('select#hours')[0].value;
	var minutes = $('select#minutes')[0].value;
	var repeat = $('#repeat')[0].checked;
	var alarm = {'day': day, 'hours': hours, 'minutes': minutes, 'mute': false, "repeat": repeat};

	//Avoid two identicals alarms
	if(alarms.find(function(element, index, array) {
		return (element['day'] == day && element['hours'] == hours && element['minutes'] == minutes);
	}) == undefined) {
		alarms.push(alarm);
		console.log('Set an alarm on : ' + days[day] + ', ' + checkNumberSize(hours) + 'h' + checkNumberSize(minutes));
		orderAlarms();
	} else {
		console.log('This alarm already exists !');
	}

	return false;
}

//Delete an alarm on the list
function deleteAlarm(index) {
	if(0 <= index && index < alarms.length) {
		alarms.splice(parseInt(index), 1);
		orderAlarms();
	}
}

//Mute this alarm
function muteAlarm(index) {
	if(0 <= index && index < alarms.length) {
		alarms[index]['mute'] = true;
		orderAlarms();
	}
}

//Unmute this alarm
function unmuteAlarm(index) {
	if(0 <= index && index < alarms.length) {
		alarms[index]['mute'] = false;
		orderAlarms();
	}
}

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
	for(var i = 0; i < alarms.length; i++) {
		minutesArray[i] = [calcMinutesGap(now, alarms[i]), i]; //Store minutes count and index in the alarms array
	}

	//Order the array from smallest to biggest minutes count !
	minutesArray.sort(function(a, b) {
		return a[0] - b[0];
	});

	//Order the alarms list
	var alarmsOrdered = new Array();
	for(var i = 0; i < alarms.length; i++) {
		alarmsOrdered.push(alarms[minutesArray[i][1]]);
	}
	alarms = alarmsOrdered;

	//Conclude
	displayAlarms();
}

//Return the next occuring date of the alarm
function getNextOccuringDate(date, alarm) {
    var resultDate = new Date(date.getTime());
    var dayToAdd = (7 + alarm['day'] - date.getDay()) % 7;

	if(dayToAdd == 0 && (date.getHours() > alarm['hours'] || (date.getHours() == alarm['hours'] && date.getMinutes() >= alarm['minutes'] ) ) ) {
		dayToAdd += 7;
	}

    resultDate.setDate(date.getDate() + dayToAdd);

    return resultDate;
}

//Display alarms from the nearest to the farest
function displayAlarms() {
	var text = '<ol id="alarms-planning">' + function(){
		var alarmsList = '', now = new Date();

		for(var i = 0; i < alarms.length; i++) {
			var nextOccuringDate = getNextOccuringDate(now, alarms[i]);

			alarmsList += '<li>' + days[nextOccuringDate.getDay()] + ', ' + nextOccuringDate.getDate() + ' ' + months[nextOccuringDate.getMonth()] + ' at ' + checkNumberSize(alarms[i]['hours']) + ':' + checkNumberSize(alarms[i]['minutes']);

			if(alarms[i]['repeat']) {
				alarmsList += ' <img class="img-repeat" title="This alarm will repeat itself till the end of the world" src="blackArrowsCircle.png""/>';
			}

			if(alarms[i]['mute']) {
				alarmsList += ' <img class="img-mute" alt="unmute" title="Unmute this alarm" src="blackBellSlash.png" onclick="unmuteAlarm(' + i + ')"/>';
			} else {
				alarmsList += ' <img class="img-unmute" alt="mute" title="Mute this alarm" src="blackBell.png" onclick="muteAlarm(' + i + ')"/>';
			}


			alarmsList += ' <img class="img-delete" alt="delete" title="Delete this alarm" src="redCross.png" onclick="deleteAlarm(' + i + ')"/></li>';
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

//Add a zero if needed
function checkNumberSize(number) {
	if(number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}