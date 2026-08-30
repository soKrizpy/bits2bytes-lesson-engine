// src/app/lesson/[topicId]/ThemeScript.tsx
// Injected before first paint to apply theme from URL params (avoids FOUC).
// Handles: ?theme=dark|light (sets data-theme) and ?theme=<base64json> (CSS vars).

const THEME_SCRIPT =
  '(function(){' +
  'try{' +
  'var p=new URLSearchParams(window.location.search);' +
  'var t=p.get("theme");' +
  'if(!t)return;' +
  'if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);return;}' +
  'var str=decodeURIComponent(escape(atob(t)));' +
  'var theme=JSON.parse(str);' +
  'var r=document.documentElement;' +
  'if(theme.primary)r.style.setProperty("--color-primary",theme.primary);' +
  'if(theme.primaryHover)r.style.setProperty("--color-primary-hover",theme.primaryHover);' +
  'if(theme.secondary)r.style.setProperty("--color-secondary",theme.secondary);' +
  'if(theme.background)r.style.setProperty("--color-background",theme.background);' +
  'if(theme.card)r.style.setProperty("--color-card",theme.card);' +
  'if(theme.textBase)r.style.setProperty("--color-text-base",theme.textBase);' +
  'if(theme.textMuted)r.style.setProperty("--color-text-muted",theme.textMuted);' +
  '}catch(e){}' +
  '})();';

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
