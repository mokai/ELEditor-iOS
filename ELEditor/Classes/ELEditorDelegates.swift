//
//  ELEditorDelegates.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit

/// 编辑器回调
@objc public protocol ELEditorViewDelegate: UIWebViewDelegate {
    
    // 编辑器初始化完成
    @objc optional func editorViewDidFinishLoadingDOM(_ editorView: ELEditorView)
    
    // 封面点击
    func editorView(_ editorView: ELEditorView, coverTappedWith url: URL?)
    
    // 标题改变
    @objc optional func editorViewTitleDidChange(_ editorView: ELEditorView)
    
    // 内容改变
    @objc optional func editorViewContentDidChange(_ editorView: ELEditorView)
}

/// 组件接口
protocol ELEditorComponent: NSObjectProtocol {
    /// Javascript访问对象
    var jsAccessor: String { get set }
    var jsId: String { get set }
    
    weak var webView: UIWebView? { get set }
    
    /// DOM加载完成标志
    var domLoaded: Bool { get set }
    
    /// 在DOM未加载完成前操作组件则先缓存内容
    var preloadedValue: Any? { get set }
    
    /// DOM加载完成
    func handleDOMLoaded()
}


/// 封面图组件接口
public protocol ELEditorCoverProtocol: NSObjectProtocol {
    
    /// 获取封面图
    func getCover() -> URL?
    
    /// 更新封面图
    func updateCover(_ url: URL?)
}


/// 输入框字段组件接口
public protocol ELEditorFieldProtocol: NSObjectProtocol {
    
    /// 内容
    func getValue() -> String
    
    /// 设置内容
    func setValue(_ value: String)
    
    /// 是否为空
    func isEmpty() -> Bool
    
    /// 设置默认文本
    func setPlaceholder(_ string: String)
}

