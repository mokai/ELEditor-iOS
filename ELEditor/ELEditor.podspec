Pod::Spec.new do |s|
  s.name         = "ELEditor"
  s.version      = "0.1"
  s.summary      = "Enclave Editor For iOS"
  s.homepage     = "https://www.enclavebooks.cn"
  s.license      = { :type => "MIT", :file => "../LICENSE" }
  s.author       = { "kk" => "kk@enclavelit.com" }
  s.source       = { :git => "https://github.com/mokai/ELEditor-iOS.git", :tag => s.version }
  s.platform     = :ios, '8.0'
  s.source_files = 'Classes'
  s.resources    = ["Assets/*.png", "Assets/*.html", "Assets/*.js", "Assets/*.svg", "Assets/*.css", "Assets/*.storyboard", "Assets/*.xib"]
  s.exclude_files = 'Classes/exclude'
  s.requires_arc = true
  s.frameworks   = "UIKit", "JavaScriptCore"

  s.dependency "SnapKit" , "~> 4.0.0"
end