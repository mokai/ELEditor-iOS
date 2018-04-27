/**
飞地移动两端编辑器
v0.9 
author kk@encalvelit.com

**/

window.EnclaveEditor = {};

//MARK: - 配置项
EnclaveEditor.nativeContentHeight; //原生


EnclaveEditor.margin = 25;
EnclaveEditor.defaultCallbackSeparator = '~';
EnclaveEditor.defaultHTML = "<p><br></p>";

// 组件对象
EnclaveEditor.cover;
EnclaveEditor.title;
EnclaveEditor.content;

EnclaveEditor.preSpanHeight = 0;
EnclaveEditor.currentSelection = {
    'startContainer': 0,
    'startOffset': 0,
    'endContainer':  0,
    'endOffset': 0
};
EnclaveEditor.isEditingSelection = false;

/*
 初始化
 */
EnclaveEditor.init = function() {
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
    this.callback('onDomLoadedCallback');
}

EnclaveEditor.callback = function(func) {
    if (window.EnclaveBridge) {
        EnclaveBridge['callback'].apply(EnclaveBridge, arguments);
    }
}

EnclaveEditor.log = function(msg) {
    EnclaveBridge.log(msg)
}

// MARK: - Selection
document.addEventListener('selectionchange', function(e) {
        if (EnclaveEditor.isFocus()) {
            EnclaveEditor.backupRange();
        }
        //EnclaveEditor.onContentChanged(e);
        if(EnclaveMobile.isiOS) {
            if ((window.getSelection().toString().length <= 0 && EnclaveEditor.isFocus())){
                EnclaveEditor.calculateEditorHeightWithCaretPosition();
            }
        }
    })

// 将编辑框滚动到正确的位置
EnclaveEditor.calculateEditorHeightWithCaretPosition = function() {
    var scrollOffsetY = window.document.body.scrollTop;
    var containerHeight = document.documentElement.clientHeight;
    //使用原生非像素高度
    if (this.nativeContentHeight) {
        containerHeight = this.nativeContentHeight * window.devicePixelRatio; 
    } 
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
EnclaveEditor.getCaretYPosition = function() {
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


EnclaveEditor.getCoords = function(elem) {
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


EnclaveEditor.isFocus = function() {
    return this.content.isFocus() || this.title.isFocus()
}

EnclaveEditor.currentFocusField = function() {
    if (this.content.isFocus()) {
        return this.content;
    }
    else if (this.title.isFocus()) {
        return this.title;
    } else {
        return null;
    }
}

EnclaveEditor.backupRange = function() {
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

EnclaveEditor.restoreRange = function() {
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
EnclaveEditor.generateEmptyPara = function(){
    var template = document.createElement('template');
    template.innerHTML = this.defaultHTML;
    return template.content.firstChild;
}

//获取最外层的P标签
EnclaveEditor.getParentPara = function(node) {
    var currentNode = node;
    while(currentNode != null && currentNode.nodeName.toLowerCase() != 'p') {
        currentNode = currentNode.parentNode;
    }
    return currentNode;
}

// 获取range最外层的前一个P标签，当range不为P标签的第一个sub node时返回range当前node，当无前一个P标签时返回null
EnclaveEditor.getParentRreviousSiblingPara = function(range) {
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
EnclaveEditor.insertAfter = function(newElement,targetElement){
    if(targetElement.parentNode){
        var parent = targetElement.parentNode;
        if(targetElement.nextSibling){
            parent.insertBefore(newElement, targetElement.nextSibling);
        }else{
            parent.appendChild(newElement);
        }
    }
}

EnclaveEditor.isSpecifiedTag = function(node, tagName) {
    if (!node) {
        return false;
    }
    if (tagName instanceof Array) {
        return tagName.indexOf(node.nodeName.toLowerCase()) < 0 ? false : true;
    }
    return node.nodeName.toLowerCase() == tagName;
}

EnclaveEditor.isInTag = function(node, targetTagName) {
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
        if (EnclaveEditor.isSpecifiedTag(node, targetTagName)) {
            // 坑：
            // 要从自己开始匹配，不能直接从parentElement开始匹配。
            // 例如当点击引用的时候，没输入内容之前取消引用，这个时候无法取消引用，因为传进来的note和targetTagName一样
            return {
                'is': true,
                'tagNode': node
            }
        } else {
            var p = node.parentNode;
            while (p && (!EnclaveEditor.isSpecifiedTag(p, targetTagName) && !EnclaveEditor.isSpecifiedTag(p, 'body'))) {
                p = p.parentElement
            }
            if (EnclaveEditor.isSpecifiedTag(p, targetTagName)) {
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


// MARK: - 夜间模式
//切换到夜间模式
EnclaveEditor.switchToNightMode = function() {
    EnclaveMobile.switchToNightMode();
}

//切换到白天模式
EnclaveEditor.switchToLightMode = function() {
    EnclaveMobile.switchToLightMode();
}

// MARK: - 字段对象
function ELField(wrappedObject) {
    this.wrappedObject = wrappedObject;
    this.hasNoStyle = typeof(wrappedObject.attr("noStyle")) != "undefined";
    this.id = wrappedObject.attr('id');
    this.lastHTML = ""
    
    //设置默认的html元素
    if (!this.hasNoStyle) {
        this.setHTML(EnclaveEditor.defaultHTML);
    }
    this.bindEventListeners();
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
    EnclaveEditor.callback('onFocus', this.id);
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
        //EnclaveEditor.callback("callback-paste");
    }
}

ELField.prototype.onTap = function(e) {
    if (this.hasNoStyle) {
        return;
    }
    
    //组件点击选择
    var parentPara = EnclaveEditor.getParentPara(event.target);
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
            if(EnclaveMobile.isiOS) {
                if (this.wrappedDomNode().lastChild) {
                    var lastChild = this.wrappedDomNode().lastChild;
                    if (lastChild.tagName && (lastChild.tagName.toLowerCase() == 'p')
                        && (lastChild.innerHTML == '<br />'
                            || lastChild.innerHTML == '<br/>'
                            || lastChild.innerHTML == '<br>'
                            || lastChild.innerHTML.length == 0)) {
                        } else {
                            var newEmptyLine = EnclaveEditor.generateEmptyPara();
                            this.wrappedDomNode().appendChild(newEmptyLine);
                        }
                }
            }
        }
    }
    
    this.onValueChange();
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
            
            var parentPreviousSibling = EnclaveEditor.getParentRreviousSiblingPara(range);
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

//字段内容改变
ELField.prototype.onValueChange = function(e) {
    var currentHtml = this.getHTML();
    if(currentHtml != this.lastHTML) {
        this.lastHTML = currentHtml;
        EnclaveEditor.callback('onValueChange', this.id, this.lastHTML);
    }
    this.refreshPlaceholder();
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
    
    if(EnclaveMobile.isiOS) {
        //清除编辑器最末尾补的一个空行
        html = html.replace(new RegExp(EnclaveEditor.defaultHTML + '$'), '')
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
    var joinedArguments = this.callbackId() + EnclaveEditor.defaultCallbackSeparator +
    valueArgument;
    EnclaveEditor.callback('callback-field-getvalue', joinedArguments);
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
    if(!this.hasNoStyle && this.lastHTML != EnclaveEditor.defaultHTML || !this.isEmpty()) {
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
        var target = tempDom.querySelector('.el-img').nextSibling;
        return target;
    }
    function findImagePrevSibling(imgItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = imgItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.el-img').previousSibling;
        return target;
    }
    function resetImageParentNodeHTML(imgItem){
        var pnode = imgItem.parentNode,
        tempDom = document.createElement('div');
        tempDom.innerHTML = pnode.innerHTML;
        pnode.innerHTML = tempDom.innerHTML;
    }
    var dataId = new Date().getTime().toString();
    var imgItem = document.createElement('p');
    imgItem.setAttribute('data-id', dataId);
    imgItem.className = "el-img"
    imgItem.innerHTML = '<img src="'+img+'" />';
    
    var self = this;
    function _inner() {
        EnclaveEditor.restoreRange();
        var selection = window.getSelection(),
        range;
        
        if (window.getSelection().rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            if(EnclaveEditor.currentSelection.startContainer == 0 || EnclaveEditor.currentSelection.endContainer == 0){
                range.setStart(EnclaveEditor.content.wrappedDomNode(), EnclaveEditor.currentSelection.startOffset);
                range.setEnd(EnclaveEditor.content.wrappedDomNode(), EnclaveEditor.currentSelection.endOffset);
            }else{
                range.setStart(EnclaveEditor.currentSelection.startContainer, EnclaveEditor.currentSelection.startOffset);
                range.setEnd(EnclaveEditor.currentSelection.endContainer, EnclaveEditor.currentSelection.endOffset);
            }
        }
        var rangeNode = range.endContainer; // 光标所在的node
        
        if (EnclaveEditor.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote'])){
            // 列表和引用内不插书籍,/把书籍看成一个独立的段落处理
            var inTagNode = EnclaveEditor.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote']).tagNode;
            imgItem.removeAttribute('data-id');
            if (inTagNode.textContent.length == 0) {
                // 如果当前block没有文本，则把block删掉
                inTagNode.parentNode.insertBefore(imgItem, inTagNode);
                if (imgItem.previousSibling.getAttribute('contenteditable') == 'false') {
                    imgItem.parentNode.insertBefore(generateSpaceNode(), imgItem);
                }
                inTagNode.remove();
            } else {
                EnclaveEditor.insertAfter(imgItem, inTagNode);
            }
            if (imgItem.nextSibling) {
                range.selectNodeContents(imgItem.nextSibling);
                range.collapse();
            } else {
                var newEmptyLine = EnclaveEditor.generateEmptyPara();
                EnclaveEditor.insertAfter(newEmptyLine, imgItem);
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
            if(imgItemParentNode == EnclaveEditor.content.wrappedDomNode()){
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
                    var emptyLine = EnclaveEditor.generateEmptyPara();
                    EnclaveEditor.insertAfter(emptyLine, theImgItem);
                    range.selectNodeContents(emptyLine);
                    range.collapse(false);
                }
            }else{
                // 这是在一个段落里面的
                // 先把图片挪到parent外面
                EnclaveEditor.insertAfter(theImgItem, imgItemParentNode);
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
                    EnclaveEditor.insertAfter(newNextPara, theImgItem);
                }
                if((imgItemParentNode.childNodes.length == 0) || (imgItemParentNode.innerHTML == '<br>') || (imgItemParentNode.innerText == '')){
                    // 书和next移除出来后parent空了，移除掉
                    imgItemParentNode.parentNode.removeChild(imgItemParentNode);
                }
                if(theImgItem.nextSibling){
                    // 处理完之后重新那img的next并做相应处理
                    range.selectNodeContents(theImgItem.nextSibling);
                }else{
                    var newEmptyLine = EnclaveEditor.generateEmptyPara();
                    EnclaveEditor.insertAfter(newEmptyLine, theImgItem);
                    range.selectNodeContents(newEmptyLine);
                }
            }
        }
        
        
        EnclaveEditor.backupRange();
        selection.removeAllRanges();
        selection.addRange(range);
        selection.collapseToStart();
        
        self.refreshPlaceholder();
        setTimeout(function(){
                   EnclaveEditor.calculateEditorHeightWithCaretPosition();
                   },50);
    }
    //适配iOS
    if (EnclaveMobile.isiOS) {
        // hack for timing
        setTimeout(function(){
                   _inner();
                   }, 30);
    } else {
        _inner();
    }
}

//插入音频
ELField.prototype.insertAudio = function(url, duration) {
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
    function findAudioNextSibling(audioItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = audioItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.el-audio').nextSibling;
        return target;
    }
    function findAudioPrevSibling(audioItem){
        var tempDom = document.createElement('div');
        tempDom.innerHTML = audioItem.parentNode.innerHTML;
        var target = tempDom.querySelector('.el-audio').previousSibling;
        return target;
    }
    function resetAudioItemParentNodeHtml(audioItem){
        var pnode = audioItem.parentNode,
        tempDom = document.createElement('div');
        tempDom.innerHTML = pnode.innerHTML;
        pnode.innerHTML = tempDom.innerHTML;
    }

    var dataId = new Date().getTime().toString();
    var audioItem = document.createElement('p');
    audioItem.className = 'el-audio';
    audioItem.setAttribute('contenteditable', false);
    audioItem.setAttribute('data-id', dataId);
    audioItem.setAttribute('data-url', url);
    audioItem.setAttribute('data-duration', duration + '');
    audioItem.setAttribute('data-original-url', url);
    audioItem.innerHTML = "<img class='el-audio-play' src='audio_play.png' onclick='EnclaveAudio.onPlay(event)' >"
    +"<span class='el-audio-duration'>" + EnclaveAudio.formatDurationToFriendly(duration) + "</span>"
    +"<img class='el-audio-delete' src='audio_delete.png' onclick='EnclaveAudio.onDelete(event)'>";
    
    var self = this;
    function _inner() {
        var selection = window.getSelection(),
        range;
        
        if (window.getSelection().rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            if(EnclaveEditor.currentSelection.startContainer == 0 || EnclaveEditor.currentSelection.endContainer == 0){
                range.setStart(EnclaveEditor.content.wrappedDomNode(), EnclaveEditor.currentSelection.startOffset);
                range.setEnd(EnclaveEditor.content.wrappedDomNode(), EnclaveEditor.currentSelection.endOffset);
            }else{
                range.setStart(EnclaveEditor.currentSelection.startContainer, EnclaveEditor.currentSelection.startOffset);
                range.setEnd(EnclaveEditor.currentSelection.endContainer, EnclaveEditor.currentSelection.endOffset);
            }
        }
        var rangeNode = range.endContainer; // 光标所在的node
        
        if (EnclaveEditor.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote'])){
            // 列表和引用内不插书籍,把书籍看成一个独立的段落处理
            var inTagNode = EnclaveEditor.isInTag(rangeNode, ['b', 'h1' ,'h2' ,'ul' ,'blockquote']).tagNode;
            audioItem.removeAttribute('data-id');
            if (inTagNode.textContent.length == 0) {
                // 如果当前block没有文本，则把block删掉
                inTagNode.parentNode.insertBefore(audioItem, inTagNode);
                if (audioItem.previousSibling.getAttribute('contenteditable') == 'false') {
                    audioItem.parentNode.insertBefore(generateSpaceNode(), audioItem);
                }
                inTagNode.remove();
            } else {
                EnclaveEditor.insertAfter(audioItem, inTagNode);
            }
            if (audioItem.nextSibling) {
                range.selectNodeContents(audioItem.nextSibling);
                range.collapse();
            } else {
                var newEmptyLine = EnclaveEditor.generateEmptyPara();
                EnclaveEditor.insertAfter(newEmptyLine, audioItem);
                range.selectNodeContents(newEmptyLine);
                range.collapse(false);
            }
        }else{
            // 在第一行或者在一个p里，这里把图片和图片前后的node包个p
            range.collapse(false);
            range.insertNode(audioItem);
            var flagId = audioItem.getAttribute('data-id'),
            audioItemParentNode = audioItem.parentNode;
            resetAudioItemParentNodeHtml(audioItem);
            var theAudioItem = audioItemParentNode.querySelector('[data-id="'+flagId+'"]'),
            theAudioItemPreviousSibling = null || theAudioItem.previousSibling,
            theAudioItemNextSibling = null || theAudioItem.nextSibling;
            //theAudioItem.removeAttribute('data-id');
            if(audioItemParentNode == EnclaveEditor.content.wrappedDomNode()){
                // 这是在第一行没被p包住的情况
                // 图片前面包一个p
                if(theAudioItemPreviousSibling){
                    if((theAudioItemPreviousSibling.nodeType == 3 ) || (theAudioItemPreviousSibling.nodeType == 1 && theAudioItemPreviousSibling.tagName.toLowerCase() == "br")){
                        var newPreviousPara = document.createElement('p');
                        range.selectNodeContents(theAudioItemPreviousSibling);
                        range.surroundContents(newPreviousPara);
                    }
                }else{
                    theAudioItem.parentNode.insertBefore(generateSpaceNode(), theAudioItem);
                }
                // 图片后面包一个p
                if(theAudioItemNextSibling){
                    if((theAudioItemNextSibling.nodeType == 3 ) || (theAudioItemNextSibling.nodeType == 1 && theAudioItemNextSibling.tagName.toLowerCase() == "br")){
                        var newNextPara = document.createElement('p');
                        range.selectNodeContents(theAudioItemNextSibling);
                        range.surroundContents(newNextPara);
                        range.selectNodeContents(newNextPara);
                    }else{
                        range.selectNodeContents(theAudioItemNextSibling);
                        range.collapse();
                    }
                }else{
                    var newEmptyLine = EnclaveEditor.generateEmptyPara();
                    EnclaveEditor.insertAfter(newEmptyLine, theAudioItem);
                    range.selectNodeContents(newEmptyLine);
                    range.collapse(false);
                }
            } else {
                // 这是在一个段落里面的
                // 先把图片挪到parent外面
                EnclaveEditor.insertAfter(theAudioItem, audioItemParentNode);
                // 如果原来有nextSibling，则把图片原来的nextSibling包一个p并插到图片后面
                if(theAudioItemNextSibling && !(theAudioItemNextSibling.nodeType == 1 && theAudioItemNextSibling.tagName.toLowerCase() == "br")){
                    var newNextPara;
                    if((theAudioItemNextSibling.nodeType == 3 ) || (theAudioItemNextSibling.nodeType == 1 && theAudioItemNextSibling.tagName.toLowerCase() == "br")){
                        newNextPara = document.createElement('p');
                        range.selectNodeContents(theAudioItemNextSibling);
                        range.surroundContents(newNextPara);
                    }else{
                        newNextPara = theAudioItemNextSibling;
                    }
                    EnclaveEditor.insertAfter(newNextPara, theAudioItem);
                }
                if((audioItemParentNode.childNodes.length == 0) || (audioItemParentNode.innerHTML == '<br>') || (audioItemParentNode.innerText == '')){
                    // 书和next移除出来后parent空了，移除掉
                    audioItemParentNode.parentNode.removeChild(audioItemParentNode);
                }
                if(theAudioItem.nextSibling){
                    range.selectNodeContents(theAudioItem.nextSibling);
                }else{
                    var newEmptyLine = EnclaveEditor.generateEmptyPara();
                    EnclaveEditor.insertAfter(newEmptyLine, theAudioItem);
                    range.selectNodeContents(newEmptyLine);
                }
                if(!theAudioItem.previousSibling || (theAudioItem.previousSibling.getAttribute('contenteditable') == 'false')){
                    theAudioItem.parentNode.insertBefore(generateSpaceNode(), theAudioItem);
                }
            }
        }
        
        EnclaveEditor.backupRange();
        selection.removeAllRanges();
        selection.addRange(range);
        selection.collapseToStart();
        
        //判断placeholder
        self.refreshPlaceholder();
        setTimeout(function(){
                   EnclaveEditor.calculateEditorHeightWithCaretPosition();
                   },50);
    }
    //适配iOS
    if (EnclaveMobile.isiOS) {
        // hack for timing
        setTimeout(function(){
                   _inner();
                   }, 30);
    } else {
        _inner();
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
    var joinedArguments = this.callbackId() + EnclaveEditor.defaultCallbackSeparator +
    valueArgument;
    EnclaveEditor.callback('callback-field-getvalue', joinedArguments);
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
    EnclaveEditor.callback('onCoverClick', url);
}

//MARK: Start
EnclaveEditor.init();
