# Halaq Al Basha - Apple Design System

## PATTERN: App-Centric + Task Flow
- Conversion: Emotion-driven with trust elements
- CTA: Above fold, repeated after key actions
- Sections: Hero → Services → Booking Flow → Confirmation

## STYLE: iOS Human Interface Guidelines (HIG)
- Keywords: Clean, precise, depth through elevation, system fonts, SF-style, generous whitespace
- Best For: Premium service apps, booking platforms, utility apps
- Performance: cost:low | Accessibility: risk:low; verify contrast requirements

## COLORS (Apple System Colors)

### Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| background | `oklch(0.99 0.002 90)` | Page background (#FAFAFA) |
| foreground | `oklch(0.15 0.01 60)` | Primary text (#1D1D1F) |
| card | `oklch(1 0 0)` | Card backgrounds (#FFFFFF) |
| primary | `oklch(0.55 0.16 250)` | System Blue (#007AFF) |
| primary-foreground | `oklch(0.99 0 0)` | White text on primary |
| secondary | `oklch(0.96 0.005 90)` | Secondary backgrounds (#F2F2F7) |
| muted-foreground | `oklch(0.45 0.01 60)` | Secondary text (#8E8E93) |
| success | `oklch(0.6 0.17 155)` | System Green (#34C759) |
| destructive | `oklch(0.6 0.2 25)` | System Red (#FF3B30) |
| warning | `oklch(0.75 0.15 80)` | System Orange (#FF9500) |
| border | `oklch(0.92 0.005 90)` | Subtle borders (#E5E5EA) |

### Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| background | `oklch(0.13 0.005 60)` | Page background (#000000) |
| foreground | `oklch(0.97 0.003 90)` | Primary text (#F2F2F7) |
| card | `oklch(0.18 0.008 60)` | Card backgrounds (#1C1C1E) |
| primary | `oklch(0.65 0.16 250)` | System Blue (#0A84FF) |
| secondary | `oklch(0.22 0.008 60)` | Secondary (#2C2C2E) |
| muted-foreground | `oklch(0.65 0.01 70)` | Secondary text (#8E8E93) |
| border | `oklch(1 0 0 / 0.08)` | Subtle borders (#38383A) |

## TYPOGRAPHY

### Font Stack
```css
--font-sans: "Cairo", system-ui, -apple-system, sans-serif;
--font-display: "Cairo", system-ui, -apple-system, sans-serif;
```

### Type Scale (Apple-inspired)
| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Large Title | 34px | 900 | 1.2 | Hero headlines |
| Title 1 | 28px | 900 | 1.25 | Section headers |
| Title 2 | 22px | 700 | 1.3 | Card titles |
| Title 3 | 20px | 700 | 1.35 | Subsection headers |
| Headline | 17px | 700 | 1.4 | Important labels |
| Body | 17px | 400 | 1.5 | Primary content |
| Callout | 16px | 400 | 1.45 | Secondary content |
| Subhead | 15px | 600 | 1.4 | Card body text |
| Footnote | 13px | 600 | 1.4 | Section labels |
| Caption 2 | 11px | 600 | 1.35 | Metadata |

## SPACING SCALE
| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight gaps |
| space-2 | 8px | Icon gaps |
| space-2.5 | 10px | Card inner spacing |
| space-3 | 12px | Compact layouts |
| space-4 | 16px | Standard padding |
| space-5 | 20px | Section spacing |
| space-6 | 24px | Large section gaps |
| space-8 | 32px | Major sections |
| space-10 | 40px | Page margins |

## BORDER RADIUS
| Token | Value | Usage |
|-------|-------|-------|
| rounded-lg | 0.5rem (8px) | Small elements |
| rounded-xl | 0.75rem (12px) | Buttons, inputs |
| rounded-2xl | 1rem (16px) | Cards, modals |
| rounded-3xl | 1.25rem (20px) | Large cards, hero |
| rounded-[0.85rem] | 0.85rem (13.6px) | Icon containers |

## SHADOWS (Apple-style layered)
```css
--shadow-card: 0 1px 3px oklch(0 0 0 / 0.04), 0 4px 12px -2px oklch(0 0 0 / 0.06);
--shadow-elevated: 0 2px 8px oklch(0 0 0 / 0.04), 0 8px 24px -4px oklch(0 0 0 / 0.08);
--shadow-luxe: 0 8px 32px -4px oklch(0.55 0.16 250 / 0.2);
```

## KEY EFFECTS

### Glass Morphism (iOS-style)
```css
.glass {
  background: color-mix(in oklab, var(--card) 80%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid color-mix(in oklab, var(--border) 60%, transparent);
}
```

### Micro-interactions
- **Entry**: `cubic-bezier(0.32, 0.72, 0, 1)` (Apple spring)
- **Exit**: `cubic-bezier(0.32, 0.72, 0, 1)` (decelerate)
- **Duration**: 300-500ms for page transitions, 150-200ms for feedback
- **Scale on tap**: `active:scale-[0.97]` for buttons, `active:scale-[0.98]` for cards

### Icon Guidelines
- strokeWidth: 1.5 for all Lucide icons
- Size: 20-22px for navigation, 24px for actions
- Consistent optical weight

## ANTI-PATTERNS TO AVOID
- ❌ Bright neon colors
- ❌ Harsh/linear animations
- ❌ AI purple/pink gradients
- ❌ Borders heavier than 1px
- ❌ Shadows darker than oklch(0 0 0 / 0.1)
- ❌ Text smaller than 13px for readable content
- ❌ Hover-only interactions (no touch feedback)
- ❌ Missing focus states for keyboard navigation
- ❌ Ignoring prefers-reduced-motion

## PRE-DELIVERY CHECKLIST
- [ ] No emojis as icons (use Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Interaction timing follows platform conventions
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Text reflows without clipping at 375px
- [ ] Touch targets 44pt minimum
- [ ] 8px minimum spacing between touch targets
