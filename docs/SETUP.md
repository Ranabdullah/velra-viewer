# Your own Vel Ra viewer

## Copy or transfer the repository

Click GitHub **Fork** to keep upstream tracking, or **Code → Download ZIP**, extract and create an empty repository. In the extracted folder:

```sh
git init
git add .
git commit -m "Initial showroom viewer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the username and repository placeholders. Transfer an existing repository through **Settings → General → Danger Zone → Transfer ownership**; the recipient accepts. Hosting accounts do not transfer with code. Never upload secrets or private client files.

## Install and customise

Install Node.js 22+, then:

```sh
npm ci
npm run dev
```

Edit page copy, tabs, materials and gallery paths in `index.html`. Replace `public/assets/model.glb` with your licensed GLB, or change the path in `src/main.js`. Adjust camera positions, scene scale, collision boxes and selectable objects there to fit the new model. Replace images in `public/assets`, `public/renders` and `public/materials`; match filenames or update references. Review the preset cameras and object IDs after changing the model.

The viewer assumes root hosting. For a subdirectory deployment, update absolute `/assets`, `/renders` and other root paths plus Vite's base setting. Do not simply publish this unchanged to a GitHub Pages project subdirectory.

## Cloudflare Workers (static assets)

```sh
npm ci
npm test
npm run build
npx wrangler login
npx wrangler whoami
```

Change `name` in `wrangler.jsonc` to a unique name for your own project, then:

```sh
npx wrangler deploy
```

Open the printed workers.dev URL. This serves static assets; no database, Supabase, API key or password is required. Review your Cloudflare plan limits. The 3D model and textures are public downloadable assets, so do not include confidential designs.

## Cloudflare Pages alternative

Connect your GitHub repository in Workers & Pages → Pages. Build command: `npm run build`; output folder: `dist`; root: this project directory. Set Node.js 22+ if the platform asks. Deploy and test the assigned pages.dev URL. For direct upload, build locally and upload `dist`, not source or node_modules.

## Verify and update

```sh
npm ci
npm audit
npm test
npm run build
npm run preview
```

Check model loading, drag/pinch, camera presets, tabs, gallery arrows, review validation and print preview on PC and phone. WebGL requires a supported GPU/browser; on older phones reduce model/texture sizes. The gallery and dossier remain useful when 3D is unavailable.

Local review preferences stay in the current browser and URL. They are not encrypted cloud backups or signed approval records. Keep source and licensed asset backups outside the browser. To update Workers, rebuild and run `npx wrangler deploy`; Git-connected Pages rebuilds on pushes.
