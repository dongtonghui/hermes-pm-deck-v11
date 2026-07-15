// 深色主题对比度自动修复 v4
// 只处理浅色背景上的浅色/橙色文字，深色背景上的文字保持浅色
(function() {
  function parseColor(s) {
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), parseFloat(m[4] ?? 1)];
  }
  function lum(rgb) {
    const a = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function composite(fg, bg, a) {
    return [Math.round(fg[0]*a+bg[0]*(1-a)), Math.round(fg[1]*a+bg[1]*(1-a)), Math.round(fg[2]*a+bg[2]*(1-a))];
  }
  function effectiveBg(el) {
    let bg = parseColor(getComputedStyle(document.body).backgroundColor) || [15,15,13,1];
    let cur = el;
    while (cur && cur !== document.body) {
      const c = parseColor(getComputedStyle(cur).backgroundColor);
      if (c && c[3] > 0.05) {
        bg = composite(c, bg, c[3]);
        if (c[3] > 0.85) break;
      }
      cur = cur.parentElement;
    }
    return bg;
  }
  function fix() {
    const exclude = ['TITLE','STYLE','SCRIPT','NOSCRIPT','META','LINK','HEAD','HTML','BODY'];
    const all = document.body.querySelectorAll('*');
    for (const el of all) {
      if (exclude.includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (!el.textContent.trim().length) continue;
      const fg = parseColor(cs.color);
      if (!fg || fg[3] < 0.3) continue;
      const bg = effectiveBg(el);
      const bgL = lum(bg);
      const fgL = lum(fg);
      const L1 = Math.max(fgL, bgL), L2 = Math.min(fgL, bgL);
      const ratio = (L1 + 0.05) / (L2 + 0.05);
      // 只修复：背景偏浅 + 文字偏浅/橙色 导致对比度不足
      if (bgL > 0.45 && ratio < 3.0) {
        el.style.setProperty('color', '#1a1712', 'important');
      }
    }
  }
  function run() {
    setTimeout(fix, 100);
    setTimeout(fix, 500);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  window.addEventListener('load', run);
})();
