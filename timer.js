var clock;
var days = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"};
var alarms = new Array();
var checkInterval;
var nearestAlarm;

window.onload = function() {
	initClock();
	initAlarmForm();
	checkInterval = window.setInterval(function() {
		checkAlarms();
		checkSync();
	}, 60 * 1000);
}

function checkAlarms() {
	if(nearestAlarm == null) {
		return;
	}

	var date = new Date();
	if(nearestAlarm['day'] == date.getDay() && nearestAlarm['hours'] == date.getHours() && nearestAlarm['minutes'] == date.getMinutes()) {
		alert("It's time !");
		setNearestAlarm();
	}
}

function checkSync() {
	var date = new Date();
	var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
	var delay = Math.abs(time - clock.getTime());

	if(delay > 2) {
		clock.setTime(time);
		setNearestAlarm();
	}
}

function initAlarmForm() {
	$('#alarm-form')[0].addEventListener('submit', setAlarm, false)
}

//Add an alarm on the list
function setAlarm(event) {
	var day = $('select#day')[0].value;
	var hours = $('select#hours')[0].value;
	var minutes = $('select#minutes')[0].value;

	var alarm = {'day': day, 'hours': hours, 'minutes': minutes};
	alarms.push(alarm);

	console.log('Set alarm on : ' + days[day] + ', ' + checkNumberSize(hours) + 'h' + checkNumberSize(minutes));

	setNearestAlarm();
}

function setNearestAlarm() {
	var today = new Date();
	var currentDay = today.getDay(), currentHours = today.getHours(), currentMinutes = today.getMinutes();
	var minutesArray = {};

	//Calc in how many minutes each alarms will ring
	for(var i = 0; i < alarms.length; i++) {
		var alarm = alarms[i];
		var day = parseInt(alarm['day']), hours = parseInt(alarm['hours']), minutes = parseInt(alarm['minutes']);
		var nDay = 0, nHours = 0, nMinutes = 0;

		//We count whole day before the alarm
		if(currentDay < day) { 			  //Case 1: the alarm is the same week
			nDay = day - currentDay - 1; 
		} else if(currentDay > day) {	 //Case 2: the alarm is the next week
			nDay = 6 - currentDay + day;
		} else if(currentDay == day) {	//Case 3: the same day, but the next week
			if(currentHours > hours || (currentHours == hours && currentMinutes > minutes)) {
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
		} else if(currentHours == hours && currentDay == day && currentMinutes > minutes) {
			nHours = 23;
		}

		//We count whole minutes before the alarm (day and hours no longer matters)
		if(currentMinutes < minutes) { 		  //Case 1: the alarm is the same hour
			nMinutes = minutes - currentMinutes - 1; 
		} else if(currentMinutes > minutes) { //Case 2: the alarm is the next hour
			nMinutes = 59 - currentMinutes + minutes;
		}

		//Let's put this in the array
		minutesArray[i] = nDay * 24 * 60 + nHours * 60 + nMinutes;
	}

	//Search alarm with the lowest minutes score
	var minIndex = -1;
	for(var i = 0; i < alarms.length; i++) {
		if(minIndex < 0 || minutesArray[i] < minutesArray[minIndex]) {
			minIndex = i;
		}
	}

	//Conclude
	console.log('Last alarm added in ' + nDay +' days, ' + nHours + ' hours and ' + nMinutes + ' minutes.');
	displayNextAlarm(minIndex);
	nearestAlarm = alarms[minIndex];
}

function calc(v1, v2, c1) {
	if(v1 < v2) {
		return v2 - v1;
	} else return c1 - v1 + v2;
}

function displayNextAlarm(i) {
	$('#next-alarm')[0].textContent =  'Next alarm : ' + days[alarms[i]['day']] + ', ' + checkNumberSize(alarms[i]['hours']) + 'h' + checkNumberSize(alarms[i]['minutes']);
}

function initClock() {
	console.log('Init timer');

	var date = new Date();
	clock = $('.clock').FlipClock(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(), {});
}

function checkNumberSize(number) {
	if(number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}