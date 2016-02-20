var timerId = 'timer';
var timer;
var timerInterval;

window.onload = function() {
	initTimer(timerId);
}

function initTimer(id) {
	timer = document.getElementById(id);

	//Check if the element exist
	if(timer == null) {
		console.log('No element : ' + id);
		return;
	}

	//Init timer 
	console.log('Init timer ' + timerId);
	timer.textContent = '00:00:00';
	timerInterval = window.setInterval(updateTimer, 1000);
}

function updateTimer() {
	console.log('Update : ' + timerId);

	//Get the current time
	var time = new Date();
	timer.textContent = checkNumberSize(time.getHours()) + ':' + checkNumberSize(time.getMinutes()) + ':' + checkNumberSize(time.getSeconds());
}

function checkNumberSize(number) {
	if(number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}