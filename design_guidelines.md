# LearnSnap Design Guidelines

## Design Approach

**Dual Design System**: LearnSnap requires two distinct design languages serving different audiences:
- **Parent App**: Professional, efficient, trust-building interface focused on clarity and actionable insights
- **Child App**: Playful, engaging, encouraging interface optimized for young learners (ages 6-12)

**Reference Inspiration**: Parent app draws from productivity tools like Notion and Linear for clean data presentation; Child app takes cues from Duolingo and Khan Academy Kids for gamified learning experiences.

---

## Typography System

**Parent App**:
- Font: Cairo (Arabic), Inter fallback
- Hierarchy: text-2xl/font-bold (headings), text-xl/font-semibold (subheadings), text-base/font-normal (body), text-sm/font-light (captions)
- Line height: relaxed for readability

**Child App**:
- Font: Cairo (Arabic), Fredoka fallback for playful aesthetic
- Hierarchy: text-3xl/font-bold (headings), text-2xl/font-semibold (subheadings), text-xl/font-normal (body), text-xl/font-bold (buttons)
- Larger sizes for accessibility and reduced reading fatigue

**RTL Support**: All text right-aligned with `dir="rtl"`, proper Arabic numerals, reversed layout flow

---

## Layout & Spacing

**Spacing Scale**: Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24, 32
- Component padding: p-4 to p-6 (parent), p-6 to p-8 (child)
- Section spacing: py-12 to py-20 (parent), py-16 to py-24 (child)
- Card gaps: gap-4 (parent), gap-6 (child)

**Grid Systems**:
- Parent: 2-3 column grids for children cards, reports (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Child: Single column focus on mobile, 2 columns max on desktop for lesson cards
- Max widths: max-w-7xl for parent dashboards, max-w-4xl for child learning screens

**Touch Targets**:
- Parent: h-10 minimum for buttons
- Child: h-16 minimum (64px) for large tap-friendly buttons

---

## Component Library

**Parent App Components**:

1. **Child Profile Cards**: Rounded cards (rounded-xl) with shadow-md, displaying avatar, name, recent score badge, streak fire emoji
2. **Upload Interface**: Dashed border dropzone (border-2 border-dashed), thumbnail grid preview (grid-cols-3 gap-3), delete/reorder controls
3. **Progress Indicators**: Linear progress bars with percentage, circular charts using Recharts for test scores
4. **Report Cards**: White background (bg-white), subtle shadows, color-coded sections (green for strengths, amber for improvement areas)
5. **Data Tables**: Striped rows for question breakdowns, visual checkmarks/X icons for correct/incorrect

**Child App Components**:

1. **Lesson Cards**: Large colorful cards (min-h-32) with subject-specific gradient backgrounds, emoji icons (48px), rounded-2xl corners, shadow-lg
2. **Question Containers**: Generous padding (p-8), large question text, 4 answer buttons stacked with gap-4
3. **Answer Buttons**: Full-width, h-16, rounded-xl, colored borders (3px), active state with scale transform
4. **Feedback Screens**: Full-screen overlays with confetti animation (correct) or encouraging emoji (incorrect), auto-dismiss after 2s
5. **Progress Bar**: Thick (h-3), colorful gradient fill, shows X/total questions
6. **Achievement Displays**: Large star icons (⭐ 64px), animated entrance, badge cards with shine effect

---

## Visual Elements & Images

**Images Usage**:
- Parent dashboard: No hero image needed, focus on data/cards
- Parent reports: Include small thumbnail of uploaded textbook pages
- Child app: Large decorative illustrations for each subject (math: numbers/shapes, science: beakers/planets, Arabic: calligraphy elements)
- Achievement screens: Celebratory graphics (balloons, confetti, trophy icons)

**Icons**: Lucide React throughout for consistency
- Parent: outline style, 20-24px
- Child: filled/solid style, 32-40px

**Backgrounds**:
- Parent: Clean white (bg-white) and light gray (bg-gray-50) surfaces
- Child: Gradient backgrounds - `bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100` for main screens, solid bright colors for subject cards

---

## Interactions & Animations

**Parent App**: Minimal animations
- Hover: subtle scale (scale-105) on cards
- Transitions: duration-200 for all state changes
- Loading: Simple spinner for processing states

**Child App**: Celebratory animations
- Confetti: Use canvas-confetti library on correct answers
- Button press: scale-95 active state with spring animation
- Page transitions: Slide from right (Framer Motion slideIn)
- Stars: Bounce entrance animation (animate-bounce) when earned
- NO hover states (touch-first design)

---

## Accessibility & Responsiveness

- Focus indicators: ring-2 ring-offset-2 for keyboard navigation
- Color contrast: WCAG AA minimum (4.5:1 for body text)
- Mobile-first: All layouts stack to single column below md breakpoint
- Form validation: Inline error messages in red-500, success in green-500
- Loading states: Skeleton screens during AI processing (animate-pulse)

---

## Key Pages Layout

**Parent Home**: Grid of child cards, prominent "Add Chapter" button (bg-blue-600, top right), recent activity list below

**Upload Flow**: Centered form (max-w-2xl), child selector dropdown, drag-drop zone, preview grid, submit button at bottom

**Child Learning Screen**: Full-screen layout, progress bar fixed at top, content centered (max-w-3xl), large navigation buttons at bottom

**Results Screen**: Centered celebration (confetti canvas background), stacked metrics (stars, score, time), "Continue" button prominent at bottom