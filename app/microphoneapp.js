/**
 * Module dependencies.
 */

var express = require('express'),
	parted = require('parted'),
	base60 = require('./base60'),
	fs = require('fs'),
	events = require('events'),
	ffmpeg = require('./lib/ffmpeg'),
	path = require('path');

var eventEmitter = new events.EventEmitter();

var app = module.exports = express.createServer();

var port = process.env.PORT || 8080;

var playheadOffset = 5000; // 5000 milliseconds - 5 seconds

var io = require('socket.io').listen(app);


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

// Routes

app.get('/', function(req, res){
  	res.render('index.jinjs', {
    	title: 'Home',
    	layout: false
  	});
});

app.get('/time', function(req, res){
  	res.render('time.jinjs', {
    	title: 'Time',
    	layout: false,
    	time: new Date().getTime()
  	});
});


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
		console.log('messageChange', JSON.stringify({messageId: newFilename}));
		
		fn[fn.length-1] = 'ogg';
		fn[fn.length] = newFilename;
		
		console.log('Creating an ogg', fnNew, fn.join('/'));
		ffmpeg.convert('ogg', fnNew, [], fn.join('/'), function(stderr, stdout, exitCode) {
			console.log(stderr, stdout, exitCode);
			io.sockets.emit('messageChange', JSON.stringify({id: newFilename, ts: new Date().getTime()}));
			
			res.render('save.jinjs', {
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
setInterval(function() {
	io.sockets.emit('networkTime', new Date().getTime());
}, 500);


/* catch any requests to exit and send a signal to the clients */
['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGQUIT', 'SIGHUP', 'exit'].forEach(function(signal){
	process.addListener(signal, function(){
		console.log(signal + ' received, disconnecting clients.');
		io.sockets.emit('disconnect');
		process.exit(1);
	});
});
