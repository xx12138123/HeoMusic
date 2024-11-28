console.log("\n %c HeoMusic 开源静态音乐播放器 %c https://github.com/zhheo/HeoMusic \n", "color: #fadfa3; background: #030307; padding:5px 0;", "background: #fadfa3; padding:5px 0;")
var local = false;

if (typeof userId === 'undefined') {
  var userId = "8152976493"; // 替换为实际的默认值
}
if (typeof userServer === 'undefined') {
  var userServer = "netease"; // 替换为实际的默认值
}
if (typeof userType === 'undefined') {
  var userType = "playlist"; // 替换为实际的默认值
}

if (typeof remoteMusic !== 'undefined' && remoteMusic) {
  fetch(remoteMusic)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        localMusic = data;
      }
      loadMusicScript();
    })
    .catch(error => {
      console.error('Error fetching remoteMusic:', error);
      loadMusicScript();
    });
} else {
  loadMusicScript();
}

function loadMusicScript() {
  if (typeof localMusic === 'undefined' || !Array.isArray(localMusic) || localMusic.length === 0) {
    // 如果 localMusic 为空数组或未定义，加载 Meting2.min.js
    var script = document.createElement('script');
    script.src = './js/Meting.js';
    document.body.appendChild(script);
  } else {
    // 否则加载 localEngine.js
    var script = document.createElement('script');
    script.src = './js/localEngine.js';
    document.body.appendChild(script);
    local = true;
  }
}

var volume = 0.8;

// 获取地址栏参数
// 创建URLSearchParams对象并传入URL中的查询字符串
const params = new URLSearchParams(window.location.search);

var heo = {
  // 音乐节目切换背景
  changeMusicBg: function (isChangeBg = true) {
    const heoMusicBg = document.getElementById("music_bg")

    if (isChangeBg) {
      // player loadeddata 会进入此处
      const musiccover = document.querySelector("#heoMusic-page .aplayer-pic");
      var img = new Image();
      img.src = extractValue(musiccover.style.backgroundImage);
      img.onload = function() {
        heo.updateThemeColorWithImage(img);
      };
    } else {
      // 第一次进入，绑定事件，改背景
      let timer = setInterval(()=>{
        const musiccover = document.querySelector("#heoMusic-page .aplayer-pic");
        // 确保player加载完成
        if (musiccover) {
          clearInterval(timer)
          //初始化音量
          if (local) {
            ap.volume(0.8, true);
          }else {
            document.querySelector('meting-js').aplayer.volume(0.8,true);
          }

          // 绑定事件
          heo.addEventListenerChangeMusicBg();
          // 添加歌词点击事件
          heo.addLyricClickEvent();
        }
      }, 100)
    }
  },
  addEventListenerChangeMusicBg: function () {
    const heoMusicPage = document.getElementById("heoMusic-page");
    if (local) {
      ap.on('loadeddata', function () {
        heo.changeMusicBg();
        // 在图片加载后调用
        const musiccover = document.querySelector("#heoMusic-page .aplayer-pic");
        var img = new Image();
        img.src = extractValue(musiccover.style.backgroundImage);
        img.onload = function() {
          heo.updateThemeColorWithImage(img);
        };
      });
    }else {
      heoMusicPage.querySelector("meting-js").aplayer.on('loadeddata', function () {
        heo.changeMusicBg();
        // 在图片加载后调用
        const musiccover = document.querySelector("#heoMusic-page .aplayer-pic");
        var img = new Image();
        img.src = extractValue(musiccover.style.backgroundImage);
        img.onload = function() {
          heo.updateThemeColorWithImage(img);
        };
      });
    }
  },

  scrollLyric: function() {
    const lrcContent = document.querySelector('.aplayer-lrc');
    const currentLyric = document.querySelector('.aplayer-lrc-current');
    
    if (lrcContent && currentLyric) {
      let startScrollTop = lrcContent.scrollTop;
      let targetScrollTop = currentLyric.offsetTop - (window.innerHeight - 150) * 0.3; // 目标位置在30%的dvh位置
      let distance = targetScrollTop - startScrollTop;
      let duration = 600; // 缩短动画时间以提高流畅度
      let startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function animateScroll(currentTime) {
        if (startTime === null) startTime = currentTime;
        let timeElapsed = currentTime - startTime;
        let progress = Math.min(timeElapsed / duration, 1);
        let easeProgress = window.innerWidth < 768 ? progress : easeOutQuad(progress);
        lrcContent.scrollTop = startScrollTop + (distance * easeProgress);
        if (timeElapsed < duration) {
          requestAnimationFrame(animateScroll);
        }
      }

      requestAnimationFrame(animateScroll);
    }
  },

  getCustomPlayList: function() {
    const heoMusicPage = document.getElementById("heoMusic-page");
    const playlistType = params.get("type") || "playlist";
    
    if (params.get("id") && params.get("server")) {
      console.log("获取到自定义内容")
      var id = params.get("id")
      var server = params.get("server")
      heoMusicPage.innerHTML = `<meting-js id="${id}" server="${server}" type="${playlistType}" mutex="true" preload="auto" order="random"></meting-js>`;
    } else {
      console.log("无自定义内容")
      heoMusicPage.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="${userType}" mutex="true" preload="auto" order="random"></meting-js>`;
    }
    heo.changeMusicBg(false);
  },
  bindEvents: function () {
    var e = this;
    // 添加歌词点击件
    if (this.lrc) {
        this.template.lrc.addEventListener('click', function (event) {
            // 确保点击的是歌词 p 元素
            var target = event.target;
            if (target.tagName.toLowerCase() === 'p') {
                // 获取所有歌词元素
                var lyrics = e.template.lrc.getElementsByTagName('p');
                // 找到被点击歌词的索引
                for (var i = 0; i < lyrics.length; i++) {
                    if (lyrics[i] === target) {
                        // 获取对应时间并跳转
                        if (e.lrc.current[i]) {
                            var time = e.lrc.current[i][0];
                            e.seek(time);
                            if (e.paused) {
                                e.play();
                            }
                        }
                        break;
                    }
                }
            }
        });
    }
  },
  // 添加新方法处理歌词点击
  addLyricClickEvent: function() {
    const lrcContent = document.querySelector('.aplayer-lrc-contents');
    
    if (lrcContent) {
        lrcContent.addEventListener('click', function(event) {
            if (event.target.tagName.toLowerCase() === 'p') {
                const lyrics = lrcContent.getElementsByTagName('p');
                for (let i = 0; i < lyrics.length; i++) {
                    if (lyrics[i] === event.target) {
                        // 获取当前播放器实例
                        const player = local ? ap : document.querySelector('meting-js').aplayer;
                        // 使用播放器内部的歌词数据
                        if (player.lrc.current[i]) {
                            const time = player.lrc.current[i][0];
                            player.seek(time);
                            // 如果当前是暂停状态,则恢复播放
                            if (player.paused) {
                                player.play();
                            }
                        }
                        event.stopPropagation(); // 阻止事件冒泡
                        break;
                    }
                }
            }
        });
    }
  },
  setMediaMetadata: function (aplayerObj, isSongPlaying) {
    const audio = aplayerObj.list.audios[aplayerObj.list.index]
    const coverUrl = audio.cover || './img/icon.webp';
    const currentLrcContent = document.getElementById("heoMusic-page").querySelector(".aplayer-lrc-current").textContent;
    let songName, songArtist;

    if ('mediaSession' in navigator) {
      if (isSongPlaying && currentLrcContent) {
        songName = currentLrcContent;
        songArtist = `${audio.artist}/${audio.name}`;
      } else {
        songName = audio.name;
        songArtist = audio.artist;
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songName,
        artist: songArtist,
        album: audio.album,
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } else {
      console.log('当前浏览器不支持 Media Session API');
      document.title = `${audio.name} - ${audio.artist}`;
    }
  },
  // 响应 MediaSession 标准媒体交互
  setupMediaSessionHandlers: function (aplayer) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        aplayer.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        aplayer.pause();
      });

      // 移除快进快退按钮
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);

      // 设置上一曲下一曲按钮
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        aplayer.skipBack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        aplayer.skipForward();
      });

      // 更新 Media Session 元数据
      aplayer.on('loadeddata', () => {
        heo.setMediaMetadata(aplayer, false);
      });

      // 更新播放状态
      aplayer.on('play', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      });

      aplayer.on('pause', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      });

      // 监听时间更新事件
      aplayer.on('timeupdate', () => {
        heo.setMediaMetadata(aplayer, true);
      });
    }
  },
  updateThemeColorWithImage(img) {
    if (local) {
      const updateThemeColor = (colorThief) => {
        const dominantColor = colorThief.getColor(img);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', `rgb(${dominantColor.join(',')})`);
        }
      };
    
      if (typeof ColorThief === 'undefined') {
        const script = document.createElement('script');
        script.src = './js/color-thief.min.js';
        script.onload = () => updateThemeColor(new ColorThief());
        document.body.appendChild(script);
      } else {
        updateThemeColor(new ColorThief());
      }
    }

  }
  
}

// 调用
heo.getCustomPlayList();


// 改进vh
const vh = window.innerHeight * 1;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
  let vh = window.innerHeight * 1;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

//获取图片url
function extractValue(input) {
  var valueRegex = /\("([^\s]+)"\)/g;
  var match = valueRegex.exec(input);
  return match[1];
}

//空格控制音乐
document.addEventListener("keydown", function(event) {
  //暂停开启音乐
  if (event.code === "Space") {
    event.preventDefault();
    if (local) {
      ap.toggle();
    }else {
      document.querySelector('meting-js').aplayer.toggle();
    }

  };
  //切换下一曲
  if (event.keyCode === 39) {
    event.preventDefault();
    if (local) {
      ap.skipForward();
    }else {
      document.querySelector('meting-js').aplayer.skipForward();
    }

  };
  //切换上一曲
  if (event.keyCode === 37) {
    event.preventDefault();
    if (local) {
ap.skipBack();
    }else {
      document.querySelector('meting-js').aplayer.skipBack();
    }

  }
  //增加音量
  if (event.keyCode === 38) {
    if (volume <= 1) {
      volume += 0.1;
      if (local) {
        ap.volume(volume,true);
      }else {
        document.querySelector('meting-js').aplayer.volume(volume,true);
      }

    }
  }
  //减小音量
  if (event.keyCode === 40) {
    if (volume >= 0) {
      volume += -0.1;
      if (local) {
        ap.volume(volume,true);
      }else {
        document.querySelector('meting-js').aplayer.volume(volume,true);
      }
      
    }
  }
});