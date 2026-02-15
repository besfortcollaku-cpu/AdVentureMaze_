let theme = localStorage.getItem("theme") || "ice";

const listeners = new Set();

export function getTheme() {
  return theme;
}

export function setTheme(nextTheme) {
  if (theme === nextTheme) return;

  theme = nextTheme;
  localStorage.setItem("theme", theme);

  listeners.forEach((fn) => fn(theme));
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}