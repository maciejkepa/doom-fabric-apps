# Doom on Microsoft Fabric Apps

The same DOOM Shareware browser game as the Databricks Apps version, packaged for
Microsoft Fabric Apps (preview). Fabric hosts the HTML, CSS, JavaScript,
WebAssembly engine, and game data. Rendering, audio, input, and gameplay run in
the browser. All game assets are bundled. No external CDN is needed.

## Architecture

1. `npm run build` copies `public/` to `dist/` without transforming the engine.
2. Rayfin CLI packages `dist/` and uploads it to Fabric Apps static hosting.
3. The user opens the hosting URL and clicks **Launch game** to unlock audio.
4. Emscripten loads `doomgeneric.js`, `doomgeneric.wasm`, and `doomgeneric.data`.

The loader resolves engine assets relative to `app.js`, including when the app
is served under a URL path prefix. The UI and controls match the original app.
Only the platform label changes to Fabric Apps.

`server.js` is a local development/preview server, not a server deployed to
Fabric. There is no Databricks `app.yaml`, container, or server port to configure
in Fabric. The game does not call Fabric data APIs or need a Lakehouse, Warehouse,
or custom data models. The Rayfin data service is disabled. Fabric authentication
is enabled and hosted assets are protected by default.

## Prerequisites

- Node.js **24 LTS recommended**. The pinned Rayfin CLI also supports Node 20 and
  22 (see `engines` in `package.json`).
- A Microsoft Entra account and a Fabric workspace assigned to Fabric capacity,
  in a region where Fabric Apps is available.
- Contributor or admin access to the workspace. Deploying an existing app needs
  at least **Edit** permission on that item.
- A tenant administrator must enable **Tenant settings > Fabric apps (preview)**
  for your user or security group in the Fabric admin portal.

See Microsoft's [creation guide](https://learn.microsoft.com/en-us/fabric/apps/create-app)
and [Fabric Apps overview](https://learn.microsoft.com/en-us/fabric/apps/overview).

## Run locally

From this repository's root:

```bash
npm ci
npm run dev
```

Open `http://localhost:8000` and click **Launch game**. `npm start` is equivalent.
Use arrows to move, **Ctrl** to fire, **Space** to open doors, **Shift** to run,
and **Esc** for the menu. Click the canvas if it loses keyboard focus.

No Fabric login is needed to test the game locally. Node serves the source assets
from `public/`. `/health` is a local-only health endpoint. Set `PORT` to change
the local port.

```bash
npm test
npm run build
npm run preview
```

Stop the development server before starting preview on the same port. Preview
serves `dist/` at `http://localhost:8000`, matching the files uploaded to Fabric.
The build contains only browser assets, not the CLI, repository metadata, or
local environment files. Runtime has no npm dependencies. Rayfin is a pinned
development dependency recorded in `package-lock.json`.

## Deploy to Fabric Apps

This repository is already a Rayfin project. Do not scaffold a new template over
it. Its deployment configuration is `rayfin/rayfin.yml`.

### First deployment

1. Open the [Fabric portal](https://app.fabric.microsoft.com/) and confirm your
   target workspace has capacity and Fabric Apps enabled.
2. From the repository root, install dependencies and verify the build:

   ```bash
   npm ci
   npm test
   npm run build
   ```

3. Sign in and inspect the deployment plan, replacing the workspace placeholder
   with your actual workspace name:

   ```bash
   npx rayfin login
   npx rayfin up --workspace "<workspace-name>" --dry-run
   ```

   The dry run validates inputs and resolves the workspace without deploying
   resources. It can still require authentication and access to Fabric.

4. Deploy the app:

   ```bash
   npx rayfin up --workspace "<workspace-name>"
   npx rayfin up status
   ```

   Rayfin creates the Fabric Apps item, applies service settings, runs the build,
   and uploads static content. The CLI prints the **hosting URL** and Fabric
   portal link. Open that hosting URL (the portal calls it **App URL**), sign in
   if prompted, and launch the game. The **App backend URL** is a separate URL
   for backend services and is not the game page.

5. Verify the game starts, sound works, keyboard input works, and fullscreen is
   available. Browser/network policies may affect fullscreen or audio.

Rayfin saves deployment identifiers in `rayfin/rayfin.yml` and local settings in
`.env.fabric-*`. Keep the updated config for subsequent deployments to the same
item. Review its workspace/item identifiers before sharing or committing it.
Environment files are ignored by Git. For a separate deployment, use a fresh
checkout and explicitly select its workspace.

### Updates

For a full update to the configured deployment:

```bash
npx rayfin up
```

After the first successful deployment, frontend-only updates can use:

```bash
npx rayfin up staticapp deploy
```

Both commands run the configured build. `npm run deploy` and
`npm run deploy:static` are equivalent shortcuts. Use `npx rayfin up status`
to inspect the deployment. Source control alone does not publish the app.

### Access to the game

The configuration uses `services.staticHosting.assetAccess: protected`. Players
must sign in and have permission to view the Fabric app. Grant **Run and interact**
access through Fabric when sharing it. This is enforced by the host, so the game
does not need a client SDK or a custom sign-in screen.

For an intentionally public demo, change `assetAccess` to `public` and run a full
`npx rayfin up`. Anyone with the hosting URL can then retrieve the game assets.
A static-content-only deployment does not apply access-setting changes. See
[static hosting documentation](https://learn.microsoft.com/en-us/fabric/apps/hosting).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| App item is unavailable | Tenant preview setting, allowed security group, supported region, and workspace capacity. |
| Deployment returns 401/403 | Run `npx rayfin login`. Verify workspace and item Edit permissions. |
| Player cannot open the game | Verify the App URL and the player's permission to view the protected app. |
| Static deploy has no endpoint | Run the first full `npx rayfin up` before using `staticapp deploy`. |
| Empty or missing output | Run `npm run build`. Check `dist/index.html` and `dist/vendor/doomgeneric/`. |
| Engine fails to load | Inspect browser requests for `.js`, `.wasm`, and `.data`. They must return assets rather than an error or login page. |
| No audio or keyboard input | Launch with an explicit click, check browser audio settings, and click the canvas. |

Fabric's compressed static deployment limit is 100 MB. The bundled browser files
total about 11 MB before compression. Keep the vendor binaries in Git. The
root `DOOM1.WAD` is retained for provenance and is already embedded in the engine
data package, so it is not copied separately into `dist/`.

### Browser login in WSL

If `npx rayfin login` does not open a browser, stop it with **Ctrl+C** and run:

```bash
npm run login:browser -- --encryption-fallback-enabled
```

Copy the entire URL printed in the terminal into your Windows browser and sign
in. Leave the terminal running until login completes. Then check your session:

```bash
npx rayfin login status
```

To select a tenant, append `--tenant <tenant-id>` to the login command.
The `--encryption-fallback-enabled` flag allows plaintext token storage when WSL
has no OS keychain. Omit it if a working keychain is available.

If the browser cannot connect to `localhost` after sign-in, check that Windows
can reach the local server running in WSL.

## Provenance and licenses

The engine and game assets are copied unchanged from the original repository.
The engine comes from GPL-2.0 `ozkl/doomgeneric`. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for provenance, source revision,
and the IWAD checksum, and [`third_party/doomgeneric/LICENSE`](third_party/doomgeneric/LICENSE)
for the license. The DOOM Shareware data has separate licensing from the engine.