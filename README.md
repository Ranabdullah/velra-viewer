# VELRA PERFUMES — Flagship Architectural Handover & Digital Twin

Luxury retail architectural handover package and interactive 3D WebGL Digital Twin for the **VELRA Perfumes Flagship Boutique**.

---

## 🏛️ Project Summary
- **Client / Brand:** VELRA Perfumes Group
- **Typology:** Luxury Boutique Perfumery Retail
- **Gross Floor Area (Visual GFA):** ~42.5 m²
- **Surveyed Footprint:** 7,300 mm Depth × 5,900 mm Front Glazing Span (5,430 mm Back Wall)
- **Status:** Stage 04 — Technical Handover (Approved for On-Site Contractor Laser Verification & Joinery Fabrication)
- **Design Studio:** Faisal 3D Design Studio
- **Version:** Rev 1.0 Final (September 2026)

---

## ✨ Features & Sections Included
1. **Executive Summary & Spatial Concept:** "Liquid Amber & Radiant Gold" luxury aesthetic, spatial zoning, and customer circulation strategy.
2. **Interactive 3D Digital Twin:** Embedded WebGL Three.js spatial viewer with 3D Walkthrough mode, Top-Down Plan mode, Dimension vectors, Camera Director Studio, and fullscreen toggle.
3. **Architectural CAD Blueprint & Zoning:** Precise vector SVG schematic showing baseline survey dimensions, joinery footprints, aisle clearances (≥ 1,200 mm), and service/WC corridor access.
4. **Key Architectural Features:** 7 technical feature specifications (Shopfront, Shelving, Consultation Island, Cashier Desk, Marble Flooring, Ceiling Lighting Coffer, Restroom Door).
5. **Materials & Finishes Moodboard:** High-resolution swatches for Italian marble, PVD brushed titanium gold, 3D geometric relief metal, and quartz counters.
6. **Technical Handover Schedules (Tabbed):**
   - *Dimensions Schedule:* Surveyed vs. Proposed vs. Site-Verification status
   - *FF&E Schedule:* Itemized codes FF-01 to FF-06 with dimensions & hardware notes
   - *Lighting Schedule:* Codes L-01 to L-05 with CCT (3000K), CRI (>95), wattage, and control protocols
   - *MEP Coordination:* Floor power drop locations, joinery driver ventilation, HVAC slot diffusers
7. **4K Master 3D Render Gallery:** 9 Ultra-HD passes (`pass1.png` to `pass9.png`) with full-screen Lightbox modal, captions, and keyboard navigation.
8. **Joinery & Fabrication Standards:** MR-MDF substrate standards, PVD coating hardness, Blum soft-close hardware, and glass safety certifications.
9. **Digital Client Review & Sign-Off Portal:** Interactive approval checklist, signee recording, approval timestamp persistence in `localStorage`, and print/PDF export trigger.
10. **Document Control & Revision Log:** Revision history and legal architectural handover notices.

---

## 🚀 Local Development & Build

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Run Local Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```
The compiled, production-ready static site will be generated in `dist/`.

---

## ☁️ Deployment Instructions

### Option 1: Cloudflare Pages via GitHub (Recommended)
1. Initialize git and push to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Velra Perfumes architectural handover and interactive 3D digital twin"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. In the **Cloudflare Dashboard**:
   - Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your repository.
   - Set **Build command**: `npm run build`
   - Set **Build output directory**: `dist`
   - Click **Save and Deploy**.

### Option 2: Cloudflare Pages Direct Upload
1. Run `npm run build`.
2. In the **Cloudflare Dashboard**, navigate to **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
3. Drag and drop the `dist/` folder.
