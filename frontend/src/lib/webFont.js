// 웹 전용: 로고에 쓴 Asimovian 글꼴을 @font-face로 등록해서 기본 글꼴로 적용한다.
// react-native-web은 모든 최상위 Text/TextInput에 font-family를 'System'으로 못박아 버리기 때문에
// (예: Text/index.js의 `font: '14px System'`), html/body에 다른 폰트를 지정해도 상속으로는 못 이긴다.
// 그래서 'Asimovian'이라는 이름 자체와 'System'이라는 이름 둘 다를 이 폰트 파일로 등록해서 가로챈다.
// Asimovian은 굵기가 400(Regular) 하나뿐이라 100~900 범위로 등록해 두면 다른 fontWeight 값에도 매칭된다.
const FAMILIES = ['System', 'Asimovian'];

let injected = false;

export function injectWebFont() {
  if (injected || typeof document === 'undefined') return;
  injected = true;

  const faces = FAMILIES.map(
    (family) => `
    @font-face {
      font-family: '${family}';
      src: url('/fonts/Asimovian-Regular.ttf') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }`,
  ).join('\n');

  const style = document.createElement('style');
  style.id = 'asimovian-font';
  style.textContent = `
    ${faces}
    html, body, #root {
      font-family: 'Asimovian', -apple-system, 'Apple SD Gothic Neo', sans-serif;
    }
    /* react-native-web이 Text/TextInput에 font-family: System을 직접 박아버려서
       위의 상속만으로는 못 이긴다 — !important로 강제로 덮어쓴다 */
    * {
      font-family: 'Asimovian', -apple-system, 'Apple SD Gothic Neo', sans-serif !important;
    }
  `;
  document.head.appendChild(style);
}
