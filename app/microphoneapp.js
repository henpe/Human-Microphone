/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

var port = process.env.PORT || 8080;


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


app.post('/save', function(req, res, next){

 req.form.complete(function(err, fields, files){
    if (err) {
      next(err);
    } else {
      console.log('\nuploaded %s to %s'
        ,  files.image.filename
        , files.image.path);
      res.redirect('back');
    }
  });

  // We can add listeners for several form
  // events such as "progress"
  req.form.on('progress', function(bytesReceived, bytesExpected){
    var percent = (bytesReceived / bytesExpected * 100) | 0;
    process.stdout.write('Uploading: %' + percent + '\r');
  });

  res.render('save.jinjs', {
    title: 'Saving',
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
