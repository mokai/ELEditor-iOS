//
//  ELEditorDelegates.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit
import JavaScriptCore

/// 编辑器公开方法
@objc public protocol ELEditorPublicProtocol: NSObjectProtocol {
    
    /**
     * 获取封面图
     * @return 如果没有封面图时则返回null
     */
    func getCover() -> URL?
    
    /**
     * 更新封面图
     * @param url 为nil时清除封面图
     */
    func updateCover(_ url: URL?)
    
    // 获取标题
    func getTitle() -> String?
    
    // 设置标题
    func setTitle(_ title: String)

    // 获取内容
    func getContent() -> String?
    
    // 设置内容
    func setContent(_ content: String)
    
    // 标题输入框获取焦点
    func focusTitle()
    
    // 正文输入框获取焦点
    func focusContent()
    
    // 标题是否为空
    func isEmptyTitle() -> Bool
    
    // 正文是否为空
    func isEmptyContent() -> Bool
    
    /// 切换至夜间模式
    func switchToNightMode()
    
    /// 切换至日间模式
    func switchToLightMode()
    
    ///插入图片
    func insertImage(_ url: URL)
    
    ///插入音频
    func insertAudio(_ url: URL, duration: TimeInterval)
}

/// 编辑器回调
@objc public protocol ELEditorViewControllerDelegate: NSObjectProtocol {
    
    // 编辑器初始化完成
    @objc optional func editorViewControllerDidFinishLoadingDOM(_ controller: ELEditorViewController)
    
    // 标题改变
    @objc optional func editorViewController(_ controller: ELEditorViewController, titleDidChange title: String)
    
    // 内容改变
    @objc optional func editorViewController(_ controller: ELEditorViewController, contentDidChange content: String)
    
    // 封面改变
    @objc optional func editorViewController(_ controller: ELEditorViewController, coverDidChange cover: URL?)
    
    // js层音频播放
    @objc optional func editorViewControllerAudioOnPlay(_ controller: ELEditorViewController)
}


/// 原生JavaScriptCore暴露给JS层的对象
@objc protocol ELEditorViewJavaScriptBridgeProtocol: JSExport {
    //日志输出
    func onLog(_ msg: String)
    
    //音频播放点击
    func onAudioPlay(_ currentIndex: Int, _ audioListString: String)
    
    //音频继续播放点击
    func onAudioResume()
    
    //音频删除
    func onAudioDelete(_ dataId: String, _ urlString: String)
    
    ///编辑器加载完成
    func onDomLoadedCallback()
    
    ///输入框组件获取焦点
    func onFocus(_ jsId: String)
    
    ///输入框组件内容改变
    func onValueChange(_ jsId: String, _ htmlString: String)
    
    ///封面图点击
    func onCoverClick(_ urlString: String)
}


/// Bridge回调
@objc protocol ELEditorViewJavaScriptBridgeDelegate: JSExport {
    
    //音频播放点击
    func onAudioPlay()
    
    //音频继续播放点击
    func onAudioResume()
    
    //音频删除
    func onAudioDelete(dataId: String, url: URL)
    
    ///编辑器加载完成
    func onDomLoadedCallback()
    
    ///标题输入框组件获取焦点
    func onTitleFocus()
    
    ///正文输入框组件获取焦点
    func onContentFocus()
    
    ///标题改变
    func onTitleChange(html: String)
    
    ///正文改变
    func onContentChange(html: String)
    
    ///封面图点击
    func onCoverClick(url: URL?)
}
