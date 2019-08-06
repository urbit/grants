let styleTimeout: NodeJS.Timer;
// Jumps page to top disabling scroll-behavior
export function jumpToTop() {
  if (typeof document === undefined && typeof window === undefined) {
    return;
  }

  clearTimeout(styleTimeout);
  const html = document.querySelector('html') as HTMLElement;
  html.setAttribute('style', 'scroll-behavior: initial;');
  window.requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    styleTimeout = setTimeout(() => html.removeAttribute('style'), 300);
  });
}
