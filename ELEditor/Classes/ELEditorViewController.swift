import UIKit

enum ELToolbarItem: String {
    case insertImage //插入图片
    case insertRecord //插入录音
}

open class ELEditorViewController: UIViewController {
    /**
     是否显示Toolbar，默认为false
     */
    open var showToolbarView = true
    open private(set) var editorView: ELEditorView!
    
    open var delegate: ELEditorViewControllerDelegate?
    
    var _inputAccessoryView: ELInputAccessoryView?
    var _toolbarItems: [ELToolbarItem] = [
        .insertImage,
        .insertRecord
    ]
    
    //图片选择器
    lazy var imageSelector: ELImageSelector = {
        let selector = ELImageSelector(viewController: self)
        return selector
    }()
    
    override open func viewDidLoad() {
        super.viewDidLoad()
        setup()
        setupEditorView()
        setupInputAccessoryView()
        setupEditorViewFrame()
    }
    
    open func setup() {}
    
    fileprivate func setupEditorView() {
        editorView = ELEditorView(frame: self.view.frame)
        editorView.delegate = self
        view.addSubview(editorView)
    }
    
    fileprivate func setupEditorViewFrame() {
        var bottom: CGFloat = -(_inputAccessoryView != nil && !_inputAccessoryView!.isHidden ? 40 : 0)
        editorView.snp.makeConstraints { (mk) in
            mk.left.right.equalToSuperview()
            if #available(iOS 11.0, *) {
                mk.top.equalToSuperview()
                mk.bottom.equalTo(bottom)
            } else {
                mk.top.equalTo(self.topLayoutGuide.snp.bottom)
                mk.bottom.equalTo(self.bottomLayoutGuide.snp.top).offset(bottom)
            }
        }
    }
}

//MARK: - InputAccessoryView
extension ELEditorViewController {
    
    fileprivate func setupInputAccessoryView() {
        guard showToolbarView else {
            return
        }
        _inputAccessoryView = ELInputAccessoryView(items: itemsForToolbar())
        view.addSubview(_inputAccessoryView!)
        _inputAccessoryView?.snp.makeConstraints({ (mk) in
            mk.height.equalTo(40)
            mk.left.right.bottom.equalToSuperview()
        })
        editorView._inputAccessoryView = _inputAccessoryView
        _inputAccessoryView?.isHidden = true
    }
    
    func itemsForToolbar() -> [ELBarButtonItem] {
        return self._toolbarItems.map { (item) -> ELBarButtonItem in
            let btn = ELBarButtonItem(type: .system)
            btn.frame = CGRect(origin: .zero, size: CGSize(width: 35, height: 40))
            btn.setImage(UIImage.el_image(named: item.rawValue), for: .normal)
            btn.addTarget(self, action: #selector(onItemTap(_:)), for: .touchUpInside)
            btn.name = item.rawValue
            return btn
        }
    }
    
    @objc func onItemTap(_ item: ELBarButtonItem) {
        //正文插入图片
        if item.name == ELToolbarItem.insertImage.rawValue {
            editorView.backupRangeWhenDisappear()
            imageSelector.onSelectImageCallback = {[weak self] (image) in
                guard let wself = self else { return  }
                //Copy到本地并插入到文中
                if let localURL = ELEdtiorConfiguration.saveImage(image) {
                    wself.editorView.insertImage(localURL)
                }
            }
            imageSelector.extraActions = []
            imageSelector.isCompression = true
            imageSelector.show(item)
        }
        else if item.name == ELToolbarItem.insertRecord.rawValue {
            editorView.backupRangeWhenDisappear()
            let recordVC = ELEditorRecordViewController()
            recordVC.delegate = self
            self.navigationController?.pushViewController(recordVC, animated: true)
        }
    }
}


//MARK: - JS Callback
extension ELEditorViewController: ELEditorViewJavaScriptBridgeDelegate {
    
    func onDomLoadedCallback() {
        delegate?.editorViewControllerDidFinishLoadingDOM?(self)
    }
    
    func onAudioPlay() {
        delegate?.editorViewControllerAudioOnPlay?(self)
    }
    
    func onAudioResume() {
        delegate?.editorViewControllerAudioOnPlay?(self)
    }
    
    func onAudioDelete(dataId: String, url: URL) {
        //音频删除
        ELEdtiorConfiguration.delete(url)
    }
    
    func onTitleFocus() {
        _inputAccessoryView?.isEnableItem = false
    }
    
    func onContentFocus() {
        _inputAccessoryView?.isEnableItem = true
    }

    func onTitleChange(html: String) {
        delegate?.editorViewController?(self, titleDidChange: html)
    }
    
    func onContentChange(html: String) {
        delegate?.editorViewController?(self, contentDidChange: html)
    }
    
    //封面图选择
    func onCoverClick(url: URL?) {
        if let url = url {
            let deleteAction = UIAlertAction(title: "删除", style: .destructive, handler: { [weak self] (aciton) in
                guard let wself = self else { return  }
                //空字符则清空
                wself.editorView.updateCover(nil)
                ELEdtiorConfiguration.delete(url)
                wself.delegate?.editorViewController?(wself, coverDidChange: nil)
            })
            imageSelector.extraActions = [deleteAction]
        } else {
            imageSelector.extraActions = []
        }
        imageSelector.onSelectImageCallback = {[weak self] (image) in
            guard let wself = self else { return }
            //是否需要删除旧的
            if let url = url {
                ELEdtiorConfiguration.delete(url)
            }
            //Copy到本地并插入到文中
            if let localURL = ELEdtiorConfiguration.saveImage(image) {
                wself.editorView.updateCover(localURL)
                wself.delegate?.editorViewController?(wself, coverDidChange: localURL)
            }
        }
        imageSelector.isCompression = false
        imageSelector.show(editorView) //这里用self.view会有问题
    }

}

//MARK: - ELEditorRecordDelegate
extension ELEditorViewController: ELEditorRecordDelegate {
    
    //插入录音
    public func editorDidRecord(url: URL, duration: TimeInterval) -> Bool {
        editorView.insertAudio(url, duration: duration)
        return false
    }
    
}
