//
//  ELEditorInputAccessoryView.swift
//  ELEditor
//
//  Created by GKK on 2018/2/5.
//

import UIKit


class ELBarButtonItem: UIButton {
    var name: String = ""
}

class ELInputAccessoryView: UIView {
 
    private(set) var items: [ELBarButtonItem]
    fileprivate var itemContainer: UIScrollView!
    fileprivate var closeKeyBoardButton: UIButton!
    
    var isEnableItem: Bool = true {
        didSet {
            items.forEach { (item) in
                item.isEnabled = isEnableItem
            }
        }
    }

    init(items: [ELBarButtonItem]) {
        self.items = items
        super.init(frame: .zero)
        setup()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setup() {
        layer.borderWidth = 0.5
        
        itemContainer = UIScrollView()
        itemContainer.backgroundColor = .clear
        itemContainer.isPagingEnabled = true
        itemContainer.showsVerticalScrollIndicator = false
        itemContainer.showsHorizontalScrollIndicator = false
        itemContainer.bounces = false
        addSubview(itemContainer)
        itemContainer.snp.makeConstraints { (mk) in
            mk.top.bottom.left.equalToSuperview()
            mk.right.equalTo(-50)
        }
        
        //close keyboard
        closeKeyBoardButton = UIButton(type: .system)
        closeKeyBoardButton.setImage(UIImage.el_image(named: "keyboard"), for: .normal)
        closeKeyBoardButton.addTarget(self, action: #selector(onCloseKeyBoardItemTap), for: .touchUpInside)
        addSubview(closeKeyBoardButton)
        closeKeyBoardButton.snp.makeConstraints { (mk) in
             mk.top.bottom.equalToSuperview()
             mk.right.equalTo(-10)
             mk.width.equalTo(40)
        }
        
        //item
        for (i, item) in items.enumerated() {
            itemContainer.addSubview(item)
            item.snp.makeConstraints({ (mk) in
                mk.top.bottom.equalToSuperview()
                mk.width.height.equalTo(40)
                mk.left.equalTo(i * 40 + 10)
            })
        }
        itemContainer.contentSize = CGSize(width: CGFloat(items.count * 40 + 20), height: 0.1)
        onThemeChange()
    }
    
    @objc func onCloseKeyBoardItemTap() {
        UIApplication.shared.keyWindow?.endEditing(true)
    }
    
    func onThemeChange() {
        backgroundColor = ELEdtiorConfiguration.backgroundColor()
        layer.borderColor = ELEdtiorConfiguration.borderColor().cgColor
        closeKeyBoardButton.tintColor = ELEdtiorConfiguration.tintColor()
        items.forEach { (item) in
            item.tintColor = closeKeyBoardButton.tintColor
        }
    }
}

