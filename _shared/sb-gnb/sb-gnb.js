/*
  SB GNB — SB 화면 맨 위에 붙는 공용 상단 바.
  "이게 SB 화면이다"를 알려주는 유일한 티 — 홈 버튼(프로젝트 index.html로 이동)과
  드롭다운(같은 프로젝트의 다른 화면으로 이동)만 제공한다. 실제 화면(아래 내용)은 건드리지 않는다.

  사용법:
    <link rel="stylesheet" href="경로/sb-gnb.css">
    ...
    <script src="경로/sb-gnb.js"></script>
    <script>
      SBGnb.init({
        home: '../index.html',       // 홈(대시보드) 버튼이 이동할 위치. 대시보드 미정 시 프로젝트 index.html을 쓴다.
        current: '쿠폰관리',          // 현재 화면 이름(드롭다운에 강조 표시)
        pages: [                      // 같은 프로젝트의 화면 목록
          { name: '쿠폰관리', path: '쿠폰관리.html' }
        ]
      });
    </script>
*/
(function (global) {
  function init(options) {
    options = options || {};
    var home = options.home || '../index.html';
    var current = options.current || '';
    var pages = options.pages || [];

    var bar = document.createElement('header');
    bar.className = 'sb-gnb';

    var badge = document.createElement('span');
    badge.className = 'sb-gnb-badge';
    badge.textContent = 'SB';
    bar.appendChild(badge);

    var homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'sb-gnb-home';
    homeBtn.innerHTML = '⌂ Home';
    homeBtn.title = '프로젝트 홈(대시보드)으로 이동';
    homeBtn.addEventListener('click', function () { location.href = home; });
    bar.appendChild(homeBtn);

    if (pages.length) {
      var wrap = document.createElement('div');
      wrap.className = 'sb-gnb-pages';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sb-gnb-pages-toggle';
      toggle.innerHTML = '화면 목록 <span class="sb-gnb-caret">▾</span>';
      wrap.appendChild(toggle);

      var menu = document.createElement('div');
      menu.className = 'sb-gnb-menu';
      menu.hidden = true;
      pages.forEach(function (p) {
        var a = document.createElement('a');
        var isCurrent = p.name === current;
        a.textContent = p.name;
        if (isCurrent) {
          a.className = 'sb-gnb-current';
          a.href = '#';
          a.addEventListener('click', function (e) { e.preventDefault(); });
        } else {
          a.href = p.path;
        }
        menu.appendChild(a);
      });
      wrap.appendChild(menu);
      bar.appendChild(wrap);

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
      });
      document.addEventListener('click', function () { menu.hidden = true; });
    }

    var label = document.createElement('span');
    label.className = 'sb-gnb-current-label';
    label.innerHTML = current ? ('현재 화면: <b>' + current + '</b>') : '';
    bar.appendChild(label);

    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }

  global.SBGnb = { init: init };
})(window);
