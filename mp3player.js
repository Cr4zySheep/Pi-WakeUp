var Speaker = require('speaker');
var fs = require('fs');
var lame = require('lame');
var inherits = require('util').inherits;
var EventEmitter = require('events');

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
};

//songs is an array with songs file or a string '[songFile],[songFile]'
//Could only read mp3 song
//TODO add different format supported
function mp3player(songs) {
	var _songs = new Array(),		//All songs in an array
			_current = 0, //Index of current song
			self = this,
			repeat = false,
			shuffle = false;

	this.paused = true;

	this.add = function(src) {
		if(src.match(/^[^\.]+\.mp3$/i)) {
			_songs.push(src);

			self.emit('add', src);
		}
	}

	this.play = function(i) {
		if(!i) i = _current ;
		if(!(0 <= i && i < _songs.length) || _songs.length == 0) return;

		self.stop();
    self.paused = false;
		var readStream = fs.createReadStream(_songs[_current = i]);
		readStream.on('open', () => {
			var lameDecoder = new lame.Decoder();

			readStream.pipe(lameDecoder);
			lameDecoder.on('format', function(f) {
				var speaker = new Speaker(f);
				self.speaker = {
					'speaker': speaker,
					'lameFormat': f,
					'readStream': this
				};
				self.speaker.readStream.pipe(speaker);

				self.emit('playing');
			});
		});

		readStream.on('end', () => self.next());

		readStream.on('error', (err) => {
			console.log(err);
		});
	};

	this.pause = function() {
		if(!self.speaker) return;

		if(self.paused) {
			self.speaker.speaker = new Speaker(self.speaker.f);
			self.speaker.readStream.pipe(self.speaker.speaker);
		} else {
			self.speaker.speaker.end();
		}

		self.paused = !self.paused;
	};

	this.stop = function() {
		if(!self.speaker) return;

    self.paused = true;
		self.speaker.speaker.end();
		self.speaker.readStream.unpipe();

		self.emit('stop');
	};

	this.previous = function() {
		if(!self.speaker) return;

		if(self.paused) return;
		else if(repeat) self.play();
		else if(shuffle) self.play(getRandomInt(0, _songs.length));
		else self.play(_current - 1 < 0 ? _songs.length - 1 : _current - 1);
	};

	this.next = function() {
		if(!self.speaker) return;

		if(self.paused) return;
		else if(repeat) self.play();
		else if(shuffle) self.play(getRandomInt(0, _songs.length));
		else self.play(_current + 1 >= _songs.length ? 0 : _current + 1);
	};

	this.shuffle = function() {
		shuffle = !shuffle;
		_current = getRandomInt(0, _songs.length);
	};

	this.repeat = function() {
		repeat = !repeat;
	};

	//Constructor
	(function(songs) {
		if(typeof songs === 'string') songs = songs.split(',');
		for(var i in songs) self.add(songs[i]);
	})(songs);
} inherits(mp3player, EventEmitter);

module.exports = mp3player;
