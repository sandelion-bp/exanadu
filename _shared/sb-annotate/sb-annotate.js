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
    fab.setAttribute('aria-label', '디스크립션 보기 전환');
    fab.title = '디스크립션 보기';
    fab.innerHTML = '<span class="sba-fab-icon">✎</span><span class="sba-fab-label">디스크립션</span><span class="sba-count">' + items.length + '</span>';
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

    var SECTION_CLASS = { Visible: 'sba-sec-visible', Action: 'sba-sec-action', Exception: 'sba-sec-exception' };

    // body를 "[Visible]/[Action]/[Exception]" 섹션 헤더 + "- " 개조식 불릿으로 파싱해
    // 섹션별로 구분되는 HTML로 렌더링한다. 섹션/불릿 형식이 아닌 줄은 평문 단락으로 둔다.
    function renderBody(container, text) {
      container.innerHTML = '';
      var list = null;
      (text || '').split('\n').forEach(function (raw) {
        var line = raw.trim();
        var sectionMatch = /^\[(Visible|Action|Exception)\]$/.exec(line);
        if (sectionMatch) {
          var label = document.createElement('div');
          label.className = 'sba-section-label ' + SECTION_CLASS[sectionMatch[1]];
          label.textContent = sectionMatch[1];
          container.appendChild(label);
          list = null;
          return;
        }
        var bulletMatch = /^[-•]\s*(.+)$/.exec(line);
        if (bulletMatch) {
          if (!list) {
            list = document.createElement('ul');
            list.className = 'sba-bullet-list';
            container.appendChild(list);
          }
          var li = document.createElement('li');
          li.textContent = bulletMatch[1];
          list.appendChild(li);
          return;
        }
        if (!line) { list = null; return; }
        var p = document.createElement('p');
        p.className = 'sba-plain-line';
        p.textContent = line;
        container.appendChild(p);
        list = null;
      });
    }

    function openPopup(it) {
      popupOverlay.querySelector('.sba-popup-title').textContent = it.title;
      renderBody(popupOverlay.querySelector('.sba-popup-body'), it.body);
      popupOverlay.hidden = false;
    }
    function closePopup() { popupOverlay.hidden = true; }

    items.forEach(function (it, idx) {
      var target = document.querySelector(it.target);
      target.classList.add('sba-target');
      var marker = document.createElement('span');
      marker.className = 'sba-marker';
      marker.title = it.title;
      // 평소엔 점(화면용, 글자는 CSS로 숨김), 인쇄 모드에서만 이 번호가 보인다 —
      // 인쇄물은 클릭할 수 없으니 화면 위 번호 ↔ 아래 디스크립션 목록을 연결할 식별자가 필요해서다.
      marker.textContent = String(idx + 1);
      marker.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPopup(it);
      });
      target.insertAdjacentElement('afterend', marker);
    });

    // 인쇄(다운로드) 전용: 화면 밖에선 숨겨져 있다가 @media print에서만 나타나는
    // 디스크립션 전체 목록. 화면과 설명을 동시에 한 페이지에 넣을 수 없으니
    // "화면 먼저, 그 아래에 번호로 연결된 설명 목록"으로 순서대로 배치한다.
    var printList = document.createElement('section');
    printList.className = 'sba-print-list';
    var printHeading = document.createElement('h2');
    printHeading.className = 'sba-print-list-title';
    printHeading.textContent = '디스크립션';
    printList.appendChild(printHeading);
    items.forEach(function (it, idx) {
      var item = document.createElement('div');
      item.className = 'sba-print-item';
      var head = document.createElement('div');
      head.className = 'sba-print-item-head';
      var num = document.createElement('span');
      num.className = 'sba-print-num';
      num.textContent = String(idx + 1);
      var title = document.createElement('span');
      title.className = 'sba-print-title';
      title.textContent = it.title;
      head.appendChild(num);
      head.appendChild(title);
      item.appendChild(head);
      var body = document.createElement('div');
      body.className = 'sba-print-item-body';
      renderBody(body, it.body);
      item.appendChild(body);
      printList.appendChild(item);
    });
    document.body.appendChild(printList);

    var active = false;
    function setActive(v) {
      active = v;
      document.documentElement.classList.toggle('sba-mode-on', active);
      fab.classList.toggle('sba-active', active);
      if (!active) closePopup();
    }
    fab.addEventListener('click', function () { setActive(!active); });

    // ?print=1로 열리면(다운로드 버튼이 여는 방식) 인쇄 대화상자를 자동으로 띄운다.
    // 레이아웃·폰트가 자리잡을 시간을 조금 준 뒤 실행한다.
    if (new URLSearchParams(location.search).get('print') === '1') {
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 350);
      });
    }

    return { setActive: setActive };
  }

  global.SBAnnotate = { init: init };
})(window);
