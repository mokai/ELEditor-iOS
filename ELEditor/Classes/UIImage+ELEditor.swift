//
//  UIImage+ELEditor.swift
//  ELEditor
//
//  Created by GKK on 2018/2/5.
//

import UIKit

extension UIImage {
    
    static func el_image(named: String) -> UIImage? {
        var bundle = Bundle(for: ELEditorViewController.self)
        return UIImage(named: named, in: bundle, compatibleWith: nil)
    }
}
