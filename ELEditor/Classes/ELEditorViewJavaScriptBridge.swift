//
//  ELEditorViewJavaScriptBridge.swift
//  ELEditor
//
//  Created by gongkai on 2018/4/21.
//

import UIKit
import JavaScriptCore

///编辑器与JS交互桥
class ELEditorViewJavaScriptBridge: NSObject {
    let NavtiveName = "EnclaveNative"
    let JSMobileName = "EnclaveMobile"
    let JSEditorName = "EnclaveEditor"
    let JSCoverName  = "EnclaveEditor.cover"
    let JSTitleName = "EnclaveEditor.title"
    let JSContentName = "EnclaveEditor.content"
    
    fileprivate weak var jsContext: JSContext?
    fileprivate weak var webView: UIWebView?
    
    weak var delegate: ELEditorViewJavaScriptBridgeDelegate?
    
    convenience init(webView: UIWebView) {
        self.init()
        guard let jsContext = webView.value(forKeyPath: "documentView.webView.mainFrame.javaScriptContext") as? JSContext else { return }
        self.jsContext = jsContext
        self.webView = webView
        jsContext.setObject(self, forKeyedSubscript: NavtiveName as NSCopying & NSObjectProtocol)
        
        jsContext.exceptionHandler = { (ctx, exception) in
            ELEdtiorConfiguration.log("JS Error: \(exception?.description ?? "unknown error")")
            jsContext.exception = nil;
        }
        
        if ELEdtiorConfiguration.isNightTheme() {
            switchToNightMode()
        }
    }
    
    //调用js方法
    fileprivate func callJS(objc objcName: String,
                func funcName: String) -> JSValue? {
        guard let jsContext = jsContext else { return nil }
        let script = objcName.appending(".")
            .appending(funcName)
        
        //jsContext.evaluateScript("1 + 1;")
        if let jsValue = jsContext.evaluateScript(script) {
            if let exception = jsContext.exception {
                ELEdtiorConfiguration.log("JS Error: \(exception.description)")
                jsContext.exception = nil
            }
            return jsValue
        }
        return nil
    }
    
}

//MARK: - Public
extension ELEditorViewJavaScriptBridge: ELEditorPublicProtocol {
    
    func getCover() -> URL? {
        guard let value = callJS(objc: JSCoverName, func: "getCover()"),
            let urlString = value.toString() else {
            return nil
        }
        return URL(string: urlString)
    }
    
    func updateCover(_ url: URL?) {
        let urlString = url?.absoluteString ?? ""
        callJS(objc: JSCoverName, func: "updateCover('\(urlString)')")
    }
    
    func getTitle() -> String? {
        return callJS(objc: JSTitleName, func: "getText()")?.toString()
    }
    
    func setTitle(_ title: String) {
        callJS(objc: JSTitleName, func: "setText('\(title)')")
    }
    
    func getContent() -> String? {
        return callJS(objc: JSContentName, func: "getHTML()")?.toString()
    }
    
    func setContent(_ content: String) {
        let value = ELEdtiorConfiguration.escapingHTML(content)
        callJS(objc: JSContentName, func: "setHTML('\(value)')")
    }
    
    func focusTitle() {
        callJS(objc: JSTitleName, func: "focus()")
    }
    
    func focusContent() {
        callJS(objc: JSContentName, func: "focus()")
    }
    
    func isEmptyTitle() -> Bool {
        guard let value = callJS(objc: JSTitleName, func: "isEmpty()"),
         value.isBoolean else {
            return true
        }
        return value.toBool()
    }
    
    func isEmptyContent() -> Bool {
        guard let value = callJS(objc: JSContentName, func: "isEmpty()"),
            value.isBoolean else {
                return true
        }
        return value.toBool()
    }
    
    func backupRangeWhenDisappear() {
        callJS(objc: JSEditorName, func: "backupRange()")
    }
    
    func insertAudio(_ url: URL, duration: TimeInterval) {
        let duration = Int(duration)
        callJS(objc: JSContentName, func: "insertAudio('\(url.absoluteString)', \(duration))")
    }
    
    func insertImage(_ url: URL) {
        self.webView?.becomeFirstResponder()
        callJS(objc: JSContentName, func: "insertImage('\(url.absoluteString)')")
    }
    
    func switchToNightMode() {
        _ = callJS(objc: JSEditorName, func: "switchToNightMode()")
    }
    
    func switchToLightMode() {
        _ = callJS(objc: JSEditorName, func: "switchToLightMode()")
    }
    
}

//MARK: - Public JS Method
extension ELEditorViewJavaScriptBridge: ELEditorViewJavaScriptBridgeProtocol {
    
    func onLog(_ msg: String) {
        DispatchQueue.main.async {
            ELEdtiorConfiguration.log(msg)
        }
    }
    
    func onAudioPlay(_ currentIndex: Int, _ audioListString: String) {
        DispatchQueue.main.async {
            self.delegate?.onAudioPlay()
        }
    }
    
    func onAudioResume() {
        DispatchQueue.main.async {
            self.delegate?.onAudioResume()
        }
    }
    
    func onAudioDelete(_ dataId: String, _ urlString: String) {
        if let url = URL(string: urlString) {
            DispatchQueue.main.async {
                self.delegate?.onAudioDelete(dataId: dataId, url: url)
            }
        }
    }
    
    func onDomLoadedCallback() {
        DispatchQueue.main.async {
            self.delegate?.onDomLoadedCallback()
        }
    }
    
    func onFocus(_ jsId: String) {
        DispatchQueue.main.async {
            if jsId == self.JSTitleName {
                self.delegate?.onTitleFocus()
            } else {
                self.delegate?.onContentFocus()
            }
        }
    }
    
    func onValueChange(_ jsId: String, _ htmlString: String) {
        DispatchQueue.main.async {
            if jsId == self.JSTitleName {
                self.delegate?.onTitleChange(html: htmlString)
            } else {
                self.delegate?.onContentChange(html: htmlString)
            }
        }
    }
    
    func onCoverClick(_ urlString: String) {
        var url: URL?
        if !urlString.isEmpty {
            url = URL(string: urlString)
        }
        DispatchQueue.main.async {
            self.delegate?.onCoverClick(url: url)
        }
    }
    
}



