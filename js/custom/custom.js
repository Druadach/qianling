//进度条
$(document).ready(function () {
  $(window).scroll(function(){
    $(".top-scroll-bar").attr("style", "width: " + ($(this).scrollTop() / ($(document).height() - $(this).height()) * 100) + "%; display: block;");
  var s=$(window).scrollTop();
  var a=$(document).height();
  var b=$(window).height();
  var result=parseInt(s/(a-b)*100);
  $(".top-scroll-bar").css("width",result+"%");
  if(result>=0&&result<=19)
  $(".top-scroll-bar").css("background","#e5e5e5");
  if(result>=20&&result<=39)
  $(".top-scroll-bar").css("background","#e0e0e0");
  if(result>=40&&result<=59)
  $(".top-scroll-bar").css("background","#dbdbdb");
  if(result>=60&&result<=79)
  $(".top-scroll-bar").css("background","#d6d6d6");
  if(result>=80&&result<=99)
  $(".top-scroll-bar").css("background","#d1d1d1");
  if(result==100)
  $(".top-scroll-bar").css("background","#cccccc");
  });
});

//Service Workers
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').then(function (registration) {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }).catch(function (err) {
              console.log('ServiceWorker registration failed: ', err);
          });
      });
  }

// 折叠
$(document).ready(function(){
    $(document).on('click', '.fold_hider', function(){
        $('>.fold', this.parentNode).slideToggle();
        $('>:first', this).toggleClass('open');
    });
    //默认情况下折叠
    $("div.fold").css("display","none");
});
const rEscapeContent = /<escape(?:[^>]*)>([\s\S]*?)<\/escape>/g;
const placeholder = '\uFFFD';
const rPlaceholder = /(?:<|&lt;)\!--\uFFFD(\d+)--(?:>|&gt;)/g;
const cache = [];
function escapeContent(str) {
  return '<!--' + placeholder + (cache.push(str) - 1) + '-->';
}
hexo.extend.filter.register('before_post_render', function(data) {
  data.content = data.content.replace(rEscapeContent, function(match, content) {
  return escapeContent(content);
  });
  return data;
});
hexo.extend.filter.register('after_post_render', function(data) {
  data.content = data.content.replace(rPlaceholder, function() {
  return cache[arguments[1]];
  });
  return data;
});
function fold (args, content) {
  var text = args[0];
  if(!text) text = "点击展开／折叠内容";
  return '<div><div class="fold_hider"><div class="close hider_title">' + text + '</div></div><div class="fold">\n' + hexo.render.renderSync({text: content, engine: 'markdown'}) + '\n</div></div>';
}
hexo.extend.tag.register('fold', fold, {ends: true});

// 记忆浏览位置
$(function() {
  if (localStorage.tempScrollTop) {
    $(window).scrollTop(localStorage.tempScrollTop);
  }
});
$(window).on("scroll", function() {
  localStorage.setItem("tempScrollTop", $(window).scrollTop());
});
window.onbeforeunload = function() {
  var tempScrollTop = $(window).scrollTop();
  localStorage.setItem("tempScrollTop", tempScrollTop);
};
