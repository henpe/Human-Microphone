uid = new Date().getTime(),
audioFile = uid+".wav";
serverEndpoint = "http://ec2-50-17-2-124.compute-1.amazonaws.com"; // No trailing slash


$(document).ready(function() {
    statusNode = $('#status');

    var audioHistory = JSON.parse(localStorage.getItem('history')) || {};
    
    var historyHtml = '';
    /*audioHistory = {
            'asdasdas': 12345345,
            'adwdawdwa': 213155
    }*/
    $.each(audioHistory, function(audioId, datestamp) {
        historyHtml += '<li><a href="#'+audioId+'">['+audioId+'] '+datestamp+'</a></li>';
    });
    $('#history').html(historyHtml);


    $('#history a').click(function() {
        var audioId = $(this).attr('href').replace('#','');
        alert(audioId);
    });

    $('#record').bind('touchstart', function() {
        
        var node = $(this);

        var id = new Date().getTime(),
            fileName = fileRoot+'temp.wav';
    
        node.addClass('recording');
        
        //setTimeout(function() {
            mediaRec.startRecord();
            
            var recTime = 0;
            recInterval = setInterval(function() {
                recTime = recTime + 1;
                //setAudioPosition(recTime + " sec");
                statusNode.text(recTime + " sec");
            }, 1000);
        
        //}, 0);        
        
    });
    
    $('#record').bind('touchend', function() {
        $(this).removeClass('recording');
        
        clearInterval(recInterval);
        mediaRec.stopRecord();
    });
    
    
});


function onDeviceReady() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail); 
}


function gotFS(fileSystem) { 
     

        globalFS = fileSystem;
        //window.resolveLocalFileSystemURI("file:///example.txt", onSuccess, onError);
        //fileSystem.root.getFile("temp.wav", null, gotFileEntry, fail); 
        // use the following if you want to create the file if it doesn't exist 
        fileSystem.root.getFile(audioFile, {create:true, exclusive: false}, gotFileEntry, fail); 
        
        
}
function gotFileEntry(fileEntry) {
    //alert(fileEntry.toURI());
    
    fileReference = fileEntry;    
    fileEntry.createWriter(gotFileWriter, fail); 
}
function gotFileWriter(writer) { 
        writer.onwriteend = function(evt) {             
            
            fileRoot = fileReference.fullPath.replace(audioFile,'');
            
            //alert(fileRoot);
            //recordAudio(fileReference.fullPath);
            $('body').addClass('ready'); 
            statusNode.text('Ready');
            mediaRec = new Media(fileRoot+audioFile, onSuccess, onError);
        }; 
        writer.write(" "); 
        // contents of file now 'some sample text' 
} 
function fail(fileEntry) {
    console.log(fileEntry);
    alert('fail');
}



function onSuccess() {
    console.log("recordAudio():Audio Success");
            
    // Convert the audio file to MP3 format
    //var recordingEncoder = window.plugins.recordingEncoder;
    window.plugins.recordingEncoder.encodeRecording(audioFile);
    statusNode.text("Encoding");
    
    // The filename will now be in the documents folder as filename + '.m4a'
    
    
    // Arbitrarily start the upload process after 2 seconds
    // because the only audio encoder which worked didn't have a callback (!!?!?!?)
    setTimeout(function() { 
        uploadFile(mediaRec.src+'.m4a');
    }, 2000);
}

function onError(error) {
    alert('code: '    + error.code    + '\n' + 
          'message: ' + error.message + '\n');
}





function uploadFile(path) {
        var ft = new FileTransfer();
            //path = mediaFile.fullPath,
            //name = mediaFile.name;

        statusNode.text("Uploading");
        var options = new FileUploadOptions();
        options.fileKey  = "filename";
        options.fileName = "audio.m4a";
        options.mimeType = "audio/mp4";
        
        
        var params = new Object();
        params.value1 = "test";
        params.value2 = "param";

        options.params = params;

        ft.upload(path,
            //"http://www.deepcobalt.com/temp/humanmicrophone/upload.php",
            //"http://ec2-50-17-2-124.compute-1.amazonaws.com/save",
            serverEndpoint+'/save',
            function(result) {
                var responseId = result.id,
                    datestamp  = new Date().getTime();
                    
                console.log('Upload success: ' + result.responseCode);
                console.log(result.bytesSent + ' bytes sent'); 
                
                // Save list to localStorage
                var audioHistory = JSON.parse(localStorage.getItem('history')) || {};
                audioHistory[responseId] = datestamp;
                localStorage.setItem('history', JSON.stringify(audioHistory));
                
                //deleteFile(mediaRec.src);
                //deleteFile(mediaRec.src+'.m4a');
                
                //globalFS.root.getFile(audioFile, {create:true, exclusive: false}, gotFileEntry, fail); 
                statusNode.text("Uploaded. Waiting to play");
                
                // Wait 1 second before kicking off play on the server
                setTimeout(function() {
                    statusNode.text("Playing");
                    $.get(serverEndpoint+'/play', function(data) {
                        
                        location.reload(true);                        
                    });
                    
                }, 1000);
            },
            function(error) {
                statusNode.text("Error uploading. Retry.");
                statusNode.unbind('click');
                statusNode.click(function() { uploadFile(path); });
                console.log('Error uploading file ' + path + ': ' + error.code);
            },
            options);   

    }
    
    
function deleteFile(fileURI) {
   console.log("Delete file: " + fileURI);
   window.resolveLocalFileSystemURI(fileURI, resok, resfail);
   function resok(fileEntry) { console.log("Delete file entry: " +fileEntry.name); fileEntry.remove(fdok, fdfail); }
   function resfail(error) { console.log("resolveFileSystemURI failed: " +error.code); }
   function fdok() { console.log("file deleted"); }
   function fdfail(error) { console.log("File delete failed (error " +error.code + ")"); }
}    
