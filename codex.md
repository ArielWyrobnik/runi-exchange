## 2026-03-17
- **What changed**: Updated the homepage "Start Selling" button text color utility from `text-primary-foreground` to `text-secondary-foreground` in `src/pages/Index.tsx` so the label color matches the "Browse Listings" button text.
- **Why**: The previous text color rendered the "Start Selling" label effectively invisible against the button background.
- **Risks**: Very low risk; this is a single Tailwind class change affecting only hero CTA text color styling on the homepage.
