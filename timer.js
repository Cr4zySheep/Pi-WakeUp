var clock;
var days = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"};
var alarms = new Array();

window.onload = function() {
	initClock();
	initAlarmForm();
}

function initAlarmForm() {
	$('#alarm-form')[0].addEventListener('submit', setAlarm, false)
}

function setAlarm(event) {
	var day = $('select#day')[0].value;
	var hours = $('select#hours')[0].value;
	var minutes = $('select#minutes')[0].value;

	var alarm = {'day': day, 'hours': hours, 'minutes': minutes};
	alarms.push(alarm);

	console.log('Set alarm at : ' + days[day] + ', ' + checkNumberSize(hours) + 'h' + checkNumberSize(minutes));
}

function initClock() {
	console.log('Init timer');

	var date = new Date();
	clock = $('.clock').FlipClock(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(), {
		callbacks: {
			interval: function() {
				updateTimer();
			}
		}
	});
}

//Call each seconds, will be use to check if it's time to play music
function updateTimer() {
	if(!clock) {
		return;
	}

	var time = clock.getTime().time;
}

function checkNumberSize(number) {
	if(number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}