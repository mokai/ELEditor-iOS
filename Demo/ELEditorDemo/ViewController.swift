//
//  ViewController.swift
//  ELEditorDemo
//
//  Created by GKK on 2017/12/7.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit
import ELEditor

class ViewController: ELEditorViewController, ELEditorViewDelegate {
    
    // 封面图片选择器
    fileprivate lazy var coverImageSelector: ELImageSelector = {
        let selector = ELImageSelector()
        selector.title = "更换封面"
        selector.isCompression = false
        selector.viewController = self
        selector.allowsEditing = true
        return selector
    }()
    fileprivate var sourceView: UIView! //用于UIAlertController sender
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        editorView.delegate = self
        editorView.setTitle("你好呀")
        editorView.setContent("<p>魂牵梦萦魂牵梦萦魂牵梦萦</p>")
        editorView.titleField.setPlaceholder("标题")
        editorView.contentField.setPlaceholder("正文")
        
        sourceView = UIView(frame: CGRect(x: self.view.frame.width / 2, y: 100, width: 1, height: 1))
        sourceView.backgroundColor = .clear
        self.view.insertSubview(sourceView, belowSubview: editorView)
    }
   
    func editorView(_ editorView: ELEditorView, coverTappedWith url: URL?) {
        let selector = coverImageSelector
        //添加删除选项
        if url != nil {
            let deleteAction = UIAlertAction(title: "删除", style: .destructive, handler: { [weak self] (aciton) in
                guard let wself = self else { return  }
                //空字符则清空
                wself.editorView.updateCover(nil)
            })
            selector.extraActions = [deleteAction]
        } else {
            selector.extraActions = []
        }
        selector.onSelectImageCallback = {[weak self] (image) in
            guard let wself = self else { return  }
            //Copy到本地
            let localURL = Util.saveImageToLocal(image)
            
            //插入到文中
            wself.editorView.updateCover(localURL)
        }
        selector.show(sourceView) //这里用self.view会有问题
    }
    
    
    func editorViewTitleDidChange(_ editorView: ELEditorView) {
        print(editorView.getTitle())
    }
    
    func editorViewContentDidChange(_ editorView: ELEditorView) {
        print(editorView.getContent())
    }
}




// MARK: - Utins
extension ViewController {
    
    
    
    
}

