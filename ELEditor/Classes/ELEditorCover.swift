//
//  ELEditorCover.swift
//  ELEditor
//
//  Created by GKK on 2017/12/7.
//

import UIKit

open class ELEditorCover: NSObject, ELEditorComponent {
    var jsAccessor: String
    var jsId: String
    var webView: UIWebView?
    var domLoaded: Bool = false
    var preloadedValue: Any?
    
    init(jsAccessor: String, jsId: String, webView: UIWebView) {
        self.jsAccessor = jsAccessor
        self.jsId = jsId
        self.webView = webView
    }
}


extension ELEditorCover: ELEditorCoverProtocol {
    
    public func updateCover(_ url: URL?) {
        guard domLoaded else {
            preloadedValue = url
            return
        }
        let urlString = url?.absoluteString ?? ""
        let jsCommand = jsAccessor.appending(".updateCover('\(urlString)');")
        self.webView?.stringByEvaluatingJavaScript(from: jsCommand)
    }
    
    public func getCover() -> URL? {
        guard domLoaded else {
            return preloadedValue as? URL
        }
        let jsCommand = jsAccessor.appending(".getCover();")
        guard let urlString = self.webView?.stringByEvaluatingJavaScript(from: jsCommand),
            let url = URL(string: urlString) else {
            return nil
        }
        return url
    }
    
    func handleDOMLoaded() {
        domLoaded = true
        
        if let preloadedValue = self.preloadedValue as? URL {
            self.updateCover(preloadedValue)
            self.preloadedValue = nil
        }
    }
}
