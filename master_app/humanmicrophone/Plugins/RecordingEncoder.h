//
//  RecordingEncoder.h
//
//  By Matt Crider, December 2010.
//  Copyright 2010 Pensive Industries.
//  MIT licensed
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
#else
    #import "PGPlugin.h"
#endif

@interface RecordingEncoder : PGPlugin {
}

- (void)encodeRecording:(NSArray*)arguments withDict:(NSDictionary*)options;
@end
