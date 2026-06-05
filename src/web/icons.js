import { escapeHtml } from './html-utils.js';

export function renderIcon(name) {
  const icons = {
    search: '<circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 4 4"></path>',
    key: '<circle cx="7.5" cy="12.5" r="3.5"></circle><path d="M11 12.5h8"></path><path d="M16 12.5v3"></path><path d="M19 12.5v3"></path>',
    'log-out': '<path d="M9 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H9"></path><path d="M14 8l4 4-4 4"></path><path d="M18 12H9"></path>',
    share: '<circle cx="6" cy="12" r="2.5"></circle><circle cx="16.5" cy="6.5" r="2.5"></circle><circle cx="16.5" cy="17.5" r="2.5"></circle><path d="m8.3 10.8 5.9-3.1"></path><path d="m8.3 13.2 5.9 3.1"></path>',
    'share-off': '<path d="m4 4 16 16"></path><circle cx="6" cy="12" r="2.5"></circle><circle cx="16.5" cy="6.5" r="2.5"></circle><path d="m8.3 10.8 2.7-1.4"></path><path d="m13.6 15.8.6.3"></path><circle cx="16.5" cy="17.5" r="2.5"></circle>',
    trash: '<path d="M4 6h16"></path><path d="M9 6V4h6v2"></path><path d="M18 6l-.8 14H6.8L6 6"></path><path d="M10 10v6"></path><path d="M14 10v6"></path>',
    download: '<path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 19h14"></path>',
    file: '<path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v5h5"></path>',
    text: '<path d="M5 6h14"></path><path d="M7 10h10"></path><path d="M7 14h7"></path><path d="M7 18h9"></path>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
    warning: '<path d="M12 4 3 20h18z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path>',
    external: '<path d="M14 5h5v5"></path><path d="m13 11 6-6"></path><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"></path>',
    list: '<path d="M8 6h12"></path><path d="M8 12h12"></path><path d="M8 18h12"></path><path d="M4 6h.01"></path><path d="M4 12h.01"></path><path d="M4 18h.01"></path>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect>',
    arrow: '<path d="M19 12H5"></path><path d="m12 5-7 7 7 7"></path>',
    refresh: '<path d="M20 12a8 8 0 0 1-14.5 4.7"></path><path d="M4 12A8 8 0 0 1 18.5 7.3"></path><path d="M18.5 3.5v3.8h-3.8"></path><path d="M5.5 20.5v-3.8h3.8"></path>',
    check: '<path d="m5 12 4 4L19 6"></path>',
    x: '<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>',
    edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"></path><path d="m13.5 7.5 3 3"></path>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"></path>',
    play: '<path d="M8 5v14l11-7z"></path>'
  };
  const body = icons[name] || icons.file;
  return `<svg class="icon icon-${escapeHtml(name)}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${body}</svg>`;
}
