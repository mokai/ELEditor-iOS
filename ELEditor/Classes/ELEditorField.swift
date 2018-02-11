//
//  ELEditorField.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit

public extension UITextField {
    
    public func test() { }
    
}

open class ELEditorField: NSObject, ELEditorComponent {
    var jsAccessor: String
    var jsId: String
    var webView: UIWebView?
    var domLoaded: Bool = false
    var preloadedValue: Any?
    fileprivate var preloadedPlaceHolder: String?
    
    init(jsAccessor: String, jsId: String, webView: UIWebView) {
        self.jsAccessor = jsAccessor
        self.jsId = jsId
        self.webView = webView
    }
}

extension ELEditorField: ELEditorFieldProtocol {
    
    public func getValue() -> String {
        guard domLoaded else {
            return (preloadedValue as? String) ?? ""
        }
        let jsCommand = jsAccessor.appending(".getHTML();")
        return self.webView?.stringByEvaluatingJavaScript(from: jsCommand) ?? ""
    }
    
    public func setValue(_ string: String) {
        guard domLoaded else {
            preloadedValue = string
            return
        }
        let value = formatValue(string)
        let jsCommand = jsAccessor.appending(".setHTML('\(value)');")
        self.webView?.stringByEvaluatingJavaScript(from: jsCommand)
    }
    
    public func isEmpty() -> Bool {
        guard domLoaded else {
            return getValue().count > 0
        }
        let jsCommand = jsAccessor.appending(".isEmpty();")
        guard let boolString = self.webView?.stringByEvaluatingJavaScript(from: jsCommand),
             boolString == "true" else {
                return false
        }
        return true
    }
    
    public func setPlaceholder(_ string: String) {
        guard domLoaded else {
            preloadedPlaceHolder = string
            return
        }
        let jsCommand = jsAccessor.appending(".setPlaceholder('\(string)');")
        self.webView?.stringByEvaluatingJavaScript(from: jsCommand)
    }
    
    func handleDOMLoaded() {
        domLoaded = true
        
        if let preloadedPlaceHolder  = self.preloadedPlaceHolder {
            self.setPlaceholder(preloadedPlaceHolder)
            self.preloadedPlaceHolder = nil
        }
        
        if let preloadedValue = self.preloadedValue as? String {
            self.setValue(preloadedValue)
            self.preloadedValue = nil
        }
    }
    
    func formatValue(_ value: String) -> String {
        return value.replacingOccurrences(of: "'", with: "\\'")
    }
}

//MARK: - Content
extension ELEditorField {
    
    func insertImage(_ url: URL) {
        guard domLoaded else {
            return
        }
        self.webView?.becomeFirstResponder()
        let jsCommand = jsAccessor.appending(".insertImage('\(url.absoluteString)');")
        self.webView?.stringByEvaluatingJavaScript(from: jsCommand)
    }
    
    func insertRecord(_ url: URL, duration: String) {
        guard domLoaded else {
            return
        }
        let jsCommand = jsAccessor.appending(".insertRecord('\(url.absoluteString)', '\(formatValue(duration))');")
        self.webView?.stringByEvaluatingJavaScript(from: jsCommand)
    }
}
