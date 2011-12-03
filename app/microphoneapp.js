/**
 * Module dependencies.
 */

var express = require('express'),
	form = require('connect-form');
	
var app = module.exports = express.createServer(form({ keepExtensions: true }));

var port = process.env.PORT || 8080;

var io = require('socket.io').listen(app);

// Redis
//var redisClient = redis.createClient(); 



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




app.post('/save', function(req, res, next){

 req.form.complete(function(err, fields, files){
    if (err) {
    	console.log('error');
      next(err);
    } else {
      console.log('\nuploaded %s to %s'
        ,  files.image.filename
        , files.image.path);

    }
  });

  // We can add listeners for several form
  // events such as "progress"
  req.form.on('progress', function(bytesReceived, bytesExpected){
    var percent = (bytesReceived / bytesExpected * 100) | 0;
    process.stdout.write('Uploading: %' + percent + '\r');
  });


console.log(req.form);
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


