# Product

## Register

product

## Users

This service has two primary user groups with equal design priority.

- Owner users manage files and rich text published by a local agent. They work in short operational sessions: login, inspect content, search, share, revoke, update, delete, and diagnose missing local files.
- Public visitors browse or search content that has been shared by an owner. They need a calm, readable, low-friction way to understand whether a page is a rich text article, a file download, a protected item, or an unavailable item.

## Product Purpose

The product is a local static content publishing service built from PocketBase, a Node business shell, and server-rendered HTML pages. It receives files or rich text from trusted API callers, stores and indexes content, and exposes owner and public web flows without requiring a separate frontend application.

Success means:

- Owner users can trust the UI as an operational console for content state and publishing actions.
- Public visitors can find, open, read, or download shared content without seeing implementation noise.
- The UI stays faithful to the API and storage model, especially content type, sharing state, password protection, hash-based URLs, and local file health.

## Brand Personality

Quiet, precise, dependable.

The interface should feel like a calm engineering workbench: practical, restrained, and legible. It should not feel like a marketing SaaS template, a decorative blog theme, or a raw database admin panel.

## Anti-references

- Generic SaaS dashboards with oversized hero sections, gradient cards, decorative metrics, and vague productivity copy.
- Blog-like themes that make owner workflows feel secondary or hide operational state behind editorial styling.
- Terminal-only or database-console aesthetics that expose too much implementation detail to public visitors.
- Over-rounded cards, heavy shadows, tinted cream surfaces, serif-heavy UI labels, and repeated identical card grids.
- Interactions that rely on hover only, hidden focus, browser `confirm()` as the primary destructive-action pattern, or unlabeled icon-only controls.

## Design Principles

1. State before decoration: content type, sharing status, access mode, file health, and next action should be visible before any ornamental styling.
2. One shell, two modes: owner and public pages should share a visual grammar while clearly signaling permission and intent.
3. Dense when managing, spacious when reading: owner flows can be compact; public rich text and password pages should prioritize readability.
4. Standard controls earn trust: forms, buttons, lists, filters, and destructive actions should use familiar affordances and predictable focus behavior.
5. API truth is UI truth: labels and empty states should mirror the real backend model rather than inventing a separate product vocabulary.

## Accessibility & Inclusion

Target WCAG 2.2 AA for the web layer.

- Body text contrast must meet 4.5:1; large text and non-text UI indicators must meet 3:1.
- All form controls require visible labels, clear helper/error text, and keyboard-operable flows.
- Focus states must be visible on buttons, links, inputs, selects, textareas, disclosure controls, and future dialogs.
- Motion must respect `prefers-reduced-motion`; UI feedback should not depend on animation.
- Owner and public flows should remain usable on mobile, including touch targets, safe spacing, and non-overlapping text.
