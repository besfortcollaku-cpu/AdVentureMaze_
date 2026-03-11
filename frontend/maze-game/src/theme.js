let theme = localStorage.getItem("theme") || "ice";
const THEMES = new Set(["ice", "forest", "lava", "wood"]);

const listeners = new Set();
function applyBodyThemeClass(value) {
  const safeTheme = THEMES.has(value) ? value : "ice";
  document.body.classList.remove(
    "theme-ice",
    "theme-forest",
    "theme-lava",
    "theme-wood"
  );

  document.body.classList.add(`theme-${safeTheme}`);
}

export function getTheme() {
  return theme;
}

export function setTheme(nextTheme) {
  const safeTheme = THEMES.has(nextTheme) ? nextTheme : "ice";
  if (theme === safeTheme) return;

  theme = safeTheme;
  localStorage.setItem("theme", theme);

  applyBodyThemeClass(theme);

  listeners.forEach((fn) => fn(theme));
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

applyBodyThemeClass(theme);

