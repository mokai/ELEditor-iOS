/**
 Enclave Mobile Audio JS
 v0.9
 author kk@enclavelit.com

 全端音频组件播放

1、如需要在JS层播放，设置 EnclaveAudio.isPlayInJs = true; 
   可用于Web端与移动编辑器中。

2、JS回调到原生的方法
    EnclaveNative.onAudioPlay(currentIndex, audioList) 
    点击播放按钮，currentIndex为当前点击音频的数组索引，audioList为对象数组，[{ id:xxx, url:xxx, originalURL:xxx}] id为型音频id【字符型】，url为音频流播放URL，originalURL为音频原始下载URL

    EnclaveNative.onAudioPause()
    点击音频暂停按钮

    EnclaveNative.onAudioResume()
    点击音频继续按钮

    EnclaveNative.onAudioDelete(dataId, url) 
    点击音频删除按钮，只会在编辑器中出现，文章详情该回调可不管。

3、开放给原生的方法

    EnclaveAudio.setCurrentPlayAudioId(audioId)   audioId为音频Id【字符型】
    初始化当前播放中的音频，如一种场景，在文章详情页播放了一个正文音频，然后退出重新进入该详情页，此时应该把当前播放的音频id传到js层来初始化。

    EnclaveAudio.updateRemainTime(time) time为剩余时长【Int类型】
    播放中，需要根据播放器播放进度实时更新JS层的剩余时长 

    EnclaveAudio.pause()
    原生播放器暂停后，需要通知JS层更新UI

    EnclaveAudio.stop()
    原生播放器停止后，需要通知JS层更新UI

    EnclaveAudio.resume()
    原生播放器继续播放后，需要通知JS层更新UI

4、相关资源定义：
    ./audio_play.png
    ./audio_pause.png
    ./audio_delete.png

    夜间模式
    ./audio_play_night.png
    ./audio_pause_night.png
    ./audio_delete_night.png
 */
 //MARK: - EnclaveAudio
if (!window.EnclaveAudio) {
    window.EnclaveAudio = {};
    EnclaveAudio.isPlayInJs = false; //是否在js层播放
}

EnclaveAudio.switchToNightMode = function() {
    this._audioPlayImageName = "audio_play_night.png";
    this._audioPauseImageName = "audio_pause_night.png";
    this._audioDeleteImageName = "audio_delete_night.png";
    this._refreshImageStyle();
    
}

EnclaveAudio.switchToLightMode = function() {
    this._audioPlayImageName = "audio_play.png";
    this._audioPauseImageName = "audio_pause.png";
    this._audioDeleteImageName = "audio_delete.png";
    this._refreshImageStyle();
}

//音频播放点击事件
EnclaveAudio.onPlay = function(event) {
    event.stopPropagation();
    var audioObject = event.target.parentElement;
    var currentAudioId = audioObject.getAttribute('data-id');
    if (this._currentPlayAudioId == currentAudioId) { //当前播放
        if (this._currentPlayAudioPaused) {
            this.resume();
            this._callback('onAudioResume');
        } else {
            this.pause();
            this._callback('onAudioPause');
        }
        return;
    } else { //播放不同的音频
        this.stop();
    }
    //播放
    var audioURL = audioObject.getAttribute('data-url');
    this._play(currentAudioId, audioURL);
    
    //回调
    if (window.EnclaveBridge) {
        //获取所有音频信息
        var audioList = [];
        var currentIndex = 0;
        var audioObjects = document.querySelectorAll('.el-audio');
        for (var i = 0; i < audioObjects.length; i++) {
            var audioObject = audioObjects[i];
            var audioId = audioObject.getAttribute('data-id');
            var audioURL = audioObject.getAttribute('data-url');
            var audioOriginalURL = audioObject.getAttribute('data-original-url');
            if (audioId == currentAudioId) {
                currentIndex = i;
            }
            audioList.push({
                           'id': audioId,
                           'url': audioURL,
                           'originalURL': audioOriginalURL
                           });
        }
        var audioListString = JSON.stringify(audioList);
        this._callback('onAudioPlay', currentIndex, audioListString);
    }
}


//音频删除点击事件
EnclaveAudio.onDelete = function(event) {
    event.stopPropagation();
    var audioObject = event.target.parentElement;
    var audioId = audioObject.getAttribute('data-id');
    if (this._currentPlayAudioId == audioId) {
        this.stop();
    }
    audioObject.remove();
    var dataURl = audioObject.getAttribute('data-url');
    this._callback('onAudioDelete', audioId, dataURl);
}

//初始化当前播放音频，如原生播放正文音频后退出页面，然后又重新进入页面，这时应该把音频id在js初始化一次
EnclaveAudio.setCurrentPlayAudioId = function(audioId) {
    this._init();
    var audioObject = document.querySelector("p[data-id='" + audioId+ "']");
    if (!audioObject) { return }
    this._currentPlayAudioId = audioId;
    this._currentPlayAudioURL = audioObject.getAttribute('data-url');
    this._currentPlayAudioDuration = parseInt(audioObject.getAttribute('data-duration'));
    
    this._currentPlayAudioObject = audioObject;
    this._currentPlayAudioPlayObject = audioObject.getElementsByTagName('img')[0];
    this._currentPlayAudioDurationObject = audioObject.getElementsByTagName('span')[0];
    this._currentPlayAudioPlayObject.src = this._audioPauseImageName;
}

//暂停
EnclaveAudio.pause = function() {
    if (this._currentPlayAudio) {
        this._currentPlayAudio.pause();
    }
    this._currentPlayAudioPlayObject.src = this._audioPlayImageName;
    this._currentPlayAudioPaused = true;
}

//继续播放
EnclaveAudio.resume = function() {
    if (this._currentPlayAudio) {
        this._currentPlayAudio.play();
    }
    this._currentPlayAudioPlayObject.src = this._audioPauseImageName;
    this._currentPlayAudioPaused = false;
}

//更新播放剩余时长，seconds为秒
EnclaveAudio.updateRemainTime = function(seconds) {
    this._currentPlayAudioDurationObject.innerText = this.formatDurationToFriendly(seconds);
}

//停止播放
EnclaveAudio.stop = function() {
    if (this._currentPlayAudio) {
        this._currentPlayAudio.pause();
    }
    this._init();
}

//MARK: - Private

//播放
EnclaveAudio._play = function(audioId, audioURL) {
    this.setCurrentPlayAudioId(audioId);
    if (!EnclaveAudio.isPlayInJs) {
        return;
    }
    this._currentPlayAudio = new Audio(audioURL);
    var self = this;
    this._currentPlayAudio.addEventListener("timeupdate",function() {
        if (self._currentPlayAudio == null) {
         return;
        }
        var duration = self._currentPlayAudio.duration;
        var currentTime = self._currentPlayAudio.currentTime;
        if (duration == null || currentTime == null) {
            self.stop();
            return;
        }
        var remainTime = self._currentPlayAudio.duration - self._currentPlayAudio.currentTime;
        if (remainTime <= 0) {
            self.stop();
        } else {
            if (!isNaN(remainTime)) {
                self.updateRemainTime(remainTime);
            }
        }
    });
    this._currentPlayAudio.play();
}

EnclaveAudio.formatDurationToFriendly = function(second) {
    var m = Math.floor(second / 60);
    m = m < 10 ? ( '0' + m ) : m;
    var s = parseInt(second % 60);
    s = s < 10 ? ( '0' + s ) : s;
    return m + ':' + s;
}

EnclaveAudio._init = function() {
    if (this._currentPlayAudioPlayObject) {
        this._currentPlayAudioPlayObject.src = this._audioPlayImageName;
    }
    
    if (this._currentPlayAudioDurationObject && this._currentPlayAudioDuration) {
        this._currentPlayAudioDurationObject.innerText = this.formatDurationToFriendly(this._currentPlayAudioDuration);
    }
    
    this._currentPlayAudioId = null;//当前播放音频Id
    this._currentPlayAudioURL = null;
    this._currentPlayAudioDuration = null;
    this._currentPlayAudioPaused = null;//是否暂停中
    
    this._currentPlayAudio = null; //当前播放对象
    this._currentPlayAudioObject = null;
    this._currentPlayAudioPlayObject = null;
    this._currentPlayAudioDurationObject = null;
}

EnclaveAudio._callback = function(func) {
    if (window.EnclaveBridge) {
        EnclaveBridge['callback'].apply(EnclaveBridge, arguments);
    }
}


//MARK: - 夜间模式
EnclaveAudio._audioPlayImageName = "audio_play.png";
EnclaveAudio._audioPauseImageName = "audio_pause.png";
EnclaveAudio._audioDeleteImageName = "audio_delete.png";
EnclaveAudio._refreshImageStyle = function() {
    var audioObjects = document.querySelectorAll('.el-audio');
    for (var i = 0; i < audioObjects.length; i++) {
        var audioObject = audioObjects[i];
        var audioPlayObject = audioObject.getElementsByTagName('img')[0];
        audioPlayObject.src = audioPlayObject.src.indexOf('play') != -1 ? this._audioPlayImageName : this._audioPauseImageName;
        audioObject.getElementsByTagName('img')[1].src = this._audioDeleteImageName;
    }
}

EnclaveAudio._init();