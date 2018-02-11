//
//  ELEditorView.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit
import SnapKit

open class ELEditorView: UIView {
    open private(set) var webView: ELWebView!
    open private(set) var cover: ELEditorCover!
    open private(set) var titleField: ELEditorField!
    open private(set) var contentField: ELEditorField!
    
    var _inputAccessoryView: ELInputAccessoryView?
    
    /// dom是否已加载，否则不可操作
    fileprivate var domLoaded = false
    
    open weak var delegate: ELEditorViewDelegate?
    //内部的回调
    weak var internalDelegate: ELEditorViewInternalDelegate?
    
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
        webView = ELWebView(frame: self.frame)
        webView.backgroundColor = .white
        webView.scalesPageToFit = true
        webView.delegate = self
        webView.hidesInputAccessoryView = true
        webView.isOpaque = false //防止出现黑线
        addSubview(webView)
        webView.snp.makeConstraints { (mk) in
            if #available(iOS 11.0, *) {
                mk.edges.equalTo(self.safeAreaLayoutGuide)
            } else {
                mk.edges.equalToSuperview()
            }
        }
        
        let htmlURL = Bundle(for: ELEditorView.self).url(forResource: "editor", withExtension: "html")!
        var html = try! NSString(contentsOf: htmlURL, encoding: String.Encoding.utf8.rawValue)
        html = html.replacingOccurrences(of: "{NATIVE_PLATFORM}", with: "iOS")
            .replacingOccurrences(of: "//{NATIVE_TEMPLATE}", with: "") as NSString
        webView.loadHTMLString(html as String, baseURL: htmlURL.deletingLastPathComponent())
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
    
    /**
     * 获取封面图
     * @return 如果没有封面图时则返回null
     */
    public func getCover() -> URL? {
        return cover.getCover()
    }
    
    /**
     * 更新封面图
     * @param url 为nil时清除封面图
     */
    public func updateCover(_ url: URL?) {
        cover.updateCover(url)
    }
    
    /**
     * 获取标题
     */
    public func getTitle() -> String {
        return titleField.getValue()
    }
    
    /**
     * 设置标题
     */
    public func setTitle(_ title: String) {
        titleField.setValue(title)
    }
    
    /**
     * 获取内容
     */
    public func setContent(_ title: String) {
        contentField.setValue(title)
    }
    
    /**
     * 设置内容
     */
    public func getContent() -> String {
        return contentField.getValue()
    }
    
    /**
     * 切换至夜间模式
     */
    public func switchToNightMode() {
        _inputAccessoryView?.onThemeChange()
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        webView.backgroundColor = backgroundColor
        webView.stringByEvaluatingJavaScript(from: "Enclave.switchToNightMode();")
    }
    
    /**
     * 切换至日间模式
     */
    public func switchToLightMode() {
        _inputAccessoryView?.onThemeChange()
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        webView.backgroundColor = backgroundColor
        webView.stringByEvaluatingJavaScript(from: "Enclave.switchToLightMode();")
    }
    
    ///当离开页面时备份当前选区
    func backupRangeWhenDisappear() {
        webView.stringByEvaluatingJavaScript(from: "Enclave.backupRange();")
        webView.endEditing(true)
    }
}


//MARK: - Keyboard
extension ELEditorView {
    
    func addKeyboardObserver() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShowOrHide(_:)), name: .UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShowOrHide(_:)), name: .UIKeyboardWillHide, object: nil) 
    }
    
    @objc func keyboardWillShowOrHide(_ notification: Notification) {
        var contentHeight = webView.frame.height
        if #available(iOS 11.0, *) {
            contentHeight += self.safeAreaInsets.bottom
        }
        let value = notification.userInfo![UIKeyboardFrameEndUserInfoKey] as AnyObject
        let duration = (notification.userInfo![UIKeyboardAnimationDurationUserInfoKey] as! NSNumber).doubleValue
        
        let keyboardFrame = self.convert(value.cgRectValue!, from: nil)
        var isShow = notification.name == .UIKeyboardWillShow
        if isShow {
            contentHeight -= keyboardFrame.height
        }
        //inputAccessoryView
        if let inputAccessoryView = _inputAccessoryView {
            let height = inputAccessoryView.frame.height
            contentHeight -= height
            inputAccessoryView.snp.updateConstraints({ (mk) in
                mk.bottom.equalTo(isShow ? -keyboardFrame.height : height)
            })
            inputAccessoryView.isHidden = !isShow
            UIView.animate(withDuration: duration, animations: {
                inputAccessoryView.superview?.layoutIfNeeded()
            })
            //更新webView
            webView.scrollView.contentInset.bottom = isShow ? height : 0
        }
        webView.stringByEvaluatingJavaScript(from: "native.contentHeight = \(contentHeight);")
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
        case "callback-dom-loaded":
            handled = true
            handleDOMLoadedCallback(url)
        case "callback-log":
            handled = true
            handleLogCallback(url)
        case "callback-cover-tap":
            handled = true
            handleCoverTappedCallback(url)
        case "callback-field-valuechange":
            handled = true
            handleFieldValueChangeCallback(url)
        case "callback-field-focus":
            handled = true
            handleFieldFocusCallback(url)
        case "callback-field-deleteRecord":
            handled = true
            //handleFieldDeleteRecordCallback(url)
        case "callback-field-playRecord":
            handled = true
            handleFieldPlayRecordCallback(url)
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
        internalDelegate?.editorView(self, coverTappedWith: url)
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
    
    //字段获取输入焦点
    private func handleFieldFocusCallback(_ url: URL) {
        let params = parseParameters(url)
        if let id = params["id"] {
            _inputAccessoryView?.isEnableItem = id == contentField.jsId
        }
    }
    
    //正文中的音频开始播放
    private func handleFieldPlayRecordCallback(_ url: URL) {
        let params = parseParameters(url)
        if let id = params["id"] {
            
        }
    }
    
    
    /// 转换参数
    ///
    /// - Parameter url: js端传过来的url
    /// - Returns: 参数字典
    func parseParameters(_ url: URL) -> [String: String] {
        var returnParameters: [String: String] = [:]
        guard let parameters = (url as! NSURL).resourceSpecifier?.removingPercentEncoding?.components(separatedBy: "~") else {
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
