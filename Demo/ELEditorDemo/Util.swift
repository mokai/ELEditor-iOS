//
//  Util.swift
//  ELEditorDemo
//
//  Created by GKK on 2017/12/8.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit

class Util: NSObject {

    class func saveImageToLocal(_ image: UIImage) -> URL? {
        let cacheDir = (NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true) as [String])[0]
        let imgCacheDir = NSURL(fileURLWithPath: cacheDir).appendingPathComponent("img")!
        if !FileManager.default.fileExists(atPath: imgCacheDir.absoluteString) {
            try? FileManager.default.createDirectory(at: imgCacheDir, withIntermediateDirectories: false, attributes: nil)
        }
        let newFileName = "\(UUID().uuidString).jpg"
        let targetURL = imgCacheDir.appendingPathComponent(newFileName)
        do {
            if let data = UIImageJPEGRepresentation(image, 0.99) {
                try data.write(to: targetURL)
                return targetURL
            }
        } catch {
            
        }
        return nil
    }
    
    //图片压缩
    class func imageCompressionIfNeeded(with image: UIImage) -> UIImage? {
        var compression: CGFloat = 1.0 //压缩率
        let maxFileSize = 1 * 500 * 1024 //最大1MB
        var imageData = UIImageJPEGRepresentation(image, compression)
        while let data = imageData, (data.count > maxFileSize && compression > 0.1)
        {
            compression -= 0.1
            imageData = UIImageJPEGRepresentation(image, compression)
        }
        return imageData != nil ? UIImage(data: imageData!) : nil
    }
}
