//
//  Mp3Recorder.m
//  BloodSugar
//
//  v0.8.5 Created by PeterPan on 14-3-24.
//  Copyright (c) 2014年 shake. All rights reserved.
//

#import "Mp3Covert.h"
#if __has_include(<lame/lame.h>)
#import <lame/lame.h>
#else
#import "lame.h"
#endif

#import <AVFoundation/AVFoundation.h>


@implementation Mp3Covert

#pragma mark - Convert Utils
+ (Boolean)covert:(NSString *)cafFilePath toMp3FilePath:(NSString *)mp3FilePath
{
    @try {
        int read, write;
        
        FILE *pcm = fopen([cafFilePath cStringUsingEncoding:1], "rb");  //source 被转换的音频文件位置
        fseek(pcm, 4*1024, SEEK_CUR);                                   //skip file header
        FILE *mp3 = fopen([mp3FilePath cStringUsingEncoding:1], "wb");  //output 输出生成的Mp3文件位置
        
        const int PCM_SIZE = 8192;
        const int MP3_SIZE = 8192;
        short int pcm_buffer[PCM_SIZE*2];
        unsigned char mp3_buffer[MP3_SIZE];
        
        lame_t lame = lame_init();
        lame_set_in_samplerate(lame, 11025.0);
        lame_set_VBR(lame, vbr_default);
        lame_init_params(lame);
        
        do {
            read = (int)fread(pcm_buffer, 2*sizeof(short int), PCM_SIZE, pcm);
            if (read == 0)
                write = lame_encode_flush(lame, mp3_buffer, MP3_SIZE);
            else
                write = lame_encode_buffer_interleaved(lame, pcm_buffer, read, mp3_buffer, MP3_SIZE);
            
            fwrite(mp3_buffer, write, 1, mp3);
            
        } while (read != 0);
        
        lame_close(lame);
        fclose(mp3);
        fclose(pcm);
    }
    @catch (NSException *exception) {
        return false;
    }
    @finally {
        return true;
    }
}

#pragma mark - Path Utils

+ (NSString *)mp3Path {
    NSString *mp3Path = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject] stringByAppendingPathComponent:@"ELReocrdAudioCache"];
    if (![[NSFileManager defaultManager] fileExistsAtPath:mp3Path]) {
        [[NSFileManager defaultManager] createDirectoryAtPath:mp3Path withIntermediateDirectories:YES attributes:nil error:nil];
    }
    return mp3Path;
}

+ (NSString *)randomMP3FileName {
    NSTimeInterval timeInterval = [[NSDate date] timeIntervalSince1970];
    NSString *fileName = [NSString stringWithFormat:@"record_%.0f.mp3",timeInterval];
    return fileName;
}

@end
