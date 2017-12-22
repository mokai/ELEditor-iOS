//MARK: - 飞地编辑器对象
var Enclave = {};
Enclave.margin = 25;
Enclave.defaultCallbackSeparator = '~';
Enclave.defaultHtml = "<p><br></p>";

//使用平台
Enclave.isiOS = true;
Enclave.isAndroid = false;

Enclave.isDebug = false;

// 交互原生
Enclave.bridge;

// 组件对象
Enclave.cover;
Enclave.title;
Enclave.content;

Enclave.preSpanHeight = 0;
Enclave.currentSelection = {
    'startContainer': 0,
    'startOffset': 0,
    'endContainer':  0,
    'endOffset': 0
};

/*
 初始化
 */
Enclave.init = function(bridge) {
    this.bridge = bridge;
    
    //组件
    this.cover = new ELCover($('#cover'));
    this.title = new ELField($('#title'));
    this.content = new ELField($('#content'));
    
    this.title.setPlaceholder("标题");
    this.content.setPlaceholder("正文");
    
    var self = this;
    this.title.wrappedObject.bind('keydown', function(e) {
                                  if (e.keyCode == '13') {
                                  self.content.focus();
                                  e.preventDefault();
                                  }
                                  });
    
    document.execCommand('defaultParagraphSeparator', false, 'p');
    this.domLoadedCallback();
}

Enclave.callback = function(callbackScheme, callbackPath) {
    var callbackObject = null;
    if(Enclave.isiOS) {
        callbackObject = this.bridge;
    }
    else if(Enclave.isAndroid) {
        if (nativeState.androidApiLevel < 17) {
            callbackObject = this.bridge;
        } else {
            callbackObject = EnclaveNative;
        }
    }
    callbackObject.callback(callbackScheme, callbackPath);
}

Enclave.log = function(msg) {
    var logObject = null;
    if(Enclave.isiOS) {
        logObject = this.bridge;
    }
    else if(Enclave.isAndroid) {
        logObject = console;
    }
    logObject.log(msg);
}

Enclave.domLoadedCallback = function() {
    this.callback("callback-dom-loaded");
}

// MARK: - Selection
document.addEventListener('selectionchange', function(e) {
                          if (Enclave.isFocus()) {
                          Enclave.backupRange();
                          }
                          //Enclave.onContentChanged(e);
                          if(Enclave.isiOS) {
                          if ((window.getSelection().toString().length <= 0 && Enclave.isFocus())){
                          Enclave.calculateEditorHeightWithCaretPosition();
                          }
                          }
                          })

// 将编辑框滚动到正确的位置
Enclave.calculateEditorHeightWithCaretPosition = function() {
    var currentSelectionY = this.getCaretYPosition();
    var scrollOffsetY = window.document.body.scrollTop;
    var containerHeight = document.documentElement.clientHeight;
    var newPosotion = window.pageYOffset;
    if (currentSelectionY - this.preSpanHeight < scrollOffsetY) {
        // 这里滚到光标头部位置
        // 光标所在位置被滚动到顶部
        newPosotion = currentSelectionY - this.preSpanHeight;
    } else if (currentSelectionY >= (scrollOffsetY + containerHeight)) {
        // 光标位置在界面下面看不到
        // 这里滚到光标底部位置
        newPosotion = currentSelectionY - containerHeight;
    }
    window.scrollTo(0, newPosotion);
}

// 获取当前光标的位置
Enclave.getCaretYPosition = function() {
    if (this.isFocus()) {
        var selection = window.getSelection();
        
        var baseNode = selection.baseNode;
        var baseOffset = selection.baseOffset;
        var charRange = null;
        if (baseNode.nodeType == Node.TEXT_NODE) {//如果是文本node，直接使用前面一个字符的位置就好了（换行所在位置也不会有问题，避免insert remove带来的性能损耗）
            charRange = document.createRange();
            var newBaseOff = baseOffset - 1
            if (newBaseOff < 0) {
                newBaseOff = 0;
            }
            charRange.setStart(baseNode, newBaseOff);
            charRange.setEnd(baseNode, baseOffset);
            var position = this.getCoords(charRange);
            this.preSpanHeight = position.height == 0 ? this.preSpanHeight : position.height;
            var topPosition = position.top + this.preSpanHeight;
            return topPosition;
        }
        if(window.getSelection().rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            if(this.currentSelection.startContainer == 0 || this.currentSelection.endContainer == 0){
                range.setStart(this.currentFocusField, this.currentSelection.startOffset);
                range.setEnd(this.currentFocusField, this.currentSelection.endOffset);
            } else {
                range.setStart(this.currentSelection.startContainer, this.currentSelection.startOffset);
                range.setEnd(this.currentSelection.endContainer, this.currentSelection.endOffset);
            }
        }
        
    } else {
        var selection = this.currentSelection;
        var range = document.createRange();
        if((this.currentSelection.startContainer == 0) || (this.currentSelection.endContainer == 0)){
            range.setStart(this.currentFocusField, 0);
            range.setEnd(this.currentFocusField, 0);
        } else {
            range.setStart(this.currentSelection.startContainer, this.currentSelection.startOffset);
            range.setEnd(this.currentSelection.endContainer, this.currentSelection.endOffset);
        }
    }
    var spanNode = document.createElement('span');
    spanNode.innerHTML = '<br>';
    spanNode.style.cssText = 'display: inline-block;';
    // collapse的意思是位到这个range的头部还是尾部，如果参数是true则定位到头部，如果是false则定位到尾部
    range.collapse(false);
    range.insertNode(spanNode);
    // 插入一个临时的标签然后计算这个标签的位置，就是光标的位置。操作完之后再把这个标签remove掉
    var position = this.getCoords(spanNode);
    this.preSpanHeight = position.height == 0 ? this.preSpanHeight : position.height;
    var topPosition = position.top + this.preSpanHeight;
    spanNode.parentNode.removeChild(spanNode);
    return topPosition;
}


Enclave.getCoords = function(elem) {
    var box = elem.getBoundingClientRect();
    
    var body = document.body;
    var docEl = document.documentElement;
    
    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    
    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;
    
    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    
    return {
    top: Math.round(top),
    left: Math.round(left),
    height: box.height,
    width: box.width
    };
}


Enclave.isFocus = function() {
    return this.content.isFocus() || this.title.isFocus()
}

Enclave.currentFocusField = function() {
    if (this.content.isFocus()) {
        return this.content;
    }
    else if (this.title.isFocus()) {
        return this.title;
    } else {
        return null;
    }
}

Enclave.backupRange = function() {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        this.currentSelection = {
            'startContainer': range.startContainer,
            'startOffset': range.startOffset,
            'endContainer': range.endContainer,
            'endOffset': range.endOffset
        };
    }
}

Enclave.restoreRange = function() {
    var selection = window.getSelection();
    selection.removeAllRanges();
    var range = document.createRange();
    range.setStart(this.currentSelection.startContainer, this.currentSelection.startOffset);
    range.setEnd(this.currentSelection.endContainer, this.currentSelection.endOffset);
    selection.addRange(range);
}

// 生成空段落
Enclave.generateEmptyPara = function(){
    var emptyPara = document.createElement('p');
    emptyPara.innerHTML = '<br>';
    return emptyPara;
}

// MARK: - 夜间模式

//切换到夜间模式
Enclave.switchToNightMode = function() {
    document.querySelector('html').classList.add('night-mode')
}

//切换到白天模式
Enclave.switchToLightMode = function() {
    document.querySelector('html').classList.remove('night-mode')
}


// MARK: - 字段对象
function ELField(wrappedObject) {
    this.wrappedObject = wrappedObject;
    this.hasNoStyle = typeof(wrappedObject.attr("noStyle")) != "undefined";
    this.id = wrappedObject.attr('id');
    this.lastHtml = ""
    
    //设置默认的html元素
    if (!this.hasNoStyle) {
        this.setHtml(Enclave.defaultHtml);
    }
    this.bindEventListeners();
}

ELField.prototype.callbackId = function() {
    return 'id=' + this.id;
}

ELField.prototype.wrappedDomNode = function() {
    return this.wrappedObject[0];
}

ELField.prototype.bindEventListeners = function() {
    var self = this;
    this.wrappedObject.bind('input', function(e) {
                            self.onInput(e);
                            });
    this.wrappedObject.bind('paste', function(e) {
                            self.onPaste(e);
                            });
}

ELField.prototype.onPaste = function(e) {
    e.preventDefault();
    var clipboardData = (e.originalEvent || e).clipboardData;
    
    // If you copy a link from Safari using the share sheet, it's not
    // available as plain text, only as a URL. So let's first check for
    // URLs, then plain text.
    // Fixes https://github.com/wordpress-mobile/WordPress-Editor-iOS/issues/713
    var url = clipboardData.getData('text/uri-list');
    var plainText = clipboardData.getData('text/plain');
    
    if (url.length > 0) {
        document.execCommand('insertText', false, url);
    } else if (plainText.length > 0) {
        document.execCommand('insertText', false, plainText);
    } else {
        //TODO: insert image
        //Enclave.callback("callback-paste");
    }
}

ELField.prototype.onInput = function(e) {
    if (!this.hasNoStyle) {
        if (this.isEmpty()) {
            this.setHeading('p');
        } else {
            //iOS下中文联想会产生跳跃，所以在编辑器最末尾补一个空行
            if(Enclave.isiOS) {
                if (this.wrappedDomNode().lastChild) {
                    var lastChild = this.wrappedDomNode().lastChild;
                    if (lastChild.tagName && (lastChild.tagName.toLowerCase() == 'p')
                        && (lastChild.innerHTML == '<br />'
                            || lastChild.innerHTML == '<br/>'
                            || lastChild.innerHTML == '<br>'
                            || lastChild.innerHTML.length == 0)) {
                        } else {
                            var newEmptyLine = Enclave.generateEmptyPara();
                            this.wrappedDomNode().appendChild(newEmptyLine);
                        }
                }
            }
        }
    }
    
    //字段内容改变回调
    if(this.getHtml() != this.lastHtml) {
        this.lastHtml = this.getHtml();
        var joinedArguments = this.callbackId();
        //Android直接回调更改内容
        if(Enclave.isAndroid) {
            var valueArgument = "value=" + this.lastHtml;
            joinedArguments = joinedArguments + Enclave.defaultCallbackSeparator +
            valueArgument;
        }
        Enclave.callback('callback-field-valuechange', joinedArguments);
    }
    this.refreshPlaceholder();
}


ELField.prototype.setHeading = function(heading) {
    this.focus();
    var formatTag = heading;
    var formatBlock = document.queryCommandValue('formatBlock');
    if (formatBlock != formatTag) {
        document.execCommand('formatBlock', false, '<' + formatTag + '>');
    }
}


// MARK: - Focus

ELField.prototype.isFocus = function() {
    return this.wrappedObject.is(':focus');
}

ELField.prototype.focus = function() {
    if (!this.isFocus()) {
        this.wrappedObject.focus();
    }
}

ELField.prototype.blur = function() {
    if (this.isFocus()) {
        this.wrappedObject.blur();
    }
}

// MARK: - Content
ELField.prototype.getText = function() {
    return this.wrappedObject.text();
}

ELField.prototype.setText = function(text) {
    this.wrappedObject.text(text);
    this.refreshPlaceholder();
}

ELField.prototype.getHtml = function() {
    var html = this.wrappedObject.html();
    //替换&nbsp;成空格
    html = html.replace(/&nbsp;/, " ");
    
    return html;
}

ELField.prototype.getHtmlForCallback = function() {
    var value = this.getHtml();
    // URI Encode HTML on API < 17 because of the use of WebViewClient.shouldOverrideUrlLoading. Data must
    // be decoded in shouldOverrideUrlLoading.
    if (nativeState.androidApiLevel < 17) {
        value = encodeURIComponent(value);
    }
    var valueArgument = "value=" + value;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-getvalue', joinedArguments);
}


ELField.prototype.setHtml = function(html) {
    if (this.hasNoStyle) {
        this.setText(html);
    } else {
        this.wrappedObject.html(html);
        this.refreshPlaceholder();
    }
}

ELField.prototype.isEmpty = function() {
    if (!this.hasNoStyle) {
        var html = this.getHtml();
        if(html.indexOf('<img') !== -1) {
            return false;
        }
    }
    
    var text = this.getText();
    if(typeof(text) == 'undefined') {
        return true;
    }
    return text.length == 0;
}

// Placeholder
ELField.prototype.setPlaceholder = function(placeholder) {
    this.wrappedObject.attr('placeholder', placeholder);
    this.refreshPlaceholder();
}

ELField.prototype.refreshPlaceholder = function() {
    //当前字段有样式，且不为默认html时
    //不为空时
    if(!this.hasNoStyle && this.lastHtml != Enclave.defaultHtml || !this.isEmpty()) {
        this.wrappedObject.removeClass('placeholder');
    } else {
        this.wrappedObject.addClass('placeholder');
    }
}


// MARK: - 封面图对象
function ELCover(wrappedObject) {
    this.wrappedObject = wrappedObject;
    this.wrappedIconObject = wrappedObject.children('div');
    this.wrappedImageObject = wrappedObject.children('img');
    this.id = wrappedObject.attr('id');
    
    //事件
    var self = this;
    this.wrappedObject.on('click', function(e) {
                          self.onclick();
                          });
    this.wrappedImageObject.on('load', function(e) {
                               self.onload();
                               });
    
    this.clearCover();
    //设置icon的宽度
    var width = this.wrappedObject.css('width');
    this.wrappedIconObject.css('width', width);
}

ELCover.prototype.callbackId = function() {
    return 'id=' + this.id;
}

// 清除封面图
ELCover.prototype.clearCover = function() {
    this.wrappedObject.css('height', '1.6rem');
    this.wrappedImageObject.attr('src', '');
    this.wrappedImageObject.hide();
    this.wrappedIconObject.show();
}

// 设置封面图
ELCover.prototype.updateCover = function(url) {
    if(url == undefined || url == '') {
        this.clearCover();
        return;
    }
    this.wrappedObject.css('height', '3.86rem');
    this.wrappedImageObject.attr('src', url);
    this.wrappedImageObject.show();
    this.wrappedIconObject.hide();
}

// 获取封面图url
ELCover.prototype.getCover = function() {
    var url = "";
    if(this.wrappedImageObject != undefined && this.wrappedImageObject.length > 0){
        url = this.wrappedImageObject.attr('src');
    }
    return url;
}

ELCover.prototype.getCoverForCallback = function() {
    var value = this.getCover();
    // URI Encode HTML on API < 17 because of the use of WebViewClient.shouldOverrideUrlLoading. Data must
    // be decoded in shouldOverrideUrlLoading.
    if (nativeState.androidApiLevel < 17) {
        value = encodeURIComponent(value);
    }
    var valueArgument = "value=" + value;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-getvalue', joinedArguments);
}

//封面图加载成功，垂直居中处理
ELCover.prototype.onload = function() {
    var imgHeight = this.wrappedImageObject.height();
    var containerHeight = this.wrappedObject.height();
    if (imgHeight > containerHeight) { //大于控件本身才设置
        this.wrappedImageObject.css('margin-top', -(imgHeight - containerHeight) / 2 + 'px');
    } else {
        this.wrappedImageObject.css('margin-top', '0px');
    }
}

// 封面图点击事件
ELCover.prototype.onclick = function() {
    var url = this.getCover();
    var arguments = ['url=' + encodeURIComponent(url)];
    var joinedArguments = arguments.join(Enclave.defaultCallbackSeparator);
    Enclave.callback('callback-cover-tap', joinedArguments);
}



//MARK: Start
Enclave.init(new EnclaveBridge());

