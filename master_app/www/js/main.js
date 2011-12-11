var app = {
            
    serverEndpoint:     "http://184.72.223.90/save", // No trailing slash
    recordingReference: null,
    recInterval:        null,
    
    init: function() {
        this.statusNode = $('#status'),
        this.recordNode = $('#record');

        this.recordNode.bind('touchstart', function() {
            app.startRecording();
            
        });
        this.recordNode.bind('touchend', function() {
            app.stopRecording();    
        });
    
        app.prepareRecording();        
    },
    
    prepareRecording: function() {
        var uid       = new Date().getTime(),
            audioFile = uid+".wav";
            self      = this;
        
        this.audioFile = audioFile; // Save reference globally
        createFile(audioFile, function(fileReference) { 
            self.recordingReference = new Media(fileReference, app.processRecording, app.errorRecording);
            $('body').addClass('ready'); 
        });  
        
        this.statusNode.text('Ready');                                    
    },
    
    startRecording: function() {
        var self = this;
        
        this.recordNode.addClass('recording');
        
        // Unfortunately, record with settings doesn't quite work    
        /*var recordSettings = {
                "FormatID": "kAudioFormatULaw",
                    "SampleRate": 8000.0,
                    "NumberOfChannels": 1,
                    "LinearPCMBitDepth": 16
            }
        this.recordingReference.startRecordWithSettings(recordSettings);
        */
        
        this.recordingReference.startRecord();
        
        var recTime = 0;
        this.recInterval = setInterval(function() {
            recTime = recTime + 1;
            //setAudioPosition(recTime + " sec");
            self.statusNode.text(recTime + " sec");
        }, 1000);        
    },

    stopRecording: function() {
        this.recordNode.removeClass('recording');    
        clearInterval(this.recInterval);
        
        this.recordingReference.stopRecord();
        //this.recordingReference.stopRecordWithSettings();
    },
    
    processRecording: function() {    
        console.log('processing recording '+app.recordingReference.src);
        
        window.plugins.recordingEncoder.encodeRecording(app.audioFile);

        // Arbitrarily start the upload process after 2 seconds
        // because the only audio encoder which worked didn't have a callback (!!?!?!?)
        setTimeout(function() { 
            app.uploadRecording(app.recordingReference.src+'.m4a');
        }, 2000);    
    },
    
    errorRecording: function() {
        alert('There was an error while recording');
    },
    
    uploadRecording: function(path) {
        var self = this;
        var ft = new FileTransfer();

        this.statusNode.text("Uploading");
        var options = new FileUploadOptions();
        options.fileKey  = "filename";
        options.fileName = "audio.m4a";
        options.mimeType = "audio/mp4";
                
        var params = new Object();
        //params.value1 = "test";
        //params.value2 = "param";
        options.params = params;
        
        ft.upload(path,
            self.serverEndpoint,
            function(result) {
                var responseId = result.id,
                    datestamp  = new Date().getTime();
                    
                console.log('Upload success: ' + result.responseCode);
                console.log(result.bytesSent + ' bytes sent'); 
                
                self.statusNode.text("Uploaded");
                setTimeout(function() {
                    app.prepareRecording();
                }, 3000);
            },
            function(error) {
                self.statusNode.text("Error uploading. Retry.");
                self.statusNode.unbind('click');
                self.statusNode.click(function() { app.uploadRecording(path); });
                console.log('Error uploading file ' + path + ': ' + error.code);
            },
            options
        );          
    }
}

    
// File functions - NIGHTMARE!!
// iOS Media Recording requires a file to be already present before recording to it
function createFile(fileName, onSuccess, onError) {
    var fileReference;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
    function gotFS(fileSystem) { fileSystem.root.getFile(fileName, {create:true, exclusive: false}, gotFileEntry, fail); }
    function gotFileEntry(fileEntry) {
        fileReference = fileEntry;    
        fileEntry.createWriter(gotFileWriter, fail); 
    }   
    function gotFileWriter(writer) { 
        writer.onwriteend = function(evt) {  
            var fileRoot = fileReference.fullPath.replace(fileName,'');
            if (onSuccess) onSuccess(fileRoot+fileName);
        }; 
        writer.write(" "); // Write something to the file                 
    } 
    function fail(fileEntry) { 
        console.log("Failed: ", fileEntry); 
        alert('fail'); 
        if (onError) { onError() }; 
    }     
}    
    
function deleteFile(fileURI) {
   console.log("Delete file: " + fileURI);
   window.resolveLocalFileSystemURI(fileURI, resok, resfail);
   function resok(fileEntry) { console.log("Delete file entry: " +fileEntry.name); fileEntry.remove(fdok, fdfail); }
   function resfail(error) { console.log("resolveFileSystemURI failed: " +error.code); }
   function fdok() { console.log("file deleted"); }
   function fdfail(error) { console.log("File delete failed (error " +error.code + ")"); }
}    




// Kick off
function onDeviceReady() {
    app.init(); 
};