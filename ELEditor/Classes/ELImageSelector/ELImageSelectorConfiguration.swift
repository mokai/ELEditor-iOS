//
//  ELImageSelectorConfiguration.swift
//  ELImageSelector
//
//  Created by GKK on 2018/2/7.
//  Copyright © 2018年 Enclave. All rights reserved.
//

import UIKit

/// 模块配置入口
public class ELImageSelectorConfiguration: NSObject {
    
    static let is_iPad = UI_USER_INTERFACE_IDIOM() == .pad
    
    //调试模式
    public static var isDebug: Bool = false
    
    //日志输出
    public static var log: ((String)->Void) = { (msg) in
        #if DEBUG
            print(msg)
        #endif
    }
    
    //图片压缩
    public static var imageCompressionIfNeeded: ((UIImage) -> UIImage?) = { (image) in
        var compression: CGFloat = 1.0 //压缩率
        let maxFileSize = 1 * 500 * 1024 //最大1MB
        var imageData = UIImageJPEGRepresentation(image, compression)
        while let data = imageData, (data.count > maxFileSize && compression > 0.1)
        {
            compression -= 0.1
            imageData = UIImageJPEGRepresentation(image, compression)
        }
        if let imageData = imageData {
            return UIImage(data: imageData)
        }
        return nil
    }
    
}
