# Fortune Telling Design System

## Direction

- Aesthetic: project-specific Eastern Art Deco with a quiet, therapeutic tone.
- Preserve the existing visual identity. F-Droid review fixes must not introduce a redesign.
- Primary experience: portrait Android phones; Web is a secondary rendering target.

## Color and type

- Tarot background: `#0f051d`; layered gradient from `#1a0b2e` to `#05020a`.
- Tarot text: `#e9d5ff`; accent: `#ffcc33`; secondary: `#b388ff`.
- Zen background: `#fdfcf0`; text: `#2d3436`; accent: `#4a4a4a`.
- Display type: Cinzel 700 for Latin headings and Noto Serif SC for Chinese text.
- Do not add network-fetched fonts or assets; F-Droid builds must remain reproducible and offline-capable.

## Layout

- Mobile-first. The outer content container owns the maximum width and horizontal gutter.
- Phone gutter: 20dp; content maximum: 420dp including its gutter.
- Child cards stretch into the parent's content box. Do not combine nested `width: "100%"` declarations with padding/borders.
- No horizontal scrolling or clipped borders at 320dp, 360dp, or 411dp widths.
- Prefer flex/stretch semantics over calculations based on a module-level `Dimensions.get()` value.
- Maintain a 4/8dp spacing rhythm and at least 44dp touch targets.

## Components

- Cards: 1dp theme border, 16-24dp radius, translucent theme surface, no layout-shifting interaction.
- Primary almanac card: centered hierarchy; long Chinese text wraps within the content box.
- Forms and result cards follow the same horizontal contract as the home card.
- Paired hexagrams stack vertically with a downward transition arrow; they must never enlarge the page width.

## Accessibility and QA

- Keep theme contrast and existing accessibility labels intact.
- Verify native Android rendering; React Native Web screenshots are not sufficient evidence for Yoga layout.
- Required widths: 320dp, 360dp, 411dp. Required views: home, astrology form/result, I Ching result.
- Store screenshots must be generated from an actually verified layout and inspected for clipping.
