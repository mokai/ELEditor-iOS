//
//  ELWebView.swift
//  ELEditor
//
//  Created by GKK on 2018/2/11.
//

import UIKit

open class ELWebView: UIWebView {

    override open func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
        return false
    }
    
}
