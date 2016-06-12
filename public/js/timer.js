var clock; //The Flip Clock AKA the displayed clock
var checkInterval; //Store the checking interval
var player;
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

	//Init player
	player = {
		div: $('#player'),
		button: $('#player-button')[0]
	};
	player.div.hide();
	player.button.addEventListener('click', function() {
		stopAlarm();
		Alarm().sendEmpty(socket, 'stop');
	});
}

function stopAlarm() {
	player.div.hide();
	alarmsHandler.displayHTML();
}

function ringAlarm() {
	$('#alarms-planning').html('');
	player.div.show();
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
