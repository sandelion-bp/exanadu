/*
  SB Annotate — 구현된 것처럼 보이는 HTML 화면 위에 "변경사항 마커 + 설명 팝업"을 얹는
  공용 컴포넌트. 화면 자체가 SB를 대체하는 방식이라, 평소엔 아무 흔적이 없다가
  우측 하단 플로팅 버튼을 눌렀을 때만 마커가 나타난다.

  사용법:
    <link rel="stylesheet" href="경로/sb-annotate.css">
    ...
    <script src="경로/sb-annotate.js"></script>
    <script>
      SBAnnotate.init([
        { target: '#someId', title: '변경 제목', body: '설명 내용' },
        ...
      ]);
    </script>
*/
(function (global) {
  function init(items) {
    items = (items || []).filter(function (it) { return document.querySelector(it.target); });
    if (!items.length) return { setActive: function () {} };

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'sba-fab';
    fab.setAttribute('aria-label', '변경사항 보기 전환');
    fab.title = '변경사항 보기';
    fab.innerHTML = '✎<span class="sba-count">' + items.length + '</span>';
    document.body.appendChild(fab);

    var popupOverlay = document.createElement('div');
    popupOverlay.className = 'sba-popup-overlay';
    popupOverlay.hidden = true;
    popupOverlay.innerHTML =
      '<div class="sba-popup">' +
        '<div class="sba-popup-head"><span class="sba-popup-title"></span><span class="sba-popup-close" aria-label="닫기">×</span></div>' +
        '<div class="sba-popup-body"></div>' +
      '</div>';
    document.body.appendChild(popupOverlay);
    popupOverlay.addEventListener('click', function (e) { if (e.target === popupOverlay) closePopup(); });
    popupOverlay.querySelector('.sba-popup-close').addEventListener('click', closePopup);

    function openPopup(it) {
      popupOverlay.querySelector('.sba-popup-title').textContent = it.title;
      popupOverlay.querySelector('.sba-popup-body').textContent = it.body;
      popupOverlay.hidden = false;
    }
    function closePopup() { popupOverlay.hidden = true; }

    items.forEach(function (it) {
      var target = document.querySelector(it.target);
      target.classList.add('sba-target');
      var marker = document.createElement('span');
      marker.className = 'sba-marker';
      marker.title = it.title;
      marker.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPopup(it);
      });
      target.insertAdjacentElement('afterend', marker);
    });

    var active = false;
    function setActive(v) {
      active = v;
      document.documentElement.classList.toggle('sba-mode-on', active);
      fab.classList.toggle('sba-active', active);
      if (!active) closePopup();
    }
    fab.addEventListener('click', function () { setActive(!active); });

    return { setActive: setActive };
  }

  global.SBAnnotate = { init: init };
})(window);
