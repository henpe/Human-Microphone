uid = new Date().getTime(),
audioFile = uid+".wav";


$(document).ready(function() {
    statusNode = $('#status');


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
    //recordAudio()    
    //window.resolveLocalFileSystemURI("documents:///myrecording.wav", onResolveSuccess, fail);
}

/*
    function captureSuccess(mediaFiles) {
        var i, len;
        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
            uploadFile(mediaFiles[i]);
        }       
    }

    // Called if something bad happens.
    // 
    function captureError(error) {
        var msg = 'An error occurred during capture: ' + error.code;
        navigator.notification.alert(msg, null, 'Uh oh!');
    }

    // A button will call this function
    //
    function captureAudio() {
        // Launch device audio recording application, 
        // allowing user to capture up to 2 audio clips
        navigator.device.capture.captureAudio(captureSuccess, captureError);
    }

    // Upload files to server
    function uploadFile(mediaFile) {
        var ft = new FileTransfer(),
            path = mediaFile.fullPath,
            name = mediaFile.name;

        alert(path);
        ft.upload(path,
            "http://www.deepcobalt.com/upload.php",
            function(result) {
                console.log('Upload success: ' + result.responseCode);
                console.log(result.bytesSent + ' bytes sent');
            },
            function(error) {
                console.log('Error uploading file ' + path + ': ' + error.code);
            },
            { fileName: name });   
    }
*/

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


/*
function recordAudio(src) {        
        //var src = "documents://myrecording.wav";
        mediaRec = new Media(src, onSuccess, onError);

        // Record audio
		var recordSettings = {
            "FormatID": "kAudioFormatULaw",
            "SampleRate": 8000.0,
            "NumberOfChannels": 1,
            "LinearPCMBitDepth": 16
        }        
        
        //mediaRec.startRecordWithSettings(recordSettings);
        mediaRec.startRecord();

        // Stop recording after 10 sec
        var recTime = 0;
        var recInterval = setInterval(function() {
            recTime = recTime + 1;
            setAudioPosition(recTime + " sec");
            
            if (recTime >= 5) {
                clearInterval(recInterval);
                //mediaRec.stopRecordWithSettings();
                mediaRec.stopRecord();
                
            }
        }, 1000);
} 
*/



    function onSuccess() {
        console.log("recordAudio():Audio Success");
                
        // Convert the audio file to MP3 format
        //var recordingEncoder = window.plugins.recordingEncoder;
        window.plugins.recordingEncoder.encodeRecording(audioFile);
        statusNode.text("Encoding");
        
        // The filename will now be in the documents folder as filename + '.m4a'
        //var file = mediaRec.src.substr('documents://'.length);
        //encodeAudio(mediaRec.src);
        
        setTimeout(function() { 
            uploadFile(mediaRec.src+'.m4a');
        }, 2000);
        //uploadFile(mediaRec.src);
        //mediaRec.play();
        
        //window.resolveLocalFileSystemURI(mediaRec, resok, resfail);
        
        //location.reload(true);
    }

    // onError Callback 
    //
    function onError(error) {
        alert('code: '    + error.code    + '\n' + 
              'message: ' + error.message + '\n');
    }

// Set audio position
function setAudioPosition(position) {
    document.getElementById('audio_position').innerHTML = position;
}








function encodeAudio(src) {
    alert('encode '+src);
		var success = function(newM4APath) {
			//Do something with your new encoded audio (upload it?)
			alert('encode done');
            console.log(newM4APath);            
		}

		var fail = function(statusCode) {
			//Why did it fail?
            alert('fail');
			console.log(statusCode);
		}
    //console.log(window.plugins.AudioEncode);
    window.plugins.AudioEncode.encodeAudio(src, 
        function() {
            alert('success');
        },
        function() {
            alert('fail');
         }
    ); 

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
            "http://ec2-50-17-2-124.compute-1.amazonaws.com/save",
            function(result) {
                console.log(result);
            
                console.log('Upload success: ' + result.responseCode);
                console.log(result.bytesSent + ' bytes sent'); 
                
                //deleteFile(mediaRec.src);
                //deleteFile(mediaRec.src+'.m4a');
                
                //globalFS.root.getFile(audioFile, {create:true, exclusive: false}, gotFileEntry, fail); 
                statusNode.text("Done");
                location.reload(true);
            },
            function(error) {
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
