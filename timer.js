var clock; //The Flip Clock AKA the displayed clock
var days = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}; //Array to convert int in string for day (Could also be a function later)
var alarms = new Array(); //Contains all alarms of form {"day", "hours", "minutes"}
var checkInterval; //Store the checking interval
var nearestAlarm; //Store the next alarm which will ring (null if nothing)
var audio; //Store html audio element (could be a class later) 

//Init everything on window load
window.onload = function() {
	initClock();
	initAlarmForm();
	initChecks();
	audio = $('audio')[0];
	audio.addEventListener('pause', function() {
		$('audio').addClass('hide');
		audio.load();
		setNearestAlarm();
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

	$('audio').removeClass('hide');
	audio.play();
}

//Check if this is the time to ring
//If yes, search the next alarm !
function checkAlarms() {
	if(nearestAlarm == null) {
		return;
	}

	var date = new Date();
	if(nearestAlarm['day'] == date.getDay() && nearestAlarm['hours'] == date.getHours() && nearestAlarm['minutes'] == date.getMinutes()) {
		ringAlarm();
	}
}

//Check if the display time still corresponds to the real time
function checkSync() {
	var date = new Date();
	var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
	var delay = Math.abs(time - clock.getTime());

	if(delay > 2) {
		clock.setTime(time);
		setNearestAlarm();
	}
}

//Init alarm form event
function initAlarmForm() {
	$('#alarm-form-submit')[0].addEventListener('click', setAlarm, false)
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
	return false;
}

//Set th next alarm to ring
function setNearestAlarm() {
	if(alarms.length < 1) {
		return;
	}

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

//Display next alarm on the page
function displayNextAlarm(i) {
	$('#next-alarm')[0].textContent =  'Next alarm : ' + days[alarms[i]['day']] + ', ' + checkNumberSize(alarms[i]['hours']) + 'h' + checkNumberSize(alarms[i]['minutes']);
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