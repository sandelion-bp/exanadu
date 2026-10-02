/*
  프로젝트 1개를 "다운로드해서 바로 열리는" 자체완결 HTML 묶음으로 내보낸다.

    node _tools/export-project.mjs "91888 기획전 쿠폰"

  결과: _dist/{프로젝트}/ (index.html + 화면별 html이 한 폴더에 평면 배치) 와 _dist/{프로젝트}.zip

  저장소 원본은 `_shared/`를 상대경로로 참조해서 파일만 떼어내면 깨진다. 그래서 전달용
  사본에서는 `_shared`의 CSS/JS를 각 HTML 안에 인라인으로 박아 외부 폴더 의존을 없애고,
  `screens/` 하위 구조도 한 폴더로 펼쳐 압축 도구가 폴더를 어떻게 다루든 링크가 살아 있게 한다.
  레드마인 첨부 → 압축 풀기 → index.html 더블클릭이면 끝이고, 서버·인터넷 없이
  file://에서도 마커·팝업·GNB가 전부 동작한다.
*/
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');

const project = process.argv[2];
if (!project) {
  console.error('사용법: node _tools/export-project.mjs "{프로젝트 폴더명}"');
  process.exit(1);
}

// <link href="...">·<script src="...">가 _shared를 가리키면 그 파일 내용으로 바꿔치기한다.
async function inlineShared(html) {
  const linkRe = /[ \t]*<link[^>]*href="([^"]*_shared\/[^"]+\.css)"[^>]*>\r?\n?/g;
  const scriptRe = /[ \t]*<script[^>]*src="([^"]*_shared\/[^"]+\.js)"[^>]*>\s*<\/script>\r?\n?/g;
  const assets = new Map();

  for (const re of [linkRe, scriptRe]) {
    for (const [, href] of html.matchAll(re)) {
      const file = path.join(ROOT, href.replace(/^(\.\.\/)+/, ''));
      assets.set(href, await readFile(file, 'utf8'));
    }
  }

  return html
    .replace(linkRe, (_, href) => `<style>\n${assets.get(href).trim()}\n</style>\n`)
    .replace(scriptRe, (_, href) => `<script>\n${assets.get(href).trim()}\n</script>\n`);
}

// 전달본에 있으면 안 되는 요소(저장소 루트로 돌아가는 링크 등)를 통째로 뺀다.
function dropNonExportBlocks(html) {
  return html.replace(/[ \t]*<(\w+)[^>]*class="[^"]*\bsb-no-export\b[^"]*"[^>]*>[\s\S]*?<\/\1>\r?\n?/g, '');
}

// 원본의 2단 구조(index.html + screens/*.html)를 한 폴더로 펼친 만큼 링크도 같은 층으로 맞춘다.
function flattenLinks(html) {
  return html
    .replace(/(href=")screens\//g, '$1')
    .replace(/(['"])\.\.\/index\.html\1/g, '$1index.html$1');
}

async function exportFile(srcRel, outName) {
  const html = await readFile(path.join(ROOT, srcRel), 'utf8');
  const out = path.join(ROOT, '_dist', project, outName);
  await writeFile(out, flattenLinks(dropNonExportBlocks(await inlineShared(html))), 'utf8');
  return outName;
}

const outDir = path.join(ROOT, '_dist', project);
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const written = [await exportFile(`${project}/index.html`, 'index.html')];
for (const name of await readdir(path.join(ROOT, project, 'screens'))) {
  // `쿠폰관리.before-20260930.html`처럼 이름에 점이 더 붙은 파일은 백업·변형본이라 전달본에서 뺀다.
  if (name.endsWith('.html') && !name.slice(0, -'.html'.length).includes('.')) {
    written.push(await exportFile(`${project}/screens/${name}`, name));
  }
}

// bsdtar(Windows 10+ 기본 tar, macOS 기본 tar)는 zip 항목명을 UTF-8로 적어 한글 파일명이
// 다른 OS에서 깨지지 않는다. PowerShell의 Compress-Archive는 그 보장이 없어 쓰지 않는다.
const zip = `${outDir}.zip`;
await rm(zip, { force: true });
const tar = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'tar';
await execFileAsync(tar, ['-a', '-c', '-f', zip, ...written], { cwd: outDir });

console.log(written.map((f) => `  _dist/${project}/${f}`).join('\n'));
console.log(`\n압축: _dist/${path.basename(zip)}`);
