# Destello Style Guide

Based on the provided source code, here is the extracted style guide including typography, colors, spacing, and grid configurations used on the Destello website.

## 🎨 Colors

**Primary & Backgrounds**
*   **Off-White / Light Background:** `#F0F0F0` (`--token-0675283b...`)
*   **Dark Gray / Primary Text:** `#262626` (`--token-c0272c60...`)
*   **Secondary Dark (Cards/Sections):** `#2E2E2E` (`--token-5c6d2f2f...`)

**Grays & Borders**
*   **Light Gray (Lines/Borders):** `#E8E8E8`, `#D1D1D1`
*   **Medium Gray (Muted Text/Icons):** `#8F8F8F`, `#878787`, `#666666`

**Accents & Transparencies**
*   **Link Color / Accent:** `#0099FF`
*   **White Transparencies:** 
    *   `10%` Opacity: `rgba(255, 255, 255, 0.1)` (`#ffffff1a`)
    *   `30%` Opacity: `rgba(255, 255, 255, 0.3)` (`#ffffff4d`)
    *   `70%` Opacity: `rgba(255, 255, 255, 0.7)` (`#ffffffb3`)

---

## 🔤 Typography

**Font Families**
*   **Primary:** `Mona Sans` (Used for headings and primary body text)
*   **Secondary:** `Inter` (Used for specific small UI elements and placeholders)

### Font Sizes & Scales
*(Format: Desktop / Tablet / Mobile)*

**Display & Headings**
*   **Display Huge:** 120px / 90px / 72px
    *   *Weight:* 500 (Medium) | *Line-height:* 0.9em | *Letter-spacing:* -0.05em
*   **H1:** 96px / 64px / 40px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.0em | *Letter-spacing:* -0.06em
*   **H2:** 72px / 52px / 34px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.1em | *Letter-spacing:* -0.05em
*   **H3:** 40px / 32px / 26px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.1em | *Letter-spacing:* -0.04em
*   **H4:** 32px / 26px / 20px
    *   *Weight:* 500 (Medium) | *Line-height:* 1.2em | *Letter-spacing:* -0.04em
*   **H5:** 24px / 20px / 18px
    *   *Weight:* 500 (Medium) | *Line-height:* 1.2em | *Letter-spacing:* -0.03em

**Body Text**
*   **Body Large:** 20px / 18px / 16px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.2em
*   **Body Standard:** 16px / 16px / 14px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.4em
*   **Caption/Small:** 14px / 14px / 12px
    *   *Weight:* 400 (Regular) | *Line-height:* 1.4em - 1.2em

*Note: Paragraph spacing is generally set to `40px` after headings and `20px` after standard paragraphs.*

---

## 📏 Spacing & Layout

### Grid System
*   **Max Container Width:** `1200px` (Main Layout), `2200px` (Ultrawide Hero/Visuals)
*   **Grid Columns:** 
    *   **Desktop:** 4-column, 3-column, and 2-column configurations (`minmax(50px, 1fr)`).
    *   **Tablet/Mobile:** Stacks down to 2-column and 1-column layouts respectively.

### Margins, Padding & Gaps
*   **Section Padding (Vertical):** Scales from `150px` / `100px` / `70px` down to `50px` / `30px`.
*   **Mobile Padding:** Standardized side padding at `14px`.
*   **Flex Gaps:** Systematic gaps used throughout the design: `10px`, `14px` (mobile), `20px`, `30px`, `50px`, and `70px`.

### UI Elements
*   **Border Radius:** 
    *   Cards & Images: `10px`
    *   Small UI Elements (Dates/Tags): `4px`
    *   Pills/Buttons: `100px` / `1000px` (Fully rounded)
*   **Borders:** Soft borders using `rgba(255, 255, 255, 0.1)` (`1px` solid) used on dark-themed cards and image overlays.
