/**
 * Card-to-hero morph on navigation (cross-document View Transitions, Chrome/Edge and Safari
 * 18.2+; other browsers simply load the page). Names must be unique per page, and the same title
 * can sit in several rows, so only the clicked link's image gets the name, at click time.
 */
document.addEventListener('click', (e) => {
  const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="/title/"]');
  if (!link || e.defaultPrevented) return;
  document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach((el) => {
    el.style.viewTransitionName = '';
  });
  const img = link.querySelector('img') ?? link.closest('[data-preview]')?.querySelector('img');
  if (img) img.style.viewTransitionName = 'title-art';
});
