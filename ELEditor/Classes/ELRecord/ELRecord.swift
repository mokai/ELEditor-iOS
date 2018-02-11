//
//  ELRecord.swift
//  ELRecord
//
//  Created by GKK on 2018/2/4.
//  Copyright © 2018年 Enclave. All rights reserved.
//
import Foundation
import AVFoundation

public class ELRecord: NSObject {
    //录音音频波动
    public var averagePowerForChannel: Float? {
        self.recorder?.updateMeters()
        return self.recorder?.averagePower(forChannel: 0)
    }
    //是否正在录音中
    public var isRecording: Bool {
        return recorder?.isRecording ?? false
    }
    //当前录音时长
    public var duration: TimeInterval {
        return recorder?.currentTime ?? 0
    }
    //是否正在播放中
    public var isPlaying: Bool {
        return player?.isPlaying ?? false
    }
    //音频播放完回调
    public var onPlayFinishCallback: (()->Void)?
    
    fileprivate var recorder: AVAudioRecorder?
    fileprivate var player: AVAudioPlayer?
    
    fileprivate let cafPath = NSTemporaryDirectory().appending("tmp.caf")
    
    //开始录音
    func startRecord() -> Bool {
        //设置session同时进行录音和播放
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(AVAudioSessionCategoryPlayAndRecord, with: [.defaultToSpeaker])
            try session.setActive(true)
        } catch let err {
            print("\(err.localizedDescription)")
            return false
        }
        let recordSetting: [String: Any] = [AVSampleRateKey: NSNumber(value: 11025.0),//采样率
            AVFormatIDKey: NSNumber(value: kAudioFormatLinearPCM),//音频格式
            AVNumberOfChannelsKey: NSNumber(value: 2),//通道数
            AVEncoderAudioQualityKey: NSNumber(value: AVAudioQuality.min.rawValue)//录音质量
        ]
        //录音
        do {
            let url = URL(fileURLWithPath: cafPath)
            recorder = try AVAudioRecorder(url: url, settings: recordSetting)
            recorder?.prepareToRecord()
            recorder?.isMeteringEnabled = true
            recorder?.record()
        } catch let err {
            print("录音失败:\(err.localizedDescription)")
            return false
        }
        return true
    }
    
    //暂停录音
    func pauseRecord() {
        guard let recorder = self.recorder else {
            return
        }
        if recorder.isRecording {
            recorder.pause()
        }
    }
    
    //继续录音
    func resumeRecord() -> Bool {
        guard let recorder = self.recorder else {
            return false
        }
        if !recorder.isRecording {
            return recorder.record()
        }
        return true
    }
    
    //停止录音
    func stopRecord() -> (url: URL, duration: TimeInterval)? {
        guard let recorder = self.recorder else {
            return nil
        }
        let duration = recorder.currentTime
        recorder.stop()
        let mp3Path = NSTemporaryDirectory().appending("record.mp3")
        if Mp3Covert.covert(cafPath, toMp3FilePath: mp3Path) {
            return (url: URL(fileURLWithPath: mp3Path), duration: duration)
        }
        return nil
    }
    
    //取消录音
    func cancel() {
        guard let recorder = self.recorder else {
            return
        }
        recorder.stop()
        recorder.deleteRecording()
    }
    
    //播放
    func startOrResumePlay() {
        do {
            if player == nil {
                player = try AVAudioPlayer(contentsOf: URL(fileURLWithPath: cafPath))
                player?.delegate = self
            }
            player?.play()
        } catch let err {
            print("播放失败:\(err.localizedDescription)")
        }
    }
    
    //暂停播放
    func pausePlay() {
        guard let player = player else { return }
        if player.isPlaying {
            player.pause()
        }
    }
    
    //停止播放
    func stopPlay() {
        player?.stop()
        player = nil
    }
    
}

extension ELRecord: AVAudioPlayerDelegate {
    
    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        onPlayFinishCallback?()
    }
}
