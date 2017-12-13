//
//  ELImageSelector.swift
//  Enclave
//
//  Created by gongkai on 2017/6/8.
//  Copyright © 2017年 Enclave. All rights reserved.
//

import UIKit

class ELImageSelector: NSObject {

    /// 扩展的action
    var extraActions: [UIAlertAction] = []
    /// 扩展的action是否追加尾部，否则在最前面插入
    var isAppendExtraActions = true

    /// 用于present,默认取UIUtil.currentViewController
    var viewController: UIViewController?

    ///是否可以编辑，默认不可编辑
    var allowsEditing: Bool = false

    /// 标题
    var title = "选择图片"

    //是否压缩，默认压缩
    var isCompression: Bool = true

    ///回调
    var onSelectImageCallback: ((UIImage)->())? //选择图片
    var onCancelCallback: (()->())? //取消选择

    fileprivate var imagePickerController: UIImagePickerController?
    fileprivate var sourceView: UIView?

    /// 显示
    ///
    /// - Parameter sourceView: 用于iPad下的popoverPresentationController，如果传nil默认取UIUtil.currentViewController?.view
    func show(_ sourceView: UIView? = nil) {
        self.sourceView = sourceView
        if self.sourceView == nil {
            self.sourceView = viewController!.view
        }

        let alertVC = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        if let popPresenter = alertVC.popoverPresentationController {
            popPresenter.sourceView = self.sourceView!
            popPresenter.sourceRect = self.sourceView!.bounds
        }

        if !isAppendExtraActions {
            extraActions.forEach { (action) in
                alertVC.addAction(action)
            }
        }
        var actionButton: UIAlertAction!
        actionButton = UIAlertAction(title: "从相册选择", style: .default) { [weak self ](action) in
            guard let wself = self else {
                return
            }
            wself.chooseImageForm(.photoLibrary)
        }
        alertVC.addAction(actionButton)

        actionButton = UIAlertAction(title: "拍照", style: .default) { [weak self](action) in
            guard let wself = self else {
                return
            }
            wself.chooseImageForm(.camera)
        }
        alertVC.addAction(actionButton)

        if isAppendExtraActions {
            extraActions.forEach { (action) in
                alertVC.addAction(action)
            }
        }

        actionButton = UIAlertAction(title: "取消", style: .cancel) { [weak self] (action) in
            guard let wself = self else {
                return
            }
            wself.onCancelCallback?()
        }
        alertVC.addAction(actionButton)

        viewController!.present(alertVC, animated: true, completion: nil)
    }

}

//MARK: - 选择
extension ELImageSelector: UIImagePickerControllerDelegate, UINavigationControllerDelegate {

    //从相册选择或拍照
    fileprivate func chooseImageForm(_ sourceType: UIImagePickerControllerSourceType) {
        let imagePickerController = UIImagePickerController()
        self.imagePickerController = imagePickerController
        imagePickerController.sourceType = sourceType
        imagePickerController.delegate = self
        imagePickerController.allowsEditing = allowsEditing
        if let popPresenter = imagePickerController.popoverPresentationController {
            popPresenter.sourceView = sourceView!
            popPresenter.sourceRect = sourceView!.bounds
        }
        viewController!.present(imagePickerController, animated: true, completion: nil)
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true, completion: nil)
        onCancelCallback?()
        self.imagePickerController = nil
    }

    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
        //#MARK: - FixBug:平板下系统从相册选择编辑时有Bug，所以不隐藏标题栏
        var isNavigationBarHideen = imagePickerController?.sourceType == .camera
        if !isNavigationBarHideen {
            if navigationController.viewControllers.count == 3 {
                isNavigationBarHideen = !(UI_USER_INTERFACE_IDIOM() == .pad && self.allowsEditing)
            } else {
                isNavigationBarHideen = false
            }
        }
        navigationController.setNavigationBarHidden(isNavigationBarHideen, animated: false)
    }

    //从相册选择或拍照完成
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
        imagePickerControllerDidCancel(picker)
        if allowsEditing {
            if let editedImage = info[UIImagePickerControllerEditedImage] as? UIImage {
                didChoose(image: editedImage)
            }
        } else {
            if let originImage = info[UIImagePickerControllerOriginalImage] as? UIImage {
                didChoose(image: originImage)
            }
        }
    }

}

//MARK: - 处理图片
extension ELImageSelector {

    fileprivate func didChoose(image: UIImage) {
        guard isCompression else {
            onSelectImageCallback?(image)
            return
        }
        //压缩
        var count = UIImageJPEGRepresentation(image, 0.99)!.count
        print("原图像大小: \(ByteCountFormatter.string(fromByteCount: Int64(count), countStyle: .binary))")

        guard let image = Util.imageCompressionIfNeeded(with: image) else {
            return
        }

        count = UIImageJPEGRepresentation(image, 0.99)!.count
        print("压缩图像大小: \(ByteCountFormatter.string(fromByteCount: Int64(count), countStyle: .binary))")

        onSelectImageCallback?(image)
    }
    
    
}

