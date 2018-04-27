//
//  ELEditorRecordViewController.swift
//  ELEditor
//
//  Created by GKK on 2018/2/7.
//

import UIKit
import AVFoundation

///编辑器录音页回调
public protocol ELEditorRecordDelegate: NSObjectProtocol {
    
    func editorDidRecord(url: URL, duration: TimeInterval) -> Bool
    
}

///编辑器录音页
open class ELEditorRecordViewController: UIViewController {
    
    open weak var delegate: ELEditorRecordDelegate?
    
    fileprivate var durationLabel: UILabel!
    fileprivate var waver: Waver!
    fileprivate var record: ELRecord!
    fileprivate var recordButton: UIButton!
    fileprivate var playButton: UIButton!
    fileprivate var nextButtonItem: UIBarButtonItem!
    
    fileprivate var timer: Timer!
    
    override open func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    func setupUI() {
        view.backgroundColor = ELEdtiorConfiguration.backgroundColor()
        durationLabel = UILabel()
        durationLabel.textColor = ELEdtiorConfiguration.tintColor()
        if #available(iOS 8.2, *) {
            durationLabel.font = .systemFont(ofSize: 36, weight: .light)
        } else {
            durationLabel.font = .systemFont(ofSize: 36)
        }
        durationLabel.text = "00:00"
        view.addSubview(durationLabel)
        durationLabel.snp.makeConstraints { (mk) in
            mk.top.equalTo(self.topLayoutGuide.snp.bottom).offset(96)
            mk.centerX.equalToSuperview()
        }
        
        waver = Waver()
        waver.tintColor = UIColor.black.withAlphaComponent(0.35)
        view.addSubview(waver)
        waver.snp.makeConstraints { (mk) in
            mk.left.right.centerY.equalToSuperview()
            mk.height.equalTo(75)
        }
        recordButton = UIButton(type: .custom)
        recordButton.setImage(UIImage.el_image(named: "recording_start"), for: .normal)
        recordButton.setImage(UIImage.el_image(named: "recording_pause"), for: .selected)
        recordButton.addTarget(self, action: #selector(onRecordTap(_:)), for: .touchUpInside)
        view.addSubview(recordButton)
        recordButton.snp.makeConstraints { (mk) in
            mk.centerX.equalToSuperview()
            mk.width.height.equalTo(80)
            mk.bottom.equalTo(-56)
        }
        
        playButton = UIButton(type: .custom)
        playButton.setImage(UIImage.el_image(named: "audio_play"), for: .normal)
        playButton.setImage(UIImage.el_image(named: "audio_pause"), for: .selected)
        playButton.addTarget(self, action: #selector(onPlayTap(_:)), for: .touchUpInside)
        view.addSubview(playButton)
        playButton.snp.makeConstraints { [weak self] (mk) in
            guard let wself = self else { return }
            mk.centerY.equalTo(wself.recordButton)
            mk.width.height.equalTo(40)
            mk.right.equalTo(wself.recordButton.snp.left).offset(-51)
        }
        playButton.isEnabled = false
        nextButtonItem = UIBarButtonItem(title: "下一步", style: .plain, target: self, action: #selector(onNextTap))
        navigationItem.rightBarButtonItem = nextButtonItem
        nextButtonItem.isEnabled = false
    }
    
    @objc func onRecordTap(_ button: UIButton) {
        button.isSelected = !button.isSelected
        if record == nil {
            startRecord()
        } else {
            resumeOrPauseRecord()
        }
    }
    
    @objc func onNextTap() {
        if let data = stopRecord(),
            let delegate = delegate {
            if delegate.editorDidRecord(url: data.url, duration: data.duration) {
                return
            }
        }
        navigationController?.popViewController(animated: true)
    }
    
    @objc func onPlayTap(_ button: UIButton) {
        button.isSelected = !button.isSelected
        startOrPausePlay()
    }
    
    //处理录音失败
    fileprivate func handleRecordFail() {
        var alertVC: UIAlertController!
        //录音失败
        if AVCaptureDevice.authorizationStatus(for: .audio) != .authorized {
            alertVC = UIAlertController(title: "权限提示", message: "未开启麦克风权限，请前往 设置->飞地 开启", preferredStyle: .alert)
            alertVC.addAction(UIAlertAction(title: "去开启", style: .default, handler: { (action) in
                //系统设置没打开，去打开
                UIApplication.shared.openURL(URL(string: UIApplicationOpenSettingsURLString)!)
            }))
        } else {
            alertVC = UIAlertController(title: "未知错误", message: "开启录音失败", preferredStyle: .alert)
            alertVC.addAction(UIAlertAction(title: "返回", style: .default, handler: { (action) in
                self.navigationController?.popViewController(animated: true)
            }))
        }
        if let popPresenter = alertVC.popoverPresentationController {
            popPresenter.sourceView = self.recordButton
            popPresenter.sourceRect = self.recordButton.bounds
        }
        self.present(alertVC, animated: true, completion: nil)
    }
}


//MARK: - Recrod
extension ELEditorRecordViewController {
    
    //新建录音
    fileprivate func startRecord() {
        record = ELRecord()
        if !record.startRecord() { //开启录音失败
            recordButton.isSelected = false
            record = nil
            handleRecordFail()
            return
        }
        //播放完毕回调
        record.onPlayFinishCallback = { [weak self] in
            guard let wself = self else { return }
            wself.playButton.isSelected = false
            wself.playButton.isEnabled = true
            wself.recordButton.isEnabled = true
            wself.nextButtonItem.isEnabled = true
        }
        startTime()
        recordButton.isEnabled = true
        playButton.isEnabled = false
        nextButtonItem.isEnabled = false
        
        //波动控制
        waver.waverLevelCallback = { [weak self] (waver) in
            guard let wself = self else { return }
            if let averagePowerForChannel = wself.record.averagePowerForChannel {
                waver?.averagePowerForChannel =  CGFloat(averagePowerForChannel)
            }
        }
        return
    }
    
    //继续或暂停当前录音
    fileprivate func resumeOrPauseRecord() {
        if record.isRecording { //暂停
            record.pauseRecord()
            stopTime()
            recordButton.isEnabled = true
            playButton.isEnabled = true
            nextButtonItem.isEnabled = true
        } else {
            //继续
            record.stopPlay()
            record.resumeRecord()
            startTime()
            recordButton.isEnabled = true
            playButton.isEnabled = false
            nextButtonItem.isEnabled = false
        }
    }
    
    //停止录音
    fileprivate func stopRecord() -> (url: URL, duration: TimeInterval)?
    {
        record.stopPlay()
        guard let data = record.stopRecord() else {
            return nil
        }
        //将音频文件移动到文章资源目录下
        let newFileName = "\(UUID().uuidString).mp3"
        let targetURL = ELEdtiorConfiguration.resourceURL().appendingPathComponent(newFileName)
        ELEdtiorConfiguration.move(at: data.url, to: targetURL)
        return (url: targetURL, duration: data.duration)
    }
    
    //开始或暂停播放
    fileprivate func startOrPausePlay() {
        if record.isPlaying { //暂停
            record.pausePlay()
            playButton.isEnabled = true
            recordButton.isEnabled = true
            nextButtonItem.isEnabled = true
        } else { //开始或继续
            record.startOrResumePlay()
            playButton.isEnabled = true
            recordButton.isEnabled = false
            nextButtonItem.isEnabled = false
        }
    }
    
    //MARK: Time
    func startTime() {
        timer = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(onTime), userInfo: nil, repeats: true)
    }
    
    func stopTime() {
        timer?.invalidate()
    }
    
    @objc func onTime() {
        self.durationLabel.text = ELEdtiorConfiguration.formatSecondsToString(record.duration)
    }
    
}




