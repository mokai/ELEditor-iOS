//
//  ELEditorField.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit

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
        let jsCommand = jsAccessor.appending(".getHtml();")
        return self.webView?.stringByEvaluatingJavaScript(from: jsCommand) ?? ""
    }
    
    public func setValue(_ string: String) {
        guard domLoaded else {
            preloadedValue = string
            return
        }
        let jsCommand = jsAccessor.appending(".setHtml('\(string)');")
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
    
}
