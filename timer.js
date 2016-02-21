var clock;

window.onload = function() {
	initClock();
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

	console.log('Update timer');

	var time = clock.getTime().time;
	console.log(time);
}

function checkNumberSize(number) {
	if(number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}