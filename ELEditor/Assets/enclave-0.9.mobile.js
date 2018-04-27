/**
移动端原生端JS
v0.9
author kk@enclavelit.com

1、配置项：
    EnclaveMobile.canImageClick //图片是否添加点击事件，默认为true

2、JS回调到原生的方法
    
    EnclaveNative.onImageClick(currentImageIndex, srcs) 
    正文图片点击回调，currentImageIndex为当前点击图片的数组索引，srcs为字符串数组、所有图片的url
    
    EnclaveNative.onLog(msg)
    日志输出，msg为String

3、 开放给原生的方法
    EnclaveMobile.switchToNightMode()
    切换到夜间模式

    EnclaveMobile.switchToLightMode() 
    切换到白天模式

    EnclaveMobile.getContentHeight() 返回Float
    获取内容区高度

    EnclaveMobile.getImageSrcs() 返回[String]
    获取所有有效的图片地址【不包含链接与相关组件按钮图片】


注意：
1、因Android原生接收js层只能接收String返回值的原因，如果调用js有返回参数的方法，则需要在EnclaveNative.xxxxCallback(arg)定义相关回调方法
如: 原生调用EnclaveMobile.getImageSrcs()时，在Android端实际会通过EnavleNative.getImageSrcsCallback(srcs)回调到原生。

2、js与原生所有需要以Map/Dictionary交互的地方都使用JSON String传输

*/

//MARK: - EnclaveMobile
if (!window.EnclaveMobile) {
    window.EnclaveMobile = {};
}
var userAgent = navigator.userAgent || navigator.vendor || window.opera;
EnclaveMobile.isiOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
EnclaveMobile.isAndroid = /android/i.test(userAgent);

//MARK: 夜间模式
//切换到夜间模式
EnclaveMobile.switchToNightMode = function() {
    document.querySelector('html').classList.add('night-mode');
    if (window.EnclaveAudio) {
        EnclaveAudio.switchToNightMode();
    }
}

//切换到白天模式
EnclaveMobile.switchToLightMode = function() {
    document.querySelector('html').classList.remove('night-mode');
    if (window.EnclaveAudio) {
        EnclaveAudio.switchToLightMode();
    }
}

//获取当前内容高度
EnclaveMobile.getContentHeight = function() {
    var contentHeight =  document.body.scrollHeight * window.scale;
    if (EnclaveMobile.isAndroid) {
        //Android端js再次调用原生的xxxCallback方法传递参数
        EnclaveBridge.callback('getContentHeightCallback', contentHeight);
    } else {
        return contentHeight;
    }
}

//MARK: Image 
EnclaveMobile.getImageSrcs = function() {
    var srcs = this._getImageSrcs()
    if (EnclaveMobile.isAndroid) {
        //Android端js再次调用原生的xxxCallback方法传递参数
        EnclaveBridge.callback('getImageSrcsCallback', srcs);
    } else {
        return srcs;
    }
}

EnclaveMobile._getImageSrcs = function() {
    var srcs = [];
    var imgs = document.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
        if(imgs[i].src.indexOf('data:') == 0 || imgs[i].parentNode.nodeName.toLocaleLowerCase() == 'a' || imgs[i].className.indexOf('el-audio') != -1) {
            continue
        }
        srcs.push(imgs[i].src);
    }
    return srcs;
}

EnclaveMobile._onImageClick = function(currentImageIndex) {
    var srcs = this._getImageSrcs();
    EnclaveBridge.callback('onImageClick', currentImageIndex, srcs);
}

EnclaveMobile._setupImageClickEvent = function() {
    var imgs = document.getElementsByTagName('img');
    //有效图片index，因为可能会存在可跳转的图片
    var index = 0;
    for (var i = 0; i < imgs.length; i++) {
        //加载失败时默认图，且不可点击
        if(imgs[i].naturalWidth == "undefined" || imgs[i].naturalWidth == 0) {
            imgs[i].src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBBwcHDQwNGBAQGBQODg4UFA4ODg4UEQwMDAwMEREMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDP/AABEIADIAZAMBEQACEQEDEQH/xABLAAEBAAAAAAAAAAAAAAAAAAAACBABAAAAAAAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//Z';
        }
        //并图片本身包含链接时也不可点击
        //音频组件图片不响应图片点击事件
        if(imgs[i].parentNode.nodeName.toLocaleLowerCase() == 'a' || imgs[i].className.indexOf('el-audio') != -1) {
            continue;
        }
        imgs[i].imageIndex = index++; //给img元素设置一个index
        imgs[i].onclick = function(e) {
            EnclaveMobile._onImageClick(e.target.imageIndex); //拿当前事件的元素index然后回调
        }
    }
}

window.addEventListener('load', function() {
    if (EnclaveMobile.canImageClick) {
        EnclaveMobile._setupImageClickEvent();
    }   
}, false)


// MARK: - EnclaveBridge
window.EnclaveBridge = {};
EnclaveBridge.defaultCallbackSeparator = '~';
///回调到原生
EnclaveBridge.callback = function(methodName) {
    if (window.EnclaveNative && window.EnclaveNative[methodName]) {
        window.EnclaveNative[methodName].apply(window.EnclaveNative, Array.prototype.slice.call(arguments, 1));
    } else {
        console.log('EnclaveNative.' + methodName + '没有定义');
    }
}

EnclaveBridge.log = function(msg) {
    this.callback('onLog', msg);
}