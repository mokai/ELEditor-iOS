//
//  ELEditorView.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit
import SnapKit

open class ELEditorView: UIView {
    open private(set) var webView: UIWebView!
    open private(set) var cover: ELEditorCover!
    open private(set) var titleField: ELEditorField!
    open private(set) var contentField: ELEditorField!
    
    /// dom是否已加载，否则不可操作
    fileprivate var domLoaded = false
    
    open weak var delegate: ELEditorViewDelegate?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        setup()
    }
    
    required public init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    fileprivate func setup() {
        backgroundColor = .clear
        
        setupWebView()
        setupComponents()
        addKeyboardObserver()
    }
    
    fileprivate func setupWebView() {
        webView = UIWebView(frame: self.frame)
        webView.backgroundColor = .white
        webView.scalesPageToFit = true
        webView.delegate = self
        webView.isOpaque = false //防止出现黑线
        addSubview(webView)
        webView.snp.makeConstraints { (mk) in
            mk.edges.equalToSuperview()
        }
        
        let url = Bundle(for: ELEditorView.self).url(forResource: "editor", withExtension: "html")!
        webView.loadRequest(URLRequest(url: url))
    }
    
    fileprivate func setupComponents() {
        cover = ELEditorCover(jsAccessor: "Enclave.cover",
                              jsId: "cover",
                              webView: webView)
        titleField = ELEditorField(jsAccessor: "Enclave.title",
                                   jsId: "title",
                                   webView: webView)
        contentField = ELEditorField(jsAccessor: "Enclave.content",
                                     jsId: "content",
                                     webView: webView)
    }
    
}


// MARK: - Public
extension ELEditorView: ELEditorCoverProtocol {
    
    public func getCover() -> URL? {
        return cover.getCover()
    }
    
    public func updateCover(_ url: URL?) {
        cover.updateCover(url)
    }
    
    public func setTitle(_ title: String) {
        titleField.setValue(title)
    }
    
    public func getTitle() -> String {
        return titleField.getValue()
    }
    
    public func setContent(_ title: String) {
        contentField.setValue(title)
    }
    
    public func getContent() -> String {
        return contentField.getValue()
    }
    
    public func switchToNightMode() {
        
    }
    
    public func switchToLightMode() {
        
    }
    
}


//MARK: - Keyboard
extension ELEditorView {
    
    func addKeyboardObserver() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardDidShow(_:)), name: .UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: .UIKeyboardWillHide, object: nil)
    }
    
    @objc func keyboardDidShow(_ notification: Notification) {
        //webView.customInputAccessoryView = customInputAccessoryView
        let info = notification.userInfo
        let value = info![UIKeyboardFrameEndUserInfoKey] as AnyObject
        let rawFrame = value.cgRectValue!
        let keyboardFrame = self.convert(rawFrame, from: nil)
        webView.snp.updateConstraints { (mk) in
            mk.bottom.equalTo(-keyboardFrame.height)
        }
        UIView.animate(withDuration: 0.25) {
            self.layoutIfNeeded()
        }
    }
    
    @objc func keyboardWillHide(_ notification: Notification) {
        webView.snp.updateConstraints { (mk) in
             mk.bottom.equalToSuperview()
        }
        UIView.animate(withDuration: 0.25) {
            self.layoutIfNeeded()
        }
    }
}


//MARK: - UIWebViewDelegate
extension ELEditorView: UIWebViewDelegate {
    
    public func webViewDidFinishLoad(_ webView: UIWebView) {
        
    }
    
    public func webView(_ webView: UIWebView, shouldStartLoadWith request: URLRequest, navigationType: UIWebViewNavigationType) -> Bool {
        var shouldLoad = false
        guard let url = request.url else {
            return shouldLoad
        }
        if navigationType != .linkClicked {
            shouldLoad = !handleWebViewCallback(url)
        }
        return shouldLoad
    }
    
}


// MARK: - Handling Callbacks
extension ELEditorView {
    
    /// 处理js回调
    fileprivate func handleWebViewCallback(_ url: URL) -> Bool {
        var handled = false
        guard let scheme = url.scheme else {
            return handled
        }
        
        switch scheme {
        case "callback-cover-tap":
            handled = true
            handleCoverTappedCallback(url)
        case "callback-field-valuechange":
            handled = true
            handleFieldValueChangeCallback(url)
        case "callback-dom-loaded":
            handled = true
            handleDOMLoadedCallback(url)
        case "callback-log":
            handled = true
            handleLogCallback(url)
        default:
            handled = false
        }
        return handled
    }
    
    /// DOM加载完成
    private func handleDOMLoadedCallback(_ url: URL) {
        cover.handleDOMLoaded()
        titleField.handleDOMLoaded()
        contentField.handleDOMLoaded()
        if let delegate = delegate,
            delegate.responds(to: #selector(ELEditorViewDelegate.editorViewDidFinishLoadingDOM(_:))) {
            delegate.editorViewDidFinishLoadingDOM!(self)
        }
    }
    
    /// 日志输出
    private func handleLogCallback(_ url: URL) {
        let params = parseParameters(url)
        var msg = params["msg"] ?? url.absoluteString
        print("ELEdtior log: \(msg)")
    }
    
    /// 封面图点击
    private func handleCoverTappedCallback(_ url: URL) {
        let params = parseParameters(url)
        var url: URL?
        if let urlString = params["url"] {
            url = URL(string: urlString)
        }
        delegate?.editorView(self, coverTappedWith: url)
    }
    
    /// 字段内容改变
    private func handleFieldValueChangeCallback(_ url: URL) {
        let params = parseParameters(url)
        if let id = params["id"] {
            if id == titleField.jsId, let delegate = delegate,
                delegate.responds(to: #selector(ELEditorViewDelegate.editorViewTitleDidChange(_:))) {
                delegate.editorViewTitleDidChange!(self)
            }
            else if id == contentField.jsId, let delegate = delegate,
                delegate.responds(to: #selector(ELEditorViewDelegate.editorViewContentDidChange(_:))) {
                delegate.editorViewContentDidChange!(self)
            }
        }
    }
    
    /// 转换参数
    ///
    /// - Parameter url: js端传过来的url
    /// - Returns: 参数字典
    func parseParameters(_ url: URL) -> [String: String] {
        var returnParameters: [String: String] = [:]
        guard let parameters = (url as! NSURL).resourceSpecifier?.components(separatedBy: "~") else {
            return returnParameters
        }
        
        for parameter in parameters {
            let signleParameter = parameter.components(separatedBy: "=")
            if let name = signleParameter.first,
                let value = signleParameter.last,
                name != value {
                returnParameters[name] = value
            }
        }
        return returnParameters
    }
    
}