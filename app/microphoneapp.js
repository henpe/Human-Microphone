/**
 * Module dependencies.
 */

var express = require('express'),
	parted = require('parted'),
	base60 = require('./base60'),
	fs = require('fs'),
	events = require('events'),
	ffmpeg = require('./lib/ffmpeg'),
	redis = require('redis-node'),
	path = require('path');

var eventEmitter = new events.EventEmitter();

var app = module.exports = express.createServer();

var port = process.env.PORT || 8080;

var playheadOffset = 4000; // 5000 milliseconds - 5 seconds

var io = require('socket.io').listen(app);

// Redis
var redisClient = redis.createClient(); 


var protestsFileDir = __dirname + '/public/protests';

app.use(parted({
  // custom file path
  path: protestsFileDir,
  // memory usage limit per request
  limit: 30 * 1024,
  // disk usage limit per request
  diskLimit: 100 * 1024 * 1024,
  // allow multiple parts of the same name,
  // then available as an array
  multiple: true
}));


// Configuration
app.configure(function(){
  	app.set('views', __dirname + '/views');
  	app.set('view engine', 'jinjs');
  	app.use(express.bodyParser());
  	app.use(express.methodOverride());
  	app.use(app.router);
  	app.use(express.static(__dirname + '/public'));
  	app.set("view options", { layout: true });
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));
});


/* have to disable websocket because it causes problems with 3G connections */
io.configure(function () {
  io.set('transports', ['xhr-polling']);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


<<<<<<< HEAD
app.get('/', function(req, res) {
  	res.render('index.jinjs', {
    	title: 'Home',
=======
/**
 * Routes
 */

// Home
app.get('/', function(req, res){
    res.render('index.jinjs', {
        title: 'Home',
        layout: false
    });
});

// Event
app.get('/event/:id', function(req, res){
  	res.render('protest.jinjs', {
    	title: 'Protest',
>>>>>>> 02fd522b64873fcf511173f5cb16ddf30355f2d7
    	layout: false
  	});
});

<<<<<<< HEAD
app.get('/event/:eventId', function(req, res) {

	redisClient.get('event:'+req.params.eventId, function (err, talkData) {
		if (err) {
			return res.render('event.jinjs', {
				title: 'Event not found',
				layout: false
			});
		}
		talkData = JSON.parse(talkData);
		console.log(req.params.eventId);
		console.log(talkData);;
		redisClient.get('user:'+talkData.userId, function (err, userData) {
			if (err) {
				return res.render('event.jinjs', {
					title: 'User not found',
					layout: false
				});
			}
			userData = JSON.parse(userData);
			return res.render('event.jinjs', {
				title: talkData.title,
				layout: false,
				talkData: talkData,
				userData: userData
			});	
		});
		
		

	});
	

});

=======
// Time
>>>>>>> 02fd522b64873fcf511173f5cb16ddf30355f2d7
app.get('/time', function(req, res){
  	res.render('time.jinjs', {
    	title: 'Time',
    	layout: false,
    	time: new Date().getTime()
  	});
});

/* this is to be removed */
app.get('/play', function(req, res){
	var ts = new Date().getTime();
	io.sockets.emit('messagePlay', JSON.stringify({
													id: 'randomId', 
													ts: ts,
													tsAt: ts+playheadOffset
	}));
	res.render('play.jinjs', {
    	title: 'Play',
    	layout: false
  	});
});

// Play a specific message
app.get('/play/:id', function(req, res){

	if (!req.params.id) {
		res.render('play.jinjs', {
			title: 'Play - error, no protest found',
			layout: false,
			error: 'Unable to find any protest by that name.'
		});
	}
	
	var filePath = path.join(protestsFileDir, req.params.id);
    var stat = fs.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.on('data', function(data) {
        res.write(data);
    });

    readStream.on('end', function() {
        res.end();
    });

});

// Play OGG message
app.get('/play/ogg/:id', function(req, res){

	if (!req.params.id) {
		res.render('play.jinjs', {
			title: 'Play - error, no protest found',
			layout: false,
			error: 'Unable to find any protest by that name.'
		});
	}
	
	var filePath = path.join(protestsFileDir, 'ogg', req.params.id);
    var stat = fs.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': 'audio/ogg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.on('data', function(data) {
        res.write(data);
    });

    readStream.on('end', function() {
        res.end();
    });

});

// Save message
app.post('/save', function(req, res, next){

	/*
		extract filename - base60 encode it to get a nice ID.
		Also rename the filename on disk.
	*/
	var fn = req.body.filename.split('/');
	var filename = fn[fn.length-1];
	var num = parseInt((new Date().getTime()/1000));
	var newFilename = base60.numtosxg(num);
	fn[fn.length-1] = newFilename;
	var fnNew = fn.join('/');

	fs.rename(req.body.filename, fnNew);
	
	if (io.sockets) {
		/* added output to files as ffmpeg seems to have a problem outputting to the same file */
		var mp3File = fnNew + '.mp3';
		ffmpeg.exec(['-i', fnNew, '-ab', '32k', '-ar', '22050', '-ac', '1', '-acodec', 'libmp3lame', '-y', '-v', 4, mp3File], function(stderr, stdout, exitCode) {
			//if (!stderr) {			
			try {
				fs.unlinkSync(fnNew);
				fs.renameSync(mp3File, fnNew);
				io.sockets.emit('messageChange', JSON.stringify({id: newFilename, ts: new Date().getTime()}));
			} catch (error) {
				return res.render('save.jinjs', {
							title: 'Save Form',
							layout: false,
							error: 'Failed to protest'
				});
			}
					
			console.log('FFMPEG ENCODE', stderr, stdout, exitCode);

			var ts = new Date().getTime();
			io.sockets.emit('messagePlay', JSON.stringify({
															id: newFilename, 
															ts: ts,
															tsAt: ts+playheadOffset
			}));
			
			return res.render('save.jinjs', {
						title: 'Save Form',
						layout: false,
						id: newFilename
			});
		});	
		
	} else {
		res.render('save.jinjs', {
			title: 'Save Form',
			layout: false,
			error: 'Failed to protest'
		});
	}
});
	
app.get('/upload', function(req, res){
  res.render('upload.jinjs', {
    title: 'Upload Form',
    layout: false
  });
});


app.get('/register', function(req, res) {
	return res.render('register_form.jinjs', {
		title: 'Register',
		layout: false
	});
});

app.post('/register', function(req, res) {

	if (!req.body.title) {
		return res.render('register.jinjs', {
			title: 'Failed',
			layout: false,
			error: 'No title'
		});
	}
	
	if (!req.body.email) {
		return res.render('register.jinjs', {
			title: 'Failed',
			layout: false,
			error: 'No email'
		});
	}
	
	if (!req.body.name) {
		return res.render('register.jinjs', {
			title: 'Failed',
			layout: false,
			error: 'No name'
		});
	}
	
	var num = parseInt((new Date().getTime()/1000));
	var eventId = base60.numtosxg(num);
	
	var userId = new String(req.body.email);
    userId = userId.replace(/[^a-zA-Z0-9]/g, '');
	
	// check the talk ID doesn't exist first..
	
	
	
	// register the talk
	var talkDetails = {
		eventId: eventId,
		userId: userId,
		title: req.body.title
	};
	console.log(JSON.stringify(talkDetails));
	redisClient.set('event:'+eventId, JSON.stringify(talkDetails), function (err, exists) {
		if (err) {
			console.log('Unable to save talk');
			return;
		}
		
		return res.render('register.jinjs', {
			title: 'Registered',
			layout: false,
			eventId: eventId,
			userId: userId
		});
	});
	
	// register the user
	var userDetails = {
		email: req.body.email,
		name: req.body.name,
		userId: userId
	};
	redisClient.set('user:'+userId, JSON.stringify(userDetails), function (err, exists) {
		if (err) {
			console.log('Unable to save user details - ' + exists);
			return;
		}
	});
});



app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


/******* socket.io bits */
io.sockets.on('connection', function (socket) {

	/*
		The client has connected.
	*/
	socket.on('setClientId', function (id) {
	    socket.set('clientId', id, function () {
	    	// tell the UI that things are nearly ready
      		socket.emit('clientReady');
    	});
  	});

	/*
		The client has loaded the message
	*/
	socket.on('messageLoaded', function (data) {
		console.log('messageLoaded', data);
  	});

	socket.on('disconnect', function () {
  	});
  	
  	socket.on('disconnectClient', function(data) {

  	});
  	
});



// regular network time sync of clients 
/*setInterval(function() {
	io.sockets.emit('networkTime', new Date().getTime());
}, 500);*/


/* catch any requests to exit and send a signal to the clients */
['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGQUIT', 'SIGHUP', 'exit'].forEach(function(signal){
	process.addListener(signal, function(){
		console.log(signal + ' received, disconnecting clients.');
		io.sockets.emit('disconnect');
		process.exit(1);
	});
});
