---
kind: external_dependency
name: Tailwind CSS — UI framework loaded via CDN
slug: tailwind-css
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - index.html
---

CareerCompass prototype loads Tailwind CSS directly from the Tailwind CDN (`cdn.tailwindcss.com`) in `index.html`. No build step, bundler, or local install is used; all styling is applied through utility classes and a small inline `tailwind.config` that extends the theme with brand colors and the Inter font family.