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
            mk.edges.equalToSuperview()
        }
    }
    
    
}
