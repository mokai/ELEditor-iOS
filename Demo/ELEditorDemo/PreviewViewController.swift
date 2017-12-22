//
//  PreviewViewController.swift
//  ELEditorDemo
//
//  Created by GKK on 2017/12/22.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit

class PreviewViewController: UIViewController {
    var content: String!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let webView = UIWebView(frame: self.view.frame)
        webView.backgroundColor = .white
        self.view.addSubview(webView)
        
        var html = ""
        if let path = Bundle.main.path(forResource: "preview", ofType: "html"),
            let htmlString = try? NSString(contentsOf: URL(fileURLWithPath: path), encoding: String.Encoding.utf8.rawValue) {
            html.append(htmlString as String)
        }
        html = html.replacingOccurrences(of: "{content}", with: content as String)
        webView.loadHTMLString(html, baseURL: nil)
    }

}
