window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){arguments.callee=arguments.callee.caller;var a=[].slice.call(arguments);(typeof console.log==="object"?log.apply.call(console.log,console,a):console.log.apply(console,a))}};
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,timeStamp,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();){b[a]=b[a]||c}})((function(){try
{console.log();return window.console;}catch(err){return window.console={};}})());

$(document).ready(function() {
    var clientId = parseInt(Math.random()*1000);
    var isConnected = false;
    var timeOffset = 0;
    var hasJoined = false;
    var hasLocalStorage = ('localStorage' in window && window['localStorage'] !== null) ? true : false;
    
    // Create player
    var player = $('#message audio')[0]; 
    
    // Create button
    $('#join span').bind("click", function(e) {
        hasJoined = true;
        $('#join').fadeOut("slow");
        player.play();
    });

    // Create socket
    var socket = io.connect(document.domain, {
        'reconnect': true,
        'reconnection delay': 500,
        'max reconnection attempts': 5
    });

    // Calculate client time offset to servertime, taking the request
    // roundtrip into consideration.
    var initialTime = new Date().getTime();
    $.get('/time', function(data, textStatus, jqXHR) {
        var requestDelay = new Date().getTime() - initialTime;
        timeOffset = getClientOffset(data, requestDelay);
        $('#offset').html(timeOffset); // Log offset
    }, 'text');

    // Connect client
    socket.on('connect', function () {
        isConnected = true;

        $('#log').text('Connected'); // Log connected

        // Emit clientId
        socket.emit('setClientId', clientId);

        // Create isloaded attribute (is used to check if audio is ready to play later on)
        $(player).attr('data-isloaded', false);
        
        // Bind to canplaythrough event.
        // Set isloaded to true
        $(player).bind('canplaythrough', function(e){
            $(player).attr('data-isloaded', true);
            socket.emit('messageLoaded', clientId);
            
            // Log 
            $("#log").html("loaded");
            $("#src").append("<p>src " + $(player).attr("src") + "</p>");
        });

        // Bind ended event.
        // Change shoulderpadman back to initial state.
        $(player).bind('ended', function(e){
            $("#log").html("play message ended");
            $('#page').removeClass("talking listening");
        });

        // Safari doesn't always trigger ended event so we bind
        // to timeupdate and check if ended is true.
        $(player).bind('timeupdate', function(e){
            if (e.target.ended) {
                $("#log").html("play message ended");
                $('#page').removeClass("talking listening");
            }
        });

        // Bind to error event.
        $(player).bind('error', function(e){
            $("#log").html("play message error");
            $('#page').removeClass("talking listening");
        });

        // Message change event handler.
        // Emitted by server when a new message has been uploaded and encoded.
        socket.on("messageChange", function onMessageChange(json) {
            $('#page').addClass("listening");
            $("#log").html("changed message start");
            var params = $.parseJSON(json);
            var id = params.id,
                timestamp = params.ts,
                src = '/play/' + id,
                cache;

            // Reset isloaded.
            // isloaded is set to true again when the audio is ready to play 
            // (in canplaythrough event handler)
            $(player).attr("data-isloaded", false);

            // TODO: Check if message is in localStorage
            /*
            if (hasLocalStorage){
                cache = localStorage.getItem(id);
            }
            if (cache) src = cache;
            */

            // Load new audio file
            $(player).attr("src", src);
            player.load();

            $("#log").html("changed message finished");
        });

        // Message play handler.
        // Triggered by server a certain time period after the message has 
        // been uploaded and encoded (enough to have allowed most clients to have downloaded the data).
        // TODO: Make clients emit a loaded event when they're ready to play, which the server
        // can use to decide when to emit the messagePlay event.
        socket.on("messagePlay", function onMessagePlay(json) {
            $("#log").html("play message");
            var params = $.parseJSON(json);
            var id = params.id,
                timestamp = params.ts;

            // Calculate the client time when the message should be played.
            // params.tsAt is the time on server when the synchronized message should be played.
            var playAt = (params.tsAt - timeOffset);
            var now = new Date().getTime();

            // Calculate the time from now until when the message should be played.
            var timeOut = playAt - now;

            // Log data for debugging purposes
            $('#playAt').html('Play At: ' + playAt);
            $('#playAtServer').html('Play At Servertime: ' + params.tsAt + '+' + timeOffset);
            $('#time').html('Timeout: ' + timeOut + ' - Offset: ' + timeOffset + ' - date: ' + now);

            if (timeOut < 0) {
                // Dont play, too far behind. (not sure if this is necessary anymore)
            } else {
                // Setup delayed call to play the message at the synchronized time.
                window.setTimeout(function() {
                    $("#log").html("play message timeout");
                    
                    // Only play if the isloaded attribute is set to true.
                    if (player && $(player).attr('data-isloaded')) {
                        // Check the current time before playing. If it is more than
                        // 50 ms ahead or behind then don't play the message to avoid messages
                        // played out of sync.
                        var currentTime = new Date().getTime();
                        if (currentTime < playAt + 50 && currentTime > playAt - 50) {
                            player.play();
                            $('#page').removeClass("listening").addClass("talking");
                        } else {
                            $('#page').removeClass("listening talking");
                        }
                    }
                }, timeOut);
            }                    
        });                
    });
});

// Calculate the time offset for the client time compared to the server time.
function getClientOffset(serverTime, delay) {
    var offset = serverTime - (new Date().getTime() - delay);
    $('#offset').html(offset);

    return offset;
}