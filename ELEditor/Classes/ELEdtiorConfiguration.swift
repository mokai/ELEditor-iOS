//
//  ELEdtiorConfiguration.swift
//  ELEditor
//
//  Created by GKK on 2018/2/7.
//

import UIKit

/// 模块配置入口
public class ELEdtiorConfiguration: NSObject {
    
    //主题色
    public static var tintColor: (()->UIColor) = {
        return .black
    }
    
    //背景色
    public static var backgroundColor: (()->UIColor) = {
        return .white
    }
    
    //边框色
    public static var borderColor: (()->UIColor) = {
        return UIColor.black.withAlphaComponent(0.16)
    }
    
    static func cachesDir() -> String {
        var paths = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true) as [String]
        return paths[0]
    }
    
    //编辑器资源目录，业务层应该在编辑器VC中配置每篇创作的资源URL
    public static var resourceURL: (()->URL) = {
        return URL(fileURLWithPath: cachesDir())
    }
    
    //保存图片到编辑器资源目录下
    static func saveImage(_ image: UIImage) -> URL? {
        let newFileName = "\(UUID().uuidString).jpg"
        let targetURL = resourceURL().appendingPathComponent(newFileName)
        do {
            if let data = UIImageJPEGRepresentation(image, 0.99) {
                try data.write(to: targetURL)
                return targetURL
            }
        } catch {
            
        }
        return nil
    }
    
    /// 删除本地文件
    static func delete(_ url: URL) {
        if url.isFileURL {
            try? FileManager.default.removeItem(at: url)
        }
    }
    
    /// 移动本地文件
    static func move(at sourceURL: URL, to targetURL: URL) {
        if sourceURL.isFileURL && targetURL.isFileURL {
            try? FileManager.default.moveItem(at: sourceURL, to: targetURL)
        }
    }
    
    /// 格式化时长
    static func formatSecondsToString(_ secounds: TimeInterval) -> String {
        if secounds.isNaN {
            return "00:00"
        }
        let Min = Int(secounds / 60)
        let Sec = Int(secounds.truncatingRemainder(dividingBy: 60))
        return String(format: "%02d:%02d", Min, Sec)
    }
}

