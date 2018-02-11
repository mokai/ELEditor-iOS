//MARK: - 飞地编辑器对象
var Enclave = {};
Enclave.margin = 25;
Enclave.defaultCallbackSeparator = '~';
Enclave.defaultHTML = "<p><br></p>";

//使用平台
Enclave.isiOS = native.platform == "iOS";
Enclave.isAndroid = native.platform == "Android";

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
Enclave.isEditingSelection = false

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
                                  if (e.keyCode == 13) {
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
        if (native.androidApiLevel < 17) {
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
    var scrollOffsetY = window.document.body.scrollTop;
    var containerHeight = native.contentHeight * window.devicePixelRatio; //iOS原生传过来的是pt
    var currentSelectionY = this.getCaretYPosition();
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
// 获取当前光标的位置
Enclave.getCaretYPosition = function() {
    if (this.isFocus()) {
        var selection = window.getSelection();
        
        var baseNode = selection.baseNode;
        var baseOffset = selection.baseOffset;
        var charRange = null;
        if (baseNode != null && baseNode.nodeType == Node.TEXT_NODE) {//如果是文本node，直接使用前面一个字符的位置就好了（换行所在位置也不会有问题，避免insert remove带来的性能损耗）
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
    if (this.currentSelection.startContainer == 0) {
        return
    }
    var selection = window.getSelection();
    selection.removeAllRanges();
    var range = document.createRange();
    range.setStart(this.currentSelection.startContainer, this.currentSelection.startOffset);
    range.setEnd(this.currentSelection.endContainer, this.currentSelection.endOffset);
    selection.addRange(range);
}


// MARK: - Utily
// 生成空段落
Enclave.generateEmptyPara = function(){
    var template = document.createElement('template');
    template.innerHTML = this.defaultHTML;
    return template.content.firstChild;
}

//获取最外层的P标签
Enclave.getParentPara = function(node) {
    var currentNode = node;
    while(currentNode != null && currentNode.nodeName.toLowerCase() != 'p') {
        currentNode = currentNode.parentNode;
    }
    return currentNode;
}

// 获取range最外层的前一个P标签，当range不为P标签的第一个sub node时返回range当前node，当无前一个P标签时返回null
Enclave.getParentRreviousSiblingPara = function(range) {
    var currentNode = range.startContainer;
    if (range.startOffset > 0) {
        return currentNode;
    }
    while(true || currentNode == null) {
        if (currentNode.nodeName.toLowerCase() == 'p') {
            var previousSibling = currentNode.previousSibling;
            return previousSibling != null && previousSibling.nodeName.toLowerCase() == 'p' ? previousSibling : null;
        }
        else if (currentNode.previousSibling != null) {
            return range.startContainer;
        }
        currentNode = currentNode.parentNode;
    }
    return null;
}

//插入
Enclave.insertAfter = function(newElement,targetElement){
    if(targetElement.parentNode){
        var parent = targetElement.parentNode;
        if(targetElement.nextSibling){
            parent.insertBefore(newElement, targetElement.nextSibling);
        }else{
            parent.appendChild(newElement);
        }
    }
}

Enclave.isSpecifiedTag = function(node, tagName) {
    if (!node) {
        return false;
    }
    if (tagName instanceof Array) {
        return tagName.indexOf(node.nodeName.toLowerCase()) < 0 ? false : true;
    }
    return node.nodeName.toLowerCase() == tagName;
}


Enclave.isInTag = function(node, targetTagName) {
    // 判断光标是否在指定标签内并返回相应的node
    var result = null;
    if (typeof(node) == 'undefined') {
        return result;
    }
    if(targetTagName instanceof Array){
        for(var i = 0; i<targetTagName.length; i++){
            var tagName = targetTagName[i];
            result = checkIf(node, tagName);
            if(result){
                break;
            }
        }
    }else{
        var result = checkIf(node, targetTagName);
    }
    return result;
    function checkIf(node, targetTagName){
        if (Enclave.isSpecifiedTag(node, targetTagName)) {
            // 坑：
            // 要从自己开始匹配，不能直接从parentElement开始匹配。
            // 例如当点击引用的时候，没输入内容之前取消引用，这个时候无法取消引用，因为传进来的note和targetTagName一样
            return {
                'is': true,
                'tagNode': node
            }
        } else {
            var p = node.parentNode;
            while (p && (!Enclave.isSpecifiedTag(p, targetTagName) && !Enclave.isSpecifiedTag(p, 'body'))) {
                p = p.parentElement
            }
            if (Enclave.isSpecifiedTag(p, targetTagName)) {
                return {
                    'is': true,
                    'tagNode': p
                }
            } else {
                return false;
            }
        }
    }
};

Enclave.playRecord = function(url) {
    var audio = new Audio(url)
    audio.play()
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
    this.lastHTML = ""
    
    //设置默认的html元素
    if (!this.hasNoStyle) {
        this.setHTML(Enclave.defaultHTML);
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
    this.wrappedObject.bind('tap', function(e) {
                            self.onTap(e);
                            });
    this.wrappedObject.bind('input', function(e) {
                            self.onInput(e);
                            });
    this.wrappedObject.bind('paste', function(e) {
                            self.onPaste(e);
                            });
    if (!this.hasNoStyle) {
        this.wrappedObject.bind('keydown', function(e) {
                                self.onKeydown(e);
                                });
    }
    this.wrappedObject.bind('focus', function(e) {
                            self.onFocus(e);
                            });
}

ELField.prototype.onFocus = function(e) {
    var joinedArguments = this.callbackId()
    Enclave.callback('callback-field-focus', joinedArguments);
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

ELField.prototype.onTap = function(e) {
    if (this.hasNoStyle) {
        return;
    }
    
    //组件点击选择
    var parentPara = Enclave.getParentPara(event.target);
    if (parentPara != null && parentPara.getAttribute('class') != null) {
        var target = event.target;
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(parentPara);
        selection.removeAllRanges();
        selection.addRange(range);
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
    if(this.getHTML() != this.lastHTML) {
        this.lastHTML = this.getHTML();
        var joinedArguments = this.callbackId();
        //Android直接回调更改内容
        if(Enclave.isAndroid) {
            var valueArgument = "value=" + this.lastHTML;
            joinedArguments = joinedArguments + Enclave.defaultCallbackSeparator +
            valueArgument;
        }
        Enclave.callback('callback-field-valuechange', joinedArguments);
    }
    
    this.refreshPlaceholder();
}


ELField.prototype.onKeydown = function(e) {
    //选区适配
    //1、删除键在组件容器的nextSibling中时，且一次删除键就会进入组件容器Range。则selectNodeContents 组件容器
    //2、删除键在组件容器中时，如果parentRreviousSibling为null时则removeAttribute class，否则删除整个组件容器node，且将range移动至parentRreviousSibling.end
    
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        if (e.keyCode == 8) {
            var range = getSelection().getRangeAt(0);
            var startContainer = range.startContainer;
            
            var parentPreviousSibling = Enclave.getParentRreviousSiblingPara(range);
            if (startContainer.nodeName.toLowerCase() == 'p'
                && startContainer.getAttribute('class') != null) {
                if (parentPreviousSibling == null) {
                    while(startContainer.attributes.length > 0)
                        startContainer.removeAttribute(startContainer.attributes[0].name);
                } else {
                    startContainer.remove();
                    var range = document.createRange();
                    range.selectNodeContents(parentPreviousSibling);
                    if (parentPreviousSibling.getAttribute('class') == null) {
                        range.collapse();
                    }
                    selection.removeAllRanges();
                    selection.addRange(range);
                    e.preventDefault();
                }
            }
            else if (parentPreviousSibling != null
                     && parentPreviousSibling.getAttribute('class') != null) {
                var range = document.createRange();
                range.selectNodeContents(parentPreviousSibling);
                selection.removeAllRanges();
                selection.addRange(range);
                e.preventDefault();
            }
            else if (parentPreviousSibling == null) {
                e.preventDefault();
            }
        }
    }
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
    return document.activeElement === this.wrappedDomNode();
}

ELField.prototype.focus = function() {
    if (this.isFocus()) {
        return;
    }
    this.wrappedObject.focus();
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

ELField.prototype.getHTML = function() {
    var html = this.wrappedObject.html();
    //替换&nbsp;成空格
    html = html.replace(/&nbsp;/, " ");
    
    if(Enclave.isiOS) {
        //清除编辑器最末尾补的一个空行
        html = html.replace(new RegExp(Enclave.defaultHTML + '$'), '')
    }
    return html;
}

ELField.prototype.getHTMLForCallback = function() {
    var value = this.getHTML();
    // URI Encode HTML on API < 17 because of the use of WebViewClient.shouldOverrideUrlLoading. Data must
    // be decoded in shouldOverrideUrlLoading.
    if (native.androidApiLevel < 17) {
        value = encodeURIComponent(value);
    }
    var valueArgument = "value=" + value;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-getvalue', joinedArguments);
}


ELField.prototype.setHTML = function(html) {
    this.lastHTML = html;
    if (this.hasNoStyle) {
        this.setText(html);
    } else {
        this.wrappedObject.html(html);
        this.refreshPlaceholder();
    }
}

ELField.prototype.isEmpty = function() {
    if (!this.hasNoStyle) {
        var html = this.getHTML();
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
    if(!this.hasNoStyle && this.lastHTML != Enclave.defaultHTML || !this.isEmpty()) {
        this.wrappedObject.removeClass('placeholder');
    } else {
        this.wrappedObject.addClass('placeholder');
    }
}

//插入html
ELField.prototype.insertHTML = function(html) {
    document.execCommand('insertHTML', false, html);
}

//插入图片
ELField.prototype.insertImage = function(img) {
    function generateSpaceNode(){
        var n = document.createTextNode('\u200D');
        return n;
    }
    function generateLineBreakNode(){
        var n = document.createElement('br');
        return n;
    }
    function findImageNextSibling(imgItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = imgItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.el_img').nextSibling;
        return target;
    }
    function findImagePrevSibling(imgItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = imgItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.el_img').previousSibling;
        return target;
    }
    function resetImageParentNodeHTML(imgItem){
        var pnode = imgItem.parentNode,
        tempDom = document.createElement('div');
        tempDom.innerHTML = pnode.innerHTML;
        pnode.innerHTML = tempDom.innerHTML;
    }
    var imgItem = document.createElement('p')
    imgItem.setAttribute('data-id', img);
    imgItem.className = "img-container"
    imgItem.innerHTML = '<img src="'+img+'" class="el_img"/>';
    
    var self = this;
    function _inner() {
        Enclave.restoreRange();
        var selection = window.getSelection(),
        range;
        
        if (window.getSelection().rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            if(Enclave.currentSelection.startContainer == 0 || Enclave.currentSelection.endContainer == 0){
                range.setStart(Enclave.content.wrappedDomNode(), Enclave.currentSelection.startOffset);
                range.setEnd(Enclave.content.wrappedDomNode(), Enclave.currentSelection.endOffset);
            }else{
                range.setStart(Enclave.currentSelection.startContainer, Enclave.currentSelection.startOffset);
                range.setEnd(Enclave.currentSelection.endContainer, Enclave.currentSelection.endOffset);
            }
        }
        var rangeNode = range.endContainer; // 光标所在的node
        
        if (Enclave.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote'])){
            // 列表和引用内不插书籍,/把书籍看成一个独立的段落处理
            var inTagNode = Enclave.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote']).tagNode;
            imgItem.removeAttribute('data-id');
            if (inTagNode.textContent.length == 0) {
                // 如果当前block没有文本，则把block删掉
                inTagNode.parentNode.insertBefore(imgItem, inTagNode);
                if (imgItem.previousSibling.getAttribute('contenteditable') == 'false') {
                    imgItem.parentNode.insertBefore(generateSpaceNode(), imgItem);
                }
                inTagNode.remove();
            } else {
                Enclave.insertAfter(imgItem, inTagNode);
            }
            if (imgItem.nextSibling) {
                range.selectNodeContents(imgItem.nextSibling);
                range.collapse();
            } else {
                var newEmptyLine = Enclave.generateEmptyPara();
                Enclave.insertAfter(newEmptyLine, imgItem);
                range.selectNodeContents(newEmptyLine);
                range.collapse(false);
            }
        }else{
            // 在第一行或者在一个p里，这里把图片和图片前后的node包个p
            range.collapse(false);
            range.insertNode(imgItem);
            var flagId = imgItem.getAttribute('data-id'),
            imgItemParentNode = imgItem.parentNode;
            resetImageParentNodeHTML(imgItem);
            var theImgItem = imgItemParentNode.querySelector('[data-id="'+flagId+'"]'),
            theImgItemPreviousSibling = null || theImgItem.previousSibling,
            theImgItemNextSibling = null || theImgItem.nextSibling;
            theImgItem.removeAttribute('data-id');
            if(imgItemParentNode == Enclave.content.wrappedDomNode()){
                // 这是在第一行没被p包住的情况
                // 图片前面包一个p
                if(theImgItemPreviousSibling){
                    if((theImgItemPreviousSibling.nodeType == 3 ) || (theImgItemPreviousSibling.nodeType == 1 && theImgItemPreviousSibling.tagName.toLowerCase() == "br")){
                        var newPreviousPara = document.createElement('p');
                        range.selectNodeContents(theImgItemPreviousSibling);
                        range.surroundContents(newPreviousPara);
                    }
                }
                // 图片后面包一个p
                if(theImgItemNextSibling){
                    if((theImgItemNextSibling.nodeType == 3 ) || (theImgItemNextSibling.nodeType == 1 && theImgItemNextSibling.tagName.toLowerCase() == "br")){
                        var newNextPara = document.createElement('p');
                        range.selectNodeContents(theImgItemNextSibling);
                        range.surroundContents(newNextPara);
                        range.selectNodeContents(newNextPara);
                    }else{
                        range.selectNodeContents(theImgItemNextSibling);
                        range.collapse();
                    }
                }else{
                    var emptyLine = Enclave.generateEmptyPara();
                    Enclave.insertAfter(emptyLine, theImgItem);
                    range.selectNodeContents(emptyLine);
                    range.collapse(false);
                }
            }else{
                // 这是在一个段落里面的
                // 先把图片挪到parent外面
                Enclave.insertAfter(theImgItem, imgItemParentNode);
                // 如果原来有nextSibling，则把图片原来的nextSibling包一个p并插到图片后面
                if(theImgItemNextSibling && !(theImgItemNextSibling.nodeType == 1 && theImgItemNextSibling.tagName.toLowerCase() == "br")){
                    var newNextPara;
                    if((theImgItemNextSibling.nodeType == 3) || (theImgItemNextSibling.nodeType == 1 && theImgItemNextSibling.tagName.toLowerCase() == "br")){
                        newNextPara = document.createElement('p');
                        range.selectNodeContents(theImgItemNextSibling);
                        range.surroundContents(newNextPara);
                    }else{
                        newNextPara = theImgItemNextSibling;
                    }
                    Enclave.insertAfter(newNextPara, theImgItem);
                }
                if((imgItemParentNode.childNodes.length == 0) || (imgItemParentNode.innerHTML == '<br>') || (imgItemParentNode.innerText == '')){
                    // 书和next移除出来后parent空了，移除掉
                    imgItemParentNode.parentNode.removeChild(imgItemParentNode);
                }
                if(theImgItem.nextSibling){
                    // 处理完之后重新那img的next并做相应处理
                    range.selectNodeContents(theImgItem.nextSibling);
                }else{
                    var newEmptyLine = Enclave.generateEmptyPara();
                    Enclave.insertAfter(newEmptyLine, theImgItem);
                    range.selectNodeContents(newEmptyLine);
                }
            }
        }
        
        
        Enclave.backupRange();
        selection.removeAllRanges();
        selection.addRange(range);
        selection.collapseToStart();
        
        self.refreshPlaceholder();
        setTimeout(function(){
                   Enclave.calculateEditorHeightWithCaretPosition();
                   },50);
    }
    //适配iOS
    if (Enclave.isiOS) {
        // hack for timing
        setTimeout(function(){
                   _inner();
                   }, 30);
    } else {
        _inner();
    }
}

//插入录音
ELField.prototype.insertRecord = function(url, duration) {
    function generateSpaceNode(){
        var n = document.createTextNode('\u200D');
        return n;
    }
    function generateLineBreakNode(){
        var n = document.createElement('br');
        return n;
    }
    // 下面两个找前后节点的方法之所以这样实现是因为
    // ios里当光标在一个文字node上移动时会把它切割，例如
    // 一个文字node：ABCDE，当光标从E后面往左移，会把它分割成
    // ABCD,E
    // ABC,D,E
    // AB,C,D,E
    // A,B,C,D,E
    // 这样如果我在ABCDE前面插入img，img的nextSibling有可能只拿到A而拿不到整个文字node，不符合预期
    function findRecordNextSibling(recordItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = recordItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.record-container').nextSibling;
        return target;
    }
    function findRecordPrevSibling(recordItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = recordItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.record-container').previousSibling;
        return target;
    }
    function resetRecordItemParentNodeHtml(recordItem){
        var pnode = recordItem.parentNode,
        tempDom = document.createElement('div');
        tempDom.innerHTML = pnode.innerHTML;
        pnode.innerHTML = tempDom.innerHTML;
    }
    
    var recordItem = document.createElement('p');
    recordItem.className = 'record-container';
    recordItem.setAttribute('contenteditable', false);
    recordItem.setAttribute('data-id', url);
    recordItem.setAttribute('data-url', url);
    recordItem.innerHTML = "<img class='record-play' src='record_play.png' onclick='Enclave.content.onPlayRecord(event)' >"
    +"<span class='record-duration'>"+duration+"</span>"
    +"<img class='record-delete' src='record_delete.png' onclick='Enclave.content.onDeleteRecord(event)'>";
    
    var self = this;
    function _inner() {
        var selection = window.getSelection(),
        range;
        
        if (window.getSelection().rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            if(Enclave.currentSelection.startContainer == 0 || Enclave.currentSelection.endContainer == 0){
                range.setStart(Enclave.content.wrappedDomNode(), Enclave.currentSelection.startOffset);
                range.setEnd(Enclave.content.wrappedDomNode(), Enclave.currentSelection.endOffset);
            }else{
                range.setStart(Enclave.currentSelection.startContainer, Enclave.currentSelection.startOffset);
                range.setEnd(Enclave.currentSelection.endContainer, Enclave.currentSelection.endOffset);
            }
        }
        var rangeNode = range.endContainer; // 光标所在的node
        
        if (Enclave.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote'])){
            // 列表和引用内不插书籍,把书籍看成一个独立的段落处理
            var inTagNode = Enclave.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote']).tagNode;
            recordItem.removeAttribute('data-id');
            if (inTagNode.textContent.length == 0) {
                // 如果当前block没有文本，则把block删掉
                inTagNode.parentNode.insertBefore(recordItem, inTagNode);
                if (recordItem.previousSibling.getAttribute('contenteditable') == 'false') {
                    recordItem.parentNode.insertBefore(generateSpaceNode(), recordItem);
                }
                inTagNode.remove();
            } else {
                Enclave.insertAfter(recordItem, inTagNode);
            }
            if (recordItem.nextSibling) {
                range.selectNodeContents(recordItem.nextSibling);
                range.collapse();
            } else {
                var newEmptyLine = Enclave.generateEmptyPara();
                Enclave.insertAfter(newEmptyLine, recordItem);
                range.selectNodeContents(newEmptyLine);
                range.collapse(false);
            }
        }else{
            // 在第一行或者在一个p里，这里把图片和图片前后的node包个p
            range.collapse(false);
            range.insertNode(recordItem);
            var flagId = recordItem.getAttribute('data-id'),
            recordItemParentNode = recordItem.parentNode;
            resetRecordItemParentNodeHtml(recordItem);
            var theRecordItem = recordItemParentNode.querySelector('[data-id="'+flagId+'"]'),
            theRecordItemPreviousSibling = null || theRecordItem.previousSibling,
            theRecordItemNextSibling = null || theRecordItem.nextSibling;
            theRecordItem.removeAttribute('data-id');
            if(recordItemParentNode == Enclave.content.wrappedDomNode()){
                // 这是在第一行没被p包住的情况
                // 图片前面包一个p
                if(theRecordItemPreviousSibling){
                    if((theRecordItemPreviousSibling.nodeType == 3 ) || (theRecordItemPreviousSibling.nodeType == 1 && theRecordItemPreviousSibling.tagName.toLowerCase() == "br")){
                        var newPreviousPara = document.createElement('p');
                        range.selectNodeContents(theRecordItemPreviousSibling);
                        range.surroundContents(newPreviousPara);
                    }
                }else{
                    theRecordItem.parentNode.insertBefore(generateSpaceNode(), theRecordItem);
                }
                // 图片后面包一个p
                if(theRecordItemNextSibling){
                    if((theRecordItemNextSibling.nodeType == 3 ) || (theRecordItemNextSibling.nodeType == 1 && theRecordItemNextSibling.tagName.toLowerCase() == "br")){
                        var newNextPara = document.createElement('p');
                        range.selectNodeContents(theRecordItemNextSibling);
                        range.surroundContents(newNextPara);
                        range.selectNodeContents(newNextPara);
                    }else{
                        range.selectNodeContents(theRecordItemNextSibling);
                        range.collapse();
                    }
                }else{
                    var newEmptyLine = Enclave.generateEmptyPara();
                    Enclave.insertAfter(newEmptyLine, theRecordItem);
                    range.selectNodeContents(newEmptyLine);
                    range.collapse(false);
                }
            }else{
                // 这是在一个段落里面的
                // 先把图片挪到parent外面
                Enclave.insertAfter(theRecordItem, recordItemParentNode);
                // 如果原来有nextSibling，则把图片原来的nextSibling包一个p并插到图片后面
                if(theRecordItemNextSibling && !(theRecordItemNextSibling.nodeType == 1 && theRecordItemNextSibling.tagName.toLowerCase() == "br")){
                    var newNextPara;
                    if((theRecordItemNextSibling.nodeType == 3 ) || (theRecordItemNextSibling.nodeType == 1 && theRecordItemNextSibling.tagName.toLowerCase() == "br")){
                        newNextPara = document.createElement('p');
                        range.selectNodeContents(theRecordItemNextSibling);
                        range.surroundContents(newNextPara);
                    }else{
                        newNextPara = theRecordItemNextSibling;
                    }
                    Enclave.insertAfter(newNextPara, theRecordItem);
                }
                if((recordItemParentNode.childNodes.length == 0) || (recordItemParentNode.innerHTML == '<br>') || (recordItemParentNode.innerText == '')){
                    // 书和next移除出来后parent空了，移除掉
                    recordItemParentNode.parentNode.removeChild(recordItemParentNode);
                }
                if(theRecordItem.nextSibling){
                    range.selectNodeContents(theRecordItem.nextSibling);
                }else{
                    var newEmptyLine = Enclave.generateEmptyPara();
                    Enclave.insertAfter(newEmptyLine, theRecordItem);
                    range.selectNodeContents(newEmptyLine);
                }
                if(!theRecordItem.previousSibling || (theRecordItem.previousSibling.getAttribute('contenteditable') == 'false')){
                    theRecordItem.parentNode.insertBefore(generateSpaceNode(), theRecordItem);
                }
            }
        }
        
        Enclave.backupRange();
        selection.removeAllRanges();
        selection.addRange(range);
        selection.collapseToStart();
        
        //判断placeholder
        self.refreshPlaceholder();
        setTimeout(function(){
                   Enclave.calculateEditorHeightWithCaretPosition();
                   },50);
    }
    //适配iOS
    if (Enclave.isiOS) {
        // hack for timing
        setTimeout(function(){
                   _inner();
                   }, 30);
    } else {
        _inner();
    }
}


ELField.prototype.onDeleteRecord = function(event) {
    if (this.hasNoStyle) {
        return;
    }
    event.stopPropagation();
    var target = event.target;
    var dataURL = target.parentNode.getAttribute('data-url');
    target.parentNode.remove();
    var valueArgument = "value=" + dataURL;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-deleteRecord', joinedArguments);
}

ELField.prototype.onPlayRecord = function(event) {
    console.log('onPlayRecord');
    if (this.hasNoStyle) {
        return;
    }
    event.stopPropagation();
    var target = event.target;
    
    var dataURL = target.parentNode.getAttribute('data-url');
    var valueArgument = "value=" + dataURL;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-playRecord', joinedArguments);
    
    Enclave.playRecord(dataURL);
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
                          self.onClick(e);
                          });
    this.wrappedImageObject.on('load', function(e) {
                               self.onLoad();
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
    if (native.androidApiLevel < 17) {
        value = encodeURIComponent(value);
    }
    var valueArgument = "value=" + value;
    var joinedArguments = this.callbackId() + Enclave.defaultCallbackSeparator +
    valueArgument;
    Enclave.callback('callback-field-getvalue', joinedArguments);
}

//封面图加载成功，垂直居中处理
ELCover.prototype.onLoad = function() {
    var imgHeight = this.wrappedImageObject.height();
    var containerHeight = this.wrappedObject.height();
    if (imgHeight > containerHeight) { //大于控件本身才设置
        this.wrappedImageObject.css('margin-top', -(imgHeight - containerHeight) / 2 + 'px');
    } else {
        this.wrappedImageObject.css('margin-top', '0px');
    }
}

// 封面图点击事件
ELCover.prototype.onClick = function(event) {
    event.preventDefault();
    var url = this.getCover();
    var arguments = ['url=' + encodeURIComponent(url)];
    var joinedArguments = arguments.join(Enclave.defaultCallbackSeparator);
    Enclave.callback('callback-cover-tap', joinedArguments);
}

//MARK: Start
Enclave.init(new EnclaveBridge());
