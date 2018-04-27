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
    var _inputAccessoryView: ELInputAccessoryView?
    fileprivate var jsBridge: ELEditorViewJavaScriptBridge?
    
    weak var delegate: ELEditorViewJavaScriptBridgeDelegate? {
        didSet {
            jsBridge?.delegate = delegate
        }
    }
    
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
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        
        setupWebView()
        addKeyboardObserver()
    }
    
    fileprivate func setupWebView() {
        webView = ELWebView(frame: self.frame)
        webView.backgroundColor = ELEdtiorConfiguration.backgroundColor()
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
        webView.loadHTMLString(html as String, baseURL: htmlURL.deletingLastPathComponent())
    }
    
    fileprivate func setupJavaScriptBridge() {
        jsBridge = ELEditorViewJavaScriptBridge(webView: webView)
        jsBridge?.delegate = delegate
        delegate?.onDomLoadedCallback()
    }
}


// MARK: - Public
extension ELEditorView: ELEditorPublicProtocol {
    
    public func getCover() -> URL? {
        return jsBridge?.getCover()
    }
    
    public func updateCover(_ url: URL?) {
        jsBridge?.updateCover(url)
    }
    
    public func getTitle() -> String? {
        let title = jsBridge?.getTitle()
        return title == nil || title!.isEmpty ? nil : title
    }
    
    public func setTitle(_ title: String) {
        jsBridge?.setTitle(title)
    }
    
    public func setContent(_ content: String) {
        jsBridge?.setContent(content)
    }
    
    public func getContent() -> String? {
        let content = jsBridge?.getContent()
        return content == nil || content!.isEmpty ? nil : content
    }
    
    public func focusTitle() {
        jsBridge?.focusTitle()
    }
    
    public func focusContent() {
        jsBridge?.focusContent()
    }
    
    public func isEmptyTitle() -> Bool {
        return jsBridge?.isEmptyTitle() ?? true
    }
    
    public func isEmptyContent() -> Bool {
        return jsBridge?.isEmptyContent() ?? true
    }
    
    /**
     结束输入法
     */
    public func endEditing() {
        self.endEditing(true)
    }
    
    func backupRangeWhenDisappear() {
        jsBridge?.backupRangeWhenDisappear()
    }
    
    public func insertImage(_ url: URL) {
        jsBridge?.insertImage(url)
    }
    
    public func insertAudio(_ url: URL, duration: TimeInterval) {
        jsBridge?.insertAudio(url, duration: duration)
    }
    
    public func switchToLightMode() {
        jsBridge?.switchToLightMode()
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        superview?.backgroundColor = backgroundColor
        webView.backgroundColor = backgroundColor
    }
    
    public func switchToNightMode() {
        jsBridge?.switchToNightMode()
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        superview?.backgroundColor = backgroundColor
        webView.backgroundColor = backgroundColor
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
        //更新原生的内容高度到js层
        webView.stringByEvaluatingJavaScript(from: "EnclaveEditor.nativeContentHeight = \(contentHeight);")
    }
}


//MARK: - UIWebViewDelegate
extension ELEditorView: UIWebViewDelegate {
    
    public func webViewDidFinishLoad(_ webView: UIWebView) {
        setupJavaScriptBridge()
    }
    
    public func webView(_ webView: UIWebView, shouldStartLoadWith request: URLRequest, navigationType: UIWebViewNavigationType) -> Bool {
        if navigationType == .linkClicked { //编辑器内不允许链接点击跳转
            return false
        }
        return true
    }
}
