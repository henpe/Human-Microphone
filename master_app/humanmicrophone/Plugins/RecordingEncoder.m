//
//  RecordingEncoder.m
//
//  Created by Matt Crider, Dec. 2010.
//  Copyright 2010 Pensive Industries
//  MIT licensed
//

#import "RecordingEncoder.h"

@implementation RecordingEncoder

- (void)encodeRecording:(NSArray*)arguments withDict:(NSDictionary*)options
{
	// Get the recordings name (comes in as timestamp without extension)
	NSString* recordingURLString = [arguments objectAtIndex:0];
	if (recordingURLString == nil) {
		NSLog (@"Audio file not specified.");
		return;
	}
	
	// Get the full path to the audio file
	NSArray *paths = NSSearchPathForDirectoriesInDomains( NSDocumentDirectory, NSUserDomainMask ,YES );
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *path = [documentsDirectory stringByAppendingPathComponent:recordingURLString];
	
	// Add the 'caf' extension to the file (AVFramework can't tell what file it is without the extension)
	NSString *pathWithExt = [path stringByAppendingString:@".caf"];
	
	// Add the extension to the file
	NSFileManager *fileMgr = [NSFileManager defaultManager];
	NSError *error = noErr;
	if ([fileMgr moveItemAtPath:path toPath:pathWithExt error:&error] != YES)
		NSLog(@"Unable to move file: %@", [error localizedDescription]);

	// Create the export session
	NSURL *assetURL = [NSURL fileURLWithPath:pathWithExt];
	AVURLAsset *songAsset = [[AVURLAsset alloc]initWithURL:assetURL options:nil];
    AVAssetExportSession *exportSession = [[AVAssetExportSession alloc]
										   initWithAsset:songAsset
										   presetName:AVAssetExportPresetAppleM4A];
	
	// Append .m4a to the original URL to get the new URL
	NSURL *exportURL = [NSURL fileURLWithPath:path];
	NSURL* destinationURL = [exportURL URLByAppendingPathExtension:@"m4a"];

    exportSession.outputURL = destinationURL;
	exportSession.outputFileType = AVFileTypeAppleM4A;
	
	// Export the mofo
    [exportSession exportAsynchronouslyWithCompletionHandler:^{
		NSLog(@"status: %i for %@", exportSession.status, exportSession.outputURL);
		NSLog(@"ExportSessionError: %@", [exportSession.error localizedDescription]);
		[exportSession release];
    }];
	
	// Delete the original CAF file
	if ([fileMgr removeItemAtPath:pathWithExt error:&error] != YES)
		NSLog(@"Unable to delete file: %@", [error localizedDescription]);
}

@end
