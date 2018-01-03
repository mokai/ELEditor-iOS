import UIKit

open class ELEditorViewController: UIViewController {
    
    open private(set) var editorView: ELEditorView!
    
    override open func viewDidLoad() {
        super.viewDidLoad()
        setupEditorView()
    }
    
    fileprivate func setupEditorView() {
        editorView = ELEditorView(frame: self.view.frame)
        view.addSubview(editorView)
        editorView.snp.makeConstraints { (mk) in
            if #available(iOS 11.0, *) {
                mk.edges.equalToSuperview()
            } else {
                mk.left.right.equalToSuperview()
                mk.top.equalTo(self.topLayoutGuide.snp.bottom)
                mk.bottom.equalTo(self.bottomLayoutGuide.snp.top)
            }
        }
    }
}
