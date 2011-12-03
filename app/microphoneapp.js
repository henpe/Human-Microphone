/**
 * Module dependencies.
 */

var express = require('express'),
	parted = require('parted'),
	base60 = require('./base60'),
	fs = require('fs');
	
var app = module.exports = express.createServer();

var port = process.env.PORT || 8080;

var io = require('socket.io').listen(app);

// Redis
//var redisClient = redis.createClient(); 

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


app.get('/play', function(req, res){
	io.sockets.emit('messagePlay', JSON.stringify({id: 'randomId'}));
	res.render('play.jinjs', {
    	title: 'Play',
    	layout: false
  	});
});


app.get('/play/:id', function(req, res){

	if (!req.params.id) {
		return;
	}
	
	var path = protestsFileDir + "/" + req.params.id;

	res.redirect('/protests/' + req.params.id, 301);
/*
	res.header('Content-Type: audio/mpeg');
	res.sendfile(path, function(err){
  		if (err) {
    		next(err);
  		} else {
    		console.log('transferred %s', path);
  		}
	});
*/
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
		io.sockets.emit('messageChange', JSON.stringify({id: newFilename}));
	}
	/*if (req.body && req.body.filename) {
		console.log(req.body.filename);
		
		if (io.sockets) {
			console.log('messageChange', JSON.stringify({messageId: ''}));
			io.sockets.emit('messageChange', JSON.stringify({messageId: ''}));
		}
	}*/
	
  res.render('save.jinjs', {
    title: 'Save Form',
    layout: false
  });
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
var globalSocket;
io.sockets.on('connection', function (socket) {

	/*
		The client has connected.
	*/
	socket.on('setClientId', function (id) {
	    socket.set('clientId', id, function () {
	    	// tell the UI that things are nearly ready
      		socket.emit('clientReady');
      		globalSocket = socket;
    	});
  	});

	/*
		The client has loaded the message
	*/
	socket.on('messageLoaded', function (data) {
		
  	});

	socket.on('disconnect', function () {
		//disconnectClient(socket);
		globalSocket = undefined;
  	});
  	
  	socket.on('disconnectClient', function(data) {
		globalSocket = undefined;
  	});
  	
});



// regular check of clients 
setInterval(function() {
	/*globalSocket.get('talkId', function (err, id) {
		socket.emit('rating', JSON.stringify({ s: rating, c: clients }) );
	});*/
}, 300);


