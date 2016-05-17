var clock; //The Flip Clock AKA the displayed clock
var checkInterval; //Store the checking interval
var audio; //Store html audio element (could be a class later)
var socket;
var alarmsHandler = new AlarmsHandler(this.alarms);

//Init everything on window load
window.onload = function() {
	initClock();
	initAlarmForm();
	initChecks();
  initSocketIO();
	initAudio();
}

function initAudio() {
  audio = $('audio')[0];
  $('audio').hide();
  audio.addEventListener('pause', function() {
    stopAlarm();
		socket.emit('stopAlarm', {});
  });
}

function stopAlarm() {
	console.log('Current ringing alarm stopped');
	$('audio').hide();
	audio.load();
	alarmsHandler.orderAlarms();
	displayAlarms();
}

function initSocketIO() {
  socket = io.connect('http://' + serverAddress);

  socket.on('allAlarms', function(alarms) {
    alarms.forEach(function(current, index, array) {
      alarmsHandler.addAlarm(current);
    });
    alarmsHandler.orderAlarms();
    displayAlarms();
  });

  socket.on('addAlarmError', function(alarm) {
    alarmsHandler.removeAlarm(alarmsHandler.getIndexFromAlarm(alarm));
    console.log('Error : alarm already exist');
  });

  socket.on('alarmAdded', function(alarm) {
    alarmsHandler.addAlarm(alarm);
    alarmsHandler.orderAlarms();
    displayAlarms();
	});

  socket.on('alarmMuteSet', function(data) {
    if(!data || !data.alarm) return;
    alarmsHandler.setMute(alarmsHandler.getIndexFromAlarm(data.alarm), (data.alarm.mute) ? true : false);
    displayAlarms();
  });

  socket.on('alarmDeleted', function(alarm) {
    alarmsHandler.removeAlarm(alarmsHandler.getIndexFromAlarm(alarm));
    displayAlarms();
  });

	socket.on('alarmStopped', function(data) {
		stopAlarm();
	});

	socket.on('alarmStarted', function(data) {
		ringAlarm();
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
  alarmsHandler.timeToRing(function(alarm) {
    if(!alarm['mute']) {
			socket.emit('startAlarm', {});
      ringAlarm();
    } else {
      alarmsHandler.orderAlarms();
    }

    if(!alarm['repeat']) {
      deleteAlarm(0);
    }
  });
}

//Check if the display time still corresponds to the real time
function checkSync() {
	var date = new Date();
	var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
	var delay = Math.abs(time - clock.getTime());

	if(delay > 2) {
		clock.setTime(time);
		alarmsHandler.orderAlarms();
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
  alarmsHandler.addAlarm(alarm);
  alarmsHandler.orderAlarms();
  displayAlarms();

  //Send alarm to server in order to add it to the db
  socket.emit('addAlarm', alarm);
}

//Delete an alarm (local list and db)
function deleteAlarm(index) {
  if(!alarmsHandler.checkIndex(index)) return;
  socket.emit('deleteAlarm', alarmsHandler.getAlarm(index));
  alarmsHandler.removeAlarm(index);
  displayAlarms();
}

function setAlarmMute(index, mute) {
  if(alarmsHandler.checkIndex(index)) {
    alarmsHandler.setMute(index, (mute) ? true : false);
    displayAlarms();
    socket.emit('setAlarmMute', alarmsHandler.getAlarm(index));
  }
}

//Display alarms from the nearest to the farest
function displayAlarms() {
	$('#alarms-planning').html(alarmsHandler.getDisplayingText());
}

//Init the displayed clock
function initClock() {
	console.log('Init timer');

	var date = new Date();
	clock = $('.clock').FlipClock(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(), {});
}
