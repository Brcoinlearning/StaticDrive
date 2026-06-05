export function renderAppStyles() {
  return `    <style>
      :root {
        color-scheme: light;
        --bg: #edf1ed;
        --bg-ink: #101828;
        --surface: #ffffff;
        --surface-strong: #f9fbf8;
        --surface-soft: #e8efec;
        --surface-tint: #f2f7f4;
        --line: #d5dfd9;
        --line-strong: #93a59c;
        --text: #17201c;
        --muted: #53615b;
        --accent: #0f665d;
        --accent-strong: #094940;
        --accent-soft: #def0eb;
        --success: #166341;
        --success-soft: #e4f5ec;
        --danger: #a52824;
        --danger-soft: #fbe8e7;
        --warning: #7a4b00;
        --warning-soft: #fff1d6;
        --info: #285a8f;
        --info-soft: #e6eef8;
        --focus: #1d766d;
        --shadow: 0 18px 52px rgba(32, 49, 43, 0.12);
        --shadow-soft: 0 1px 1px rgba(31, 48, 42, 0.04), 0 18px 44px rgba(31, 48, 42, 0.08);
        --shadow-lifted: 0 22px 54px rgba(31, 48, 42, 0.12);
        --ease-out: cubic-bezier(0.32, 0.72, 0, 1);
      }

      * { box-sizing: border-box; }
      html { background: var(--bg); }
      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        color: var(--text);
        font-family: "Avenir Next", "SF Pro Display", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 14% 10%, rgba(15, 102, 93, 0.10), transparent 25%),
          radial-gradient(circle at 82% 4%, rgba(40, 90, 143, 0.07), transparent 26%),
          linear-gradient(180deg, #f7faf7 0%, var(--bg) 44%, #e7ece8 100%);
        font-size: 16px;
        min-height: 100dvh;
        font-variant-numeric: tabular-nums;
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(rgba(23, 32, 28, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(23, 32, 28, 0.03) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 72%);
      }

      a {
        color: var(--accent-strong);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }

      a:hover { color: var(--accent); }

      button, input, select, textarea {
        font: inherit;
      }

      button, a, input, select, textarea {
        -webkit-tap-highlight-color: transparent;
      }

      :focus-visible {
        outline: 3px solid color-mix(in srgb, var(--focus) 38%, transparent);
        outline-offset: 2px;
      }

      .skip-link {
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 20;
        padding: 10px 13px;
        border-radius: 12px;
        background: #fff;
        color: var(--accent-strong);
        font-weight: 760;
        text-decoration: none;
        box-shadow: 0 14px 34px rgba(13, 23, 20, 0.18);
        transform: translateY(-150%);
        transition: transform .18s var(--ease-out);
      }

      .skip-link:focus-visible {
        transform: translateY(0);
      }

      .app-shell {
        position: relative;
        z-index: 1;
        width: min(1500px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 26px 0 56px;
        display: grid;
        grid-template-columns: 268px minmax(0, 1fr);
        gap: 26px;
      }

      .side-rail {
        position: sticky;
        top: 26px;
        align-self: start;
        min-height: calc(100dvh - 52px);
        padding: 16px;
        border: 1px solid rgba(225, 244, 239, 0.11);
        border-radius: 24px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 16%),
          linear-gradient(155deg, #14231f 0%, #101815 48%, #0c1210 100%);
        color: #eaf3ef;
        box-shadow: 0 28px 80px rgba(13, 23, 20, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .brand-lockup {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        text-decoration: none;
        padding: 6px;
        border-radius: 18px;
      }

      .brand-lockup:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #fff;
      }

      .brand-lockup strong,
      .brand-lockup small {
        display: block;
      }

      .brand-lockup strong {
        line-height: 1.1;
        letter-spacing: 0;
      }

      .brand-lockup small {
        margin-top: 4px;
        color: #9eb2aa;
        font-size: 0.78rem;
      }

      .brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: #dff8f0;
        color: #094940;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 14px 30px rgba(0, 0, 0, 0.18);
      }

      .rail-nav {
        display: grid;
        gap: 7px;
        margin-top: 28px;
        padding: 8px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.035);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .rail-nav a {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 42px;
        padding: 9px 11px;
        border: 1px solid transparent;
        border-radius: 13px;
        color: #cbd9d3;
        text-decoration: none;
        transition: background-color .22s var(--ease-out), border-color .22s var(--ease-out), color .22s var(--ease-out), transform .22s var(--ease-out), box-shadow .22s var(--ease-out);
      }

      .rail-nav a:hover {
        background: rgba(223, 248, 240, 0.08);
        border-color: rgba(223, 248, 240, 0.13);
        color: #fff;
        transform: translateX(2px);
      }

      .rail-nav a:active {
        transform: translateX(2px) translateY(1px);
        background: rgba(223, 248, 240, 0.14);
      }

      .rail-nav a.active {
        background: linear-gradient(180deg, #f0fff9 0%, #d7f7ed 100%);
        border-color: rgba(255, 255, 255, 0.72);
        color: #094940;
        font-weight: 720;
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .rail-nav a.active:hover {
        background: linear-gradient(180deg, #f7fffc 0%, #e4fff6 100%);
        border-color: rgba(255, 255, 255, 0.82);
        color: #094940;
      }

      .rail-nav a.active .icon {
        stroke-width: 2.25;
      }

      .rail-nav a:focus-visible {
        outline-color: rgba(216, 255, 246, 0.58);
        outline-offset: 3px;
      }

      .rail-nav a:not(.active) .icon {
        color: #9eb2aa;
      }

      .rail-nav a:not(.active):hover .icon {
        color: #fff;
      }

      .rail-note {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        margin-top: 28px;
        padding: 13px;
        border: 1px solid rgba(223, 248, 240, 0.13);
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.045);
        color: #cbd9d3;
      }

      .rail-note p {
        line-height: 1.55;
        font-size: 0.88rem;
      }

      .page {
        min-width: 0;
      }

      .page:focus {
        outline: none;
      }

      .masthead {
        position: relative;
        overflow: hidden;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.72);
        border-radius: 24px;
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 248, 0.88)),
          var(--surface);
        box-shadow: var(--shadow);
      }

      .masthead::after {
        content: '';
        position: absolute;
        inset: auto 24px 0 auto;
        width: 38%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(15, 102, 93, 0.28), transparent);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--accent) 16%, var(--line));
        background: rgba(222, 240, 235, 0.66);
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 720;
        letter-spacing: 0;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.44fr);
        gap: 24px;
        align-items: center;
      }

      h1, h2, h3, p { margin: 0; }
      h1 {
        max-width: 24ch;
        font-size: 2.28rem;
        line-height: 1.04;
        letter-spacing: 0;
        text-wrap: balance;
      }

      .hero-copy {
        display: grid;
        gap: 12px;
      }

      .hero-copy p {
        max-width: 68ch;
        line-height: 1.65;
        color: var(--muted);
        text-wrap: pretty;
      }

      .hero-panel {
        display: grid;
        gap: 8px;
        padding: 18px;
        border: 1px solid rgba(223, 248, 240, 0.12);
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 22%),
          #101815;
        color: #eaf3ef;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
      }

      .hero-panel-title {
        font-size: 0.82rem;
        color: #9eb2aa;
      }

      .hero-panel strong {
        font-size: 1rem;
        line-height: 1.1;
      }

      .hero-panel .muted {
        color: #cbd9d3;
      }

      .search-form {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 4px;
        padding: 5px;
        border: 1px solid var(--line);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.78);
      }

      .search-form input {
        flex: 1 1 220px;
        min-width: 0;
        min-height: 40px;
        padding: 10px 13px;
        border: 0;
        border-radius: 11px;
        background: transparent;
      }

      .btn,
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 9px 16px;
        background: linear-gradient(180deg, #14766c 0%, var(--accent-strong) 100%);
        color: #fff;
        cursor: pointer;
        font-weight: 720;
        text-decoration: none;
        box-shadow: 0 10px 22px rgba(15, 102, 93, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.22);
        transition: background-color .22s var(--ease-out), border-color .22s var(--ease-out), color .22s var(--ease-out), transform .22s var(--ease-out), box-shadow .22s var(--ease-out);
      }

      .icon {
        width: 1.1em;
        height: 1.1em;
        flex: 0 0 auto;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }

      .badge .icon {
        width: 0.95em;
        height: 0.95em;
        stroke-width: 2.25;
      }

      .supporting-link .icon,
      .meta .icon {
        width: 1em;
        height: 1em;
      }

      .btn:hover,
      button:hover {
        background: linear-gradient(180deg, #198276 0%, #083f37 100%);
        color: #fff;
        text-decoration: none;
        box-shadow: 0 14px 28px rgba(15, 102, 93, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.28);
        transform: translateY(-1px);
      }

      .btn:active,
      button:active {
        transform: translateY(1px) scale(0.99);
      }

      .btn.secondary,
      button.secondary {
        background: rgba(255, 255, 255, 0.72);
        color: var(--accent-strong);
        border-color: color-mix(in srgb, var(--accent) 14%, var(--line-strong));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
      }

      .btn.secondary:hover,
      button.secondary:hover {
        background: #f6fffb;
        border-color: color-mix(in srgb, var(--accent) 42%, var(--line-strong));
        color: var(--accent-strong);
      }

      .btn.danger,
      button.danger {
        background: linear-gradient(180deg, #b9312d 0%, #841b19 100%);
      }

      .btn.danger:hover,
      button.danger:hover {
        background: #7f1d1d;
      }

      .section-stack {
        display: grid;
        gap: 18px;
        margin-top: 20px;
      }

      .toolbar,
      .flash,
      .card,
      .empty,
      .error,
      .panel {
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.76);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 249, 0.94));
        box-shadow: var(--shadow-soft);
        outline: 1px solid rgba(158, 174, 167, 0.22);
        outline-offset: -1px;
      }

      .toolbar,
      .flash,
      .card,
      .panel {
        padding: 20px;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 247, 0.94));
        box-shadow: 0 1px 1px rgba(31, 48, 42, 0.04), 0 14px 34px rgba(31, 48, 42, 0.07);
      }

      .toolbar > div:first-child {
        display: grid;
        gap: 4px;
        min-width: min(100%, 260px);
      }

      .toolbar > div:first-child strong {
        color: var(--bg-ink);
        font-size: 1.08rem;
        line-height: 1.2;
      }

      .toolbar .muted,
      .meta-grid .muted,
      .card p,
      .empty,
      .error,
      .flash {
        color: var(--muted);
      }

      .flash {
        display: grid;
        gap: 6px;
        padding: 14px 16px;
        border-left: 4px solid var(--info);
      }

      .flash strong {
        color: var(--bg-ink);
        font-size: 0.98rem;
      }

      .flash.success {
        border-color: color-mix(in srgb, var(--success) 26%, var(--line));
        background: var(--success-soft);
        border-left-color: var(--success);
      }

      .flash.error {
        border-color: color-mix(in srgb, var(--danger) 28%, var(--line));
        background: var(--danger-soft);
        border-left-color: var(--danger);
      }

      .flash.info {
        border-color: color-mix(in srgb, var(--warning) 26%, var(--line));
        background: var(--warning-soft);
        border-left-color: var(--warning);
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
        gap: 16px;
      }

      .cards.list-rows {
        display: flex;
        flex-direction: column;
        gap: 11px;
      }

      .list-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: start;
        padding: 16px 18px;
        border-color: rgba(255, 255, 255, 0.8);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 252, 250, 0.96));
        box-shadow: 0 1px 1px rgba(31, 48, 42, 0.04);
        transition: border-color .22s var(--ease-out), transform .22s var(--ease-out), box-shadow .22s var(--ease-out), background-color .22s var(--ease-out);
      }

      .list-row:hover {
        border-color: color-mix(in srgb, var(--accent) 34%, var(--line));
        background: #fbfffd;
        box-shadow: var(--shadow-lifted);
        transform: translateY(-1px);
      }

      .list-row-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        overflow: hidden;
      }

      .list-row-body h3 {
        font-size: 1.03rem;
        font-weight: 760;
        margin: 0;
        line-height: 1.22;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-row-body h3 a {
        color: var(--accent-strong);
      }

      .list-row-body .badge-row {
        margin-bottom: 2px;
      }

      .row-summary {
        margin: 2px 0;
        font-size: 0.9rem;
        color: var(--muted);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .row-meta {
        font-size: 0.84rem;
        color: color-mix(in srgb, var(--muted) 86%, var(--accent));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .list-row-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        flex-shrink: 0;
      }

      .card {
        position: relative;
        display: grid;
        gap: 14px;
        align-content: start;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 249, 0.94));
        transition: border-color .22s var(--ease-out), transform .22s var(--ease-out), box-shadow .22s var(--ease-out), background-color .22s var(--ease-out);
      }

      .card:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.92);
        box-shadow: var(--shadow-lifted);
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: start;
      }

      .card-title {
        display: grid;
        gap: 8px;
      }

      .card h2 {
        font-size: 1.15rem;
        line-height: 1.22;
        font-weight: 780;
        text-wrap: balance;
      }

      .badge-row,
      .meta,
      .action-row,
      .inline-form,
      .field-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 8px;
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-size: 0.78rem;
        font-weight: 760;
        line-height: 1;
      }

      .badge.shared {
        background: var(--success-soft);
        border-color: color-mix(in srgb, var(--success) 14%, transparent);
        color: var(--success);
      }

      .badge.private {
        background: rgba(83, 97, 91, 0.10);
        border-color: rgba(83, 97, 91, 0.10);
        color: var(--muted);
      }

      .meta {
        color: var(--muted);
        font-size: 0.9rem;
      }

      .action-row form,
      .inline-form {
        margin: 0;
      }

      .detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(310px, 0.78fr);
        gap: 18px;
      }

      .detail-main,
      .detail-side {
        display: grid;
        gap: 16px;
        align-content: start;
      }

      .preview-shell {
        display: grid;
        gap: 14px;
      }

      iframe.preview {
        width: 100%;
        min-height: 460px;
        border: 1px solid rgba(158, 174, 167, 0.42);
        border-radius: 14px;
        background: #fff;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .panel h3,
      .card h3 {
        margin-bottom: 12px;
        font-size: 1.02rem;
        line-height: 1.3;
        letter-spacing: 0;
      }

      .field-stack,
      .batch-mode-form {
        flex-direction: column;
        align-items: stretch;
      }

      textarea,
      input[type="text"],
      input[type="password"],
      input[type="search"],
      select {
        width: 100%;
        min-width: 0;
        min-height: 44px;
        padding: 11px 13px;
        border: 1px solid rgba(158, 174, 167, 0.64);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.88);
        font: inherit;
        color: var(--text);
        box-shadow: inset 0 1px 2px rgba(31, 48, 42, 0.035);
        transition: border-color .22s var(--ease-out), box-shadow .22s var(--ease-out), background-color .22s var(--ease-out);
      }

      textarea:focus,
      input[type="text"]:focus,
      input[type="password"]:focus,
      input[type="search"]:focus,
      select:focus {
        border-color: var(--focus);
        background: #fff;
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus) 12%, transparent), inset 0 1px 2px rgba(31, 48, 42, 0.035);
      }

      textarea {
        min-height: 220px;
        resize: vertical;
      }

      .batch-mode-form {
        display: grid;
        gap: 16px;
      }

      .batch-action-dock {
        display: none;
        flex-wrap: wrap;
        align-items: center;
        gap: 9px;
        padding: 12px;
        border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--line));
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(250, 255, 252, 0.94), rgba(228, 242, 236, 0.72));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86), 0 12px 28px rgba(31, 48, 42, 0.06);
      }

      .batch-mode-form.is-batch-active .batch-action-dock {
        display: flex;
      }

      .batch-mode-count {
        margin-right: auto;
        padding: 0 8px;
        color: var(--accent-strong);
        font-size: 0.9rem;
        font-weight: 720;
      }

      .batch-mode-toggle {
        min-height: 40px;
      }

      .batch-mode-toggle[aria-pressed="true"] {
        background: linear-gradient(180deg, #0f665d 0%, #073f38 100%);
        border-color: color-mix(in srgb, var(--accent) 54%, var(--line-strong));
        color: #fff;
        box-shadow: 0 12px 26px rgba(15, 102, 93, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      }

      .batch-select {
        display: none;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--accent) 14%, var(--line));
        background: rgba(255, 255, 255, 0.78);
        color: var(--accent-strong);
        align-self: start;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
        transition: background-color .22s var(--ease-out), border-color .22s var(--ease-out), transform .22s var(--ease-out), box-shadow .22s var(--ease-out);
      }

      .batch-select:hover {
        border-color: color-mix(in srgb, var(--accent) 38%, var(--line));
        background: #f6fffb;
        transform: translateY(-1px);
      }

      .batch-select input {
        width: 18px;
        height: 18px;
        margin: 0;
        accent-color: var(--accent);
      }

      .batch-mode-form.is-batch-active .batch-select {
        display: inline-flex;
      }

      .batch-mode-form.is-batch-active .list-row {
        grid-template-columns: auto 1fr auto;
      }

      .batch-mode-form.is-batch-active .owner-content-card {
        border-color: color-mix(in srgb, var(--accent) 22%, var(--line));
      }

      .batch-mode-form.is-batch-active .owner-content-card:has(.batch-select input:checked) {
        background:
          linear-gradient(180deg, #fbfffd 0%, #edf8f4 100%);
        border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
        box-shadow: 0 18px 44px rgba(15, 102, 93, 0.12);
      }

      .owner-content-card:not(.list-row) .batch-select {
        position: absolute;
        top: 16px;
        right: 16px;
      }

      .batch-mode-form.is-batch-active .owner-content-card:not(.list-row) .card-head {
        padding-right: 42px;
      }

      .batch-action-danger {
        color: var(--danger);
      }

      .batch-action-danger:hover {
        color: #7f1d1d;
      }

      .batch-action-dock button:disabled {
        opacity: 0.48;
        cursor: not-allowed;
        transform: none;
      }

      .batch-action-dock button:disabled:hover {
        background: rgba(255, 255, 255, 0.72);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
      }

      .subtle-note {
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .meta-grid > div {
        min-width: 0;
        padding: 13px;
        border-radius: 14px;
        background: rgba(233, 239, 236, 0.52);
      }

      .meta-grid span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        overflow-wrap: anywhere;
        color: var(--text);
      }

      .meta-grid strong {
        display: block;
        margin-bottom: 6px;
        font-size: 0.78rem;
        color: var(--muted);
        letter-spacing: 0;
      }

      .empty,
      .error {
        padding: 24px;
      }

      .empty {
        background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(233, 239, 236, 0.70));
      }

      .error {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .supporting-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--accent-strong);
      }

      .danger-zone {
        width: 100%;
        border: 1px solid color-mix(in srgb, var(--danger) 24%, var(--line));
        border-radius: 14px;
        padding: 12px 13px;
        background: var(--danger-soft);
      }

      .danger-zone summary {
        cursor: pointer;
        font-weight: 700;
        color: var(--danger);
      }

      .danger-zone .inline-form {
        margin-top: 10px;
      }

      .field-error {
        margin: 6px 0 0;
        color: var(--danger);
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .muted {
        color: var(--muted);
      }

      h3 .icon,
      strong .icon,
      .muted .icon {
        margin-right: 5px;
        vertical-align: -0.16em;
      }

      code {
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 0.92em;
        color: var(--bg-ink);
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (max-width: 860px) {
        .app-shell {
          grid-template-columns: 1fr;
          padding-top: 12px;
        }

        .side-rail {
          position: static;
          min-height: auto;
        }

        .rail-nav {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hero-grid,
        .detail-layout {
          grid-template-columns: 1fr;
        }

        h1 {
          max-width: none;
        }
      }

      @media (max-width: 640px) {
        .app-shell {
          width: min(100vw - 18px, 1180px);
          padding-bottom: 36px;
        }

        .side-rail,
        .masthead,
        .toolbar,
        .card,
        .panel,
        .flash,
        .empty,
        .error {
          border-radius: 14px;
        }

        .rail-nav {
          grid-template-columns: 1fr;
        }

        .masthead,
        .toolbar,
        .card,
        .panel,
        .flash,
        .empty,
        .error {
          border-radius: 14px;
        }

        .masthead {
          padding: 18px;
        }

        .meta-grid {
          grid-template-columns: 1fr;
        }

        .list-row {
          grid-template-columns: 1fr;
        }

        .batch-mode-form.is-batch-active .list-row {
          grid-template-columns: auto 1fr;
        }

        .list-row-action {
          align-items: stretch;
        }

        .batch-action-dock {
          align-items: stretch;
        }

        .batch-mode-count {
          width: 100%;
          padding: 0 2px 4px;
        }

        .search-form button,
        .search-form input,
        .action-row > .btn,
        .action-row > button,
        .inline-form,
        .inline-form button {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.001ms !important;
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    </style>`;
}
