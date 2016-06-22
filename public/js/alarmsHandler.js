function AlarmsHandler(Alarm, dispElement) {
  var alarms = new Array(); //ALarms list
  var Alarm = Alarm;
  var dispElement = dispElement; //HTML element where alarms are displayed

  this.addAlarm = function(alarm, socket) {
    if(!alarm.isAlarm) {
      console.log('Bad alarm info');
      return;
    }

    //Avoid two identicals alarms
  	if(alarms.find(function(current, index, array) {
  		return current.isSameAs(alarm);
  	}) == undefined) {
  		alarms.push(alarm);
  		console.log('Add alarm: ' + alarm.display());
      if(socket) alarm.sendRawData(socket, 'add');
  	} else {
  		console.log('Sorry, but this alarm already exists !');
  	}
  };

  this.removeAlarm = function(index, socket) {
    if(!this.checkIndex(index)) return;
    if(socket) alarms[index].sendRawData(socket, 'delete');
    console.log('Delete alarm: ' + alarms[index].display());
    alarms.splice(parseInt(index), 1);
    this.displayHTML();
  };

  this.orderAlarms = function() {
    var now = new Date(),
        minutesArray = new Array();

    //Calc in how many minutes each alarms will ring
  	for(var i = 0; i < alarms.length; i++) {
      minutesArray.push({'gap': alarms[i].calcMinutesGap(now), 'originalIndex': i});
    }

    minutesArray.sort(function(a, b) {
      return a.gap - b.gap;
    });

    var orderedAlarms = new Array();
    for(var i = 0; i < minutesArray.length; ++i) {
      orderedAlarms.push(alarms[minutesArray[i].originalIndex]);
    }

    alarms = orderedAlarms;
  };

  this.checkIndex = function(index) {
    return (0 <= index && index < alarms.length);
  };

  this.getIndexFromAlarm = function(alarm) {
    return alarms.findIndex(function(current, index, array) {
      return current.isSameAs(alarm);
    });
  };

  this.setMute = function(index, value, socket) {
    if(!this.checkIndex(index)) return;
    var alarm = alarms[index];
    alarm.changeMute(value ? true : false);
    if(socket) alarm.sendRawData(socket, 'setMute');

    this.displayHTML();
  };

  this.getAlarm = function(index) {
    return alarms[index];
  };

  this.getLength = function() {
    return alarms.length;
  };

  this.displayHTML = function() {
    if(!dispElement) return;

    dispElement.html('<ol id="alarms-planning">' + function(){
  		var alarmsList = '', now = new Date();
  		for(var i = 0; i < alarms.length; ++i) alarmsList += alarms[i].getHTML(now, i);
  		return alarmsList;
  	}() + '</ol>');
  };

  this.checkAlarms = function(socket, ring) {
    if(alarms.length == 0) return;

    var now = new Date(),
        alarm = alarms[0],
        nowAlarm = new Alarm().create({'day': now.getDay(), 'hours': now.getHours(), 'minutes': now.getMinutes()});

    if(alarm.isSameAs(nowAlarm, socket) && alarm.mute) {
      this.orderAlarms();
      this.displayHTML();
    }
  };

  this.on = function(socket, ringStart, ringStop) {
    var alarmsHandler = this;

    socket.on('allAlarms', function(allAlarms) {
      allAlarms.forEach(function(current, index, array) {
  			var alarm = new Alarm().create(current);
  			if(alarm.isAlarm) alarmsHandler.addAlarm(alarm);
      });
      alarmsHandler.orderAlarms();
      alarmsHandler.displayHTML();
    });

    socket.on('addError', function(alarmData) {
      alarmsHandler.removeAlarm(alarmsHandler.getIndexFromAlarm(new Alarm().create(alarmData)));
      console.log('Error : alarm already exist');
    });

    socket.on('added', function(alarmData) {
      alarmsHandler.addAlarm(new Alarm().create(alarmData));
      alarmsHandler.orderAlarms();
      alarmsHandler.displayHTML();
  	});

    socket.on('muteSet', function(data) {
  		var alarm = new Alarm().create(data);
  		if(!alarm.isAlarm) return;
  		alarmsHandler.getAlarm(alarmsHandler.getIndexFromAlarm(alarm)).changeMute(alarm.getRawData().mute);
      alarmsHandler.displayHTML();
    });

    socket.on('deleted', function(alarmData) {
      alarmsHandler.removeAlarm(alarmsHandler.getIndexFromAlarm(new Alarm().create(alarmData)));
      alarmsHandler.displayHTML();
    });

    socket.on('stopped', function(data) {
  		ringStop();
  	});

  	socket.on('started', function(data) {
  		ringStart();
  	});
  };

  this.listenForm = function(form, socket) {
    var alarmsHandler = this;
    form.addEventListener('submit', function(event) {
      event.preventDefault();

      var day = event.target['0'].value,
          hours = event.target['1'].value,
          minutes = event.target['2'].value,
          repeat = event.target['3'].checked;

      var alarm = new Alarm().create({'day': day, 'hours': hours, 'minutes': minutes, 'repeat': repeat});

      alarmsHandler.addAlarm(alarm, socket);
      alarmsHandler.orderAlarms();
      alarmsHandler.displayHTML();
    });
  };
};

if(typeof exports !== 'undefined') module.exports = AlarmsHandler;
