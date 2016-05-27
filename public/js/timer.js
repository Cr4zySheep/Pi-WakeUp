var clock; //The Flip Clock AKA the displayed clock
var checkInterval; //Store the checking interval
var audio; //Store html audio element (could be a class later)
var socket;
var Alarm = this.alarm.Alarm;
var alarmsHandler = new AlarmsHandler(Alarm, $('#alarms-planning'));

//Init everything on window load
window.onload = function() {
	//Init clock
	console.log('Init timer');
	var date = new Date();
	clock = $('.clock').FlipClock(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(), {});

	//Init checks
	window.setTimeout(function(){
		alarmsHandler.checkAlarms(socket, ringAlarm);
		checkSync();
		checkInterval = window.setInterval(function() {
			alarmsHandler.checkAlarms(socket, ringAlarm);
			checkSync();
		}, 60 * 1000);
	}, (60 - new Date().getSeconds() + 1) * 1000);

	//Init Socket.IO
	socket = io.connect('http://' + serverAddress);
	alarmsHandler.on(socket, ringAlarm, stopAlarm);

	//Init alarm form and set it to now
	var now = new Date();
	$('#day')		 [0][now.getDay()].selected 		= 'selected';
	$('#hours')	 [0][now.getHours()].selected		= 'selected';
	$('#minutes')[0][now.getMinutes()].selected = 'selected';
	alarmsHandler.listenForm($('#alarm-form')[0], socket);

	initAudio();
}

function initAudio() {
  audio = $('audio')[0];
  $('audio').hide();
  audio.addEventListener('pause', function() {
    stopAlarm();
		Alarm().sendEmpty(socket, 'stop');
  });
}

function stopAlarm() {
	$('audio').hide();
	audio.load();
	alarmsHandler.orderAlarms();
	alarmsHandler.displayHTML();
}

function ringAlarm() {
	if(audio == null) {
		return;
	}

	$('#alarms-planning').html('');
	$('audio').show();
	audio.play();
}

//Check if the display time still corresponds to the real time
function checkSync() {
	var date = new Date();
	var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
	var delay = Math.abs(time - clock.getTime());

	if(delay > 2) {
		clock.setTime(time);
		alarmsHandler.orderAlarms();
		alarmsHandler.displayHTML();
	}
}
