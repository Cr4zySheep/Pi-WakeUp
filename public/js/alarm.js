(function(exports) {
  exports.Alarm = function() {
    this.isAlarm = false; //True when alarm was created

    this.create = function(obj) {
      if(!obj                                  ||
         !(0 <= obj.day     && obj.day < 7)    ||
         !(0 <= obj.hours   && obj.hours < 24) ||
         !(0 <= obj.minutes && obj.minutes < 60)
       ) return;

      this.day     = parseInt(obj.day);
      this.hours   = parseInt(obj.hours);
      this.minutes = parseInt(obj.minutes);
      this.mute    = obj.mute   ? true : false;
      this.repeat  = obj.repeat ? true : false;

      this.isAlarm = true;
      return this;
    };

    this.changeMute = function(value) {
      this.mute = value ? true : false;
    }

    this.isSameAs = function(otherAlarm) {
      if(!otherAlarm.isAlarm               ||
         !this.isAlarm                     ||
          this.day     != otherAlarm.day   ||
          this.hours   != otherAlarm.hours ||
          this.minutes != otherAlarm.minutes) return false;
      else return true;
    }

    this.getRawData = function() {
      return this.isAlarm ? {'day': this.day, 'hours': this.hours, 'minutes': this.minutes, 'repeat': this.repeat, 'mute': this.mute} : null;
    }

    this.sendRawData = function(socket, msg) {
      if(!socket || !this.isAlarm) return;
      socket.emit('alarm/' + msg,
                  this.getRawData());
    }

    this.sendEmpty = function(socket, msg) {
      if(!socket) return;
      socket.emit('alarm/' + msg, {});
    }

    this.getNextOccuringDate = function(date) {
      if(!this.isAlarm) return;

      var resultDate = new Date(date.getTime());
      var dayToAdd = (7 + this.day - date.getDay()) % 7;

    	if(dayToAdd == 0 && (date.getHours() > this.hours || (date.getHours() == this.hours && date.getMinutes() >= this.minutes ) ) ) {
    		dayToAdd += 7;
    	}

        resultDate.setDate(date.getDate() + dayToAdd);
        return resultDate;
    }

    this.calcMinutesGap = function(now) {
      if(!this.isAlarm) return;

    	var currentDay = now.getDay(), currentHours = now.getHours(), currentMinutes = now.getMinutes();
    	var nDay = 0, nHours = 0, nMinutes = 0;

    	//We count whole day before the alarm
    	if(currentDay < this.day) { 			   //Case 1: the alarm is the same week
    		nDay = this.day - currentDay - 1;
    	} else if(currentDay > this.day) {	 //Case 2: the alarm is the next week
    		nDay = 6 - currentDay + this.day;
    	} else if(currentDay == this.day) {	 //Case 3: the same day, but the next week
    		if(currentHours > this.hours || (currentHours == this.hours && currentMinutes >= this.minutes)) {
    			nDay = 6;
    		}
    	}

    	//We count whole hours before the alarm (day no longer matters)
    	if(currentHours < this.hours) { 		  //Case 1: the alarm is the same day
    		nHours = this.hours - currentHours;
    		if(currentMinutes > this.minutes) {
    			nHours--;
    		}
    	} else if(currentHours > this.hours) { //Case 2: the alarm is the another day
    		nHours = 23 - currentHours + this.hours;
    	} else if(currentHours == this.hours && currentDay == this.day && currentMinutes >= this.minutes) { //Case 3: Same day but next week
    		nHours = 23;
    	}

    	//We count whole minutes before the alarm (day and hours no longer matters)
    	if(currentMinutes < this.minutes) { 		  //Case 1: the alarm is the same hour
    		nMinutes = this.minutes - currentMinutes - 1;
    	} else if(currentMinutes >= this.minutes) { //Case 2: the alarm is the next hour
    		nMinutes = 59 - currentMinutes + this.minutes;
    	}

    	//Return the result
    	return nDay * 24 * 60 + nHours * 60 + nMinutes;
    }

    this.getStringMonth = function(month) {
      if(!(0 <= month && month < 12)) return 'wrong parameter';
      return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month];
    }

    this.getStringDay = function(day) {
      day = day ? day : this.day;

      if(!(0 <= day && day < 7)) return 'wrong parameter';
      return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
    }

    function makeNiceNumber(n) {
      if(n < 10) return '0'+n;
      else return n;
    }

    this.getStringTime = function(hours, minutes) {
      hours = hours ? hours : this.hours;
      minutes = minutes ? minutes : this.minutes;

      if(!(0 <= hours   && hours < 24) ||
         !(0 <= minutes && minutes < 60)
        ) return 'wrong parameter';
      return makeNiceNumber(hours) + ':' + makeNiceNumber(minutes);
    }

    this.getHTML = function(now, i) {
      var nextOccuringDate = this.getNextOccuringDate(now), html;
      html = '<li>' + this.getStringDay(nextOccuringDate.getDay()) + ', ' + nextOccuringDate.getDate() + ' ' + this.getStringMonth(nextOccuringDate.getMonth()) + ' at ' + this.getStringTime();

      if(this.repeat) {
        html += ' <img class="img-repeat" title="This alarm will repeat itself till the end of the world" src="img/blackArrowsCircle.png"/>';
      }

      if(this.mute) {
        html += ' <img class="img-mute" alt="unmute" title="Unmute this alarm" src="img/blackBellSlash.png" onclick="alarmsHandler.setMute(' + i + ', false, socket)"/>';
      } else {
        html += ' <img class="img-unmute" alt="mute" title="Mute this alarm" src="img/blackBell.png" onclick="alarmsHandler.setMute(' + i + ', true, socket)"/>';
      }

      html += ' <img class="img-delete" alt="delete" title="Delete this alarm" src="img/redCross.png" onclick="alarmsHandler.removeAlarm(' + i + ', socket)"/></li>';

      return html;
    }

    this.display = function() {
      return this.getStringDay() + ' ' + this.getStringTime();
    }

    this.toCron = function() {
      return '0 ' + this.minutes + ' ' + this.hours + ' *  * ' + this.day;
    }

    return this;
  }
})(typeof exports === 'undefined' ? this.alarm = {} : exports)
