# Moment Grid MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable “拾光排版” vertical slice that turns locally selected photos into the five approved UI screens, deterministic layout recommendations, editable ordering, caption choices, and an export-ready result backed by Spring Boot APIs.

**Architecture:** A React + TypeScript SPA owns browser photo previews and the five-step editing flow. A Spring Boot service owns project IDs, deterministic metadata-based recommendation plans, and caption candidates behind versioned REST contracts; storage is in-memory for this first slice so the UI/API contract can stabilize before PostgreSQL, object storage, and real CV models are added. Frontend API access is isolated behind a typed client so deterministic logic can later be replaced by image upload, SSE jobs, and model inference without rewriting screens.

**Tech Stack:** React, TypeScript, Vite, Material UI, Zustand, React Router, dnd-kit, Vitest, Testing Library, Playwright; Java 21, Spring Boot 4.2.x, Maven, Jakarta Validation, JUnit 5, MockMvc.

**Spec:** `plan.md`

## Global Constraints

- Preserve the approved five-screen Chinese UI: upload, analyzing, recommendations, grid editor, caption/export.
- Support 1–50 local JPEG/PNG/WebP images in the first slice; show a clear validation message for unsupported types or excess files.
- Never upload image bytes in this first slice; only filename, MIME type, size, dimensions, and local asset IDs reach the API.
- Use Material 3 tokens from the supplied HTML: primary `#0B57D0`, background `#F7F9FC`, text `#191C1E`, rounded containers, Noto Sans SC/Roboto.
- Recommendations must include 9-photo Story, 6-photo Mood, and 4-photo People plans when enough assets exist; plans must gracefully shrink when fewer assets are available.
- AI-looking outputs must be labeled as deterministic MVP recommendations in code and API metadata; do not claim real blur, face, or aesthetic detection yet.
- The API prefix is `/api/v1`; frontend DTO property names must match Java JSON property names exactly.
- Frontend build and tests must run on Node 20; backend build and tests must run with Java 21.

## Review Focus

- Zero photos or all files rejected: stay on upload and explain what to fix instead of navigating to analysis.
- Fewer than 4, 6, or 9 valid photos: produce plans with the available count and never reference a missing asset ID.
- Repeated filenames: preserve distinct client asset IDs and stable order.
- Refresh/direct navigation to a later route without workflow state: redirect to upload instead of crashing.
- Object URL lifecycle: revoke previews when photos are removed or the store is reset, but not while the editor still uses them.

---

### Task 1: Workspace and contract foundations

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/shared/api/contracts.ts`
- Create: `apps/api/pom.xml`
- Create: `apps/api/src/main/java/com/momentgrid/MomentGridApplication.java`
- Create: `apps/api/src/test/java/com/momentgrid/MomentGridApplicationTest.java`

**Interfaces:**
- Produces: `AssetInput`, `RecommendationPlan`, `AnalysisResult`, and `CaptionCandidate` TypeScript contracts mirrored by Java DTOs in Task 7.
- Produces: frontend commands `npm run test`, `npm run build`, `npm run dev`; backend command `mvn test`.

- [ ] **Step 1: Write failing workspace smoke tests**

Create `MomentGridApplicationTest.contextLoads()` and a frontend contract test that constructs one `AnalysisResult` with three plans.

- [ ] **Step 2: Run tests and verify the unimplemented workspace fails**

Run: `npm test -- --run` in `apps/web` and `mvn test` in `apps/api`.
Expected: FAIL because project manifests and application classes are not yet complete.

- [ ] **Step 3: Add the minimal Vite/Vitest and Spring Boot projects**

Use Java package `com.momentgrid`; set Maven compiler release to 21; use React TypeScript and jsdom testing. Keep root README commands explicit for Windows PowerShell.

- [ ] **Step 4: Install dependencies and run both smoke tests**

Run: `npm install`, `npm test -- --run`, `npm run build`, then run Maven with `JAVA_HOME=D:\IntelliJ IDEA 2024.2.1\jbr`.
Expected: frontend test/build and backend test exit 0.

- [ ] **Step 5: Commit**

```bash
git add .gitignore README.md apps/web apps/api
git commit -m "chore: scaffold moment grid workspace"
```

### Task 2: Material 3 app shell and workflow state

**Files:**
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/theme.ts`
- Create: `apps/web/src/app/AppShell.tsx`
- Create: `apps/web/src/app/RouteGuard.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/src/store/workflowStore.ts`
- Create: `apps/web/src/store/workflowStore.test.ts`
- Create: `apps/web/src/app/App.test.tsx`

**Interfaces:**
- Produces: `useWorkflowStore` with `photos`, `projectId`, `analysis`, `selectedPlanId`, `selectedCaptionId`, `setPhotos`, `setAnalysis`, `selectPlan`, `selectCaption`, `reorderSelectedPhotos`, and `reset`.
- Produces: routes `/`, `/analyzing`, `/recommendations`, `/editor`, `/export`.

- [ ] **Step 1: Write failing store and route-guard tests**

Assert `setPhotos` preserves duplicate filenames with different IDs, `reorderSelectedPhotos` is stable, `reset` clears workflow state, and direct navigation to `/editor` redirects to `/` when no photos exist.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/store/workflowStore.test.ts src/app/App.test.tsx`.
Expected: FAIL because store, routes, and theme do not exist.

- [ ] **Step 3: Implement the app shell, theme tokens, routes, and store**

Keep desktop content responsive and mobile-first; shared top/bottom navigation must not duplicate page logic.

- [ ] **Step 4: Run focused tests and build**

Run: `npm test -- --run src/store/workflowStore.test.ts src/app/App.test.tsx && npm run build`.
Expected: PASS and successful production build.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "feat: add material app shell and workflow state"
```

### Task 3: Upload home page and browser photo ingestion

**Files:**
- Create: `apps/web/src/features/upload/UploadPage.tsx`
- Create: `apps/web/src/features/upload/PhotoDropzone.tsx`
- Create: `apps/web/src/features/upload/photoIngestion.ts`
- Create: `apps/web/src/features/upload/photoIngestion.test.ts`
- Create: `apps/web/src/features/upload/UploadPage.test.tsx`
- Create: `apps/web/src/shared/components/MomentsPreview.tsx`

**Interfaces:**
- Produces: `ingestPhotoFiles(files: File[]): Promise<{ accepted: PhotoAsset[]; rejected: RejectedFile[] }>`.
- Produces: `PhotoAsset { id, file, previewUrl, name, mimeType, size, width, height, originalIndex }`.
- Consumes: `useWorkflowStore.setPhotos` and navigation to `/analyzing`.

- [ ] **Step 1: Write failing ingestion and upload interaction tests**

Assert supported MIME filtering, 50-file cap, stable unique IDs for repeated names, zero-valid-file error, object URL creation, and successful navigation after selection.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/features/upload`.
Expected: FAIL because upload feature is absent.

- [ ] **Step 3: Implement the supplied homepage as React components**

Recreate the approved brand header, hero, dropzone, preset chips, three-step explanation, nine-grid preview, privacy note, and fixed action bar. Use semantic buttons and keyboard-accessible file input.

- [ ] **Step 4: Run upload tests and build**

Run: `npm test -- --run src/features/upload && npm run build`.
Expected: PASS; build contains no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/upload apps/web/src/shared/components
git commit -m "feat: add photo upload experience"
```

### Task 4: Analysis progress and typed API client

**Files:**
- Create: `apps/web/src/shared/api/momentGridApi.ts`
- Create: `apps/web/src/shared/api/momentGridApi.test.ts`
- Create: `apps/web/src/features/analysis/AnalysisPage.tsx`
- Create: `apps/web/src/features/analysis/AnalysisPage.test.tsx`
- Create: `apps/web/src/features/analysis/AnalysisProgress.tsx`

**Interfaces:**
- Produces: `createProject(): Promise<ProjectResponse>`.
- Produces: `analyzeProject(projectId: string, assets: AssetInput[]): Promise<AnalysisResult>`.
- Consumes: local `PhotoAsset` metadata; stores `projectId` and `analysis`; navigates to `/recommendations`.

- [ ] **Step 1: Write failing API and analysis-page tests**

Mock fetch to assert `/api/v1/projects` then `/api/v1/projects/{id}/analysis`, exact metadata payload, progress labels from the supplied screen, success navigation, retry behavior, and unmount safety.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/shared/api src/features/analysis`.
Expected: FAIL because API client and page are missing.

- [ ] **Step 3: Implement API client and progressive analysis UI**

Animate visible stages while the request is pending, but let the server result determine completion; on error show retry and preserve photos.

- [ ] **Step 4: Run focused tests and build**

Run: `npm test -- --run src/shared/api src/features/analysis && npm run build`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/api apps/web/src/features/analysis
git commit -m "feat: add analysis workflow"
```

### Task 5: Recommendation comparison and plan selection

**Files:**
- Create: `apps/web/src/features/recommendations/RecommendationsPage.tsx`
- Create: `apps/web/src/features/recommendations/RecommendationCard.tsx`
- Create: `apps/web/src/features/recommendations/RecommendationGrid.tsx`
- Create: `apps/web/src/features/recommendations/RecommendationsPage.test.tsx`

**Interfaces:**
- Consumes: `AnalysisResult.plans` and photo previews mapped by asset ID.
- Produces: selected plan in `useWorkflowStore.selectPlan(planId)` and navigation to `/editor`.

- [ ] **Step 1: Write failing recommendation tests**

Assert Story/Mood/People cards, score and reasons, exact available photo counts for undersized inputs, no broken image references, expandable explanation, and selected-plan navigation.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/features/recommendations`.
Expected: FAIL because recommendation components are absent.

- [ ] **Step 3: Implement the supplied recommendation page**

Preserve the three approved cards and Chinese microcopy; render grids from real local previews rather than hard-coded remote images.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run src/features/recommendations && npm run build`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/recommendations
git commit -m "feat: add recommendation selection"
```

### Task 6: Sortable grid editor

**Files:**
- Create: `apps/web/src/features/editor/EditorPage.tsx`
- Create: `apps/web/src/features/editor/SortablePhotoGrid.tsx`
- Create: `apps/web/src/features/editor/PhotoTray.tsx`
- Create: `apps/web/src/features/editor/EditorToolbar.tsx`
- Create: `apps/web/src/features/editor/EditorPage.test.tsx`
- Create: `apps/web/src/features/editor/gridLayout.ts`
- Create: `apps/web/src/features/editor/gridLayout.test.ts`

**Interfaces:**
- Consumes: selected `RecommendationPlan` and `PhotoAsset[]`.
- Produces: reordered plan asset IDs and grid count changes constrained to available photos.
- Produces: navigation to `/export` after editing.

- [ ] **Step 1: Write failing layout and editor tests**

Assert 4/6/9 layouts, safe shrink for insufficient photos, keyboard-accessible reorder, photo replacement without duplicate slot IDs, selected position state, and next-step navigation.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/features/editor`.
Expected: FAIL because editor components are missing.

- [ ] **Step 3: Implement the supplied editor with dnd-kit**

Prioritize sortable grid, replacement tray, layout switcher, visual recommendation cards, and filter presets. Cropping, stickers, and real image filters are visible disabled/preview controls in this first slice, not fake completed features.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run src/features/editor && npm run build`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/editor
git commit -m "feat: add sortable grid editor"
```

### Task 7: Caption and export experience

**Files:**
- Create: `apps/web/src/features/export/ExportPage.tsx`
- Create: `apps/web/src/features/export/CaptionList.tsx`
- Create: `apps/web/src/features/export/PublishOrder.tsx`
- Create: `apps/web/src/features/export/exportGrid.ts`
- Create: `apps/web/src/features/export/ExportPage.test.tsx`
- Create: `apps/web/src/features/export/exportGrid.test.ts`

**Interfaces:**
- Consumes: selected photos, captions, selected caption ID, and current ordering.
- Produces: clipboard text via `navigator.clipboard.writeText`.
- Produces: one composite PNG through `exportGrid(photos, layout): Promise<Blob>` using Canvas.

- [ ] **Step 1: Write failing caption/export tests**

Assert six caption styles, caption selection, clipboard success/failure feedback, exact numbered publish order, canvas dimensions for 1/4/6/9 layouts, and cross-origin/image decode failure messaging.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --run src/features/export`.
Expected: FAIL because export feature is absent.

- [ ] **Step 3: Implement the supplied caption/export page**

Keep the realistic Moments preview and generate a downloadable local PNG. Do not claim server-side original-quality export in this slice.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run src/features/export && npm run build`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/export
git commit -m "feat: add captions and grid export"
```

### Task 8: Spring Boot project, deterministic analysis, and captions

**Files:**
- Create: `apps/api/src/main/java/com/momentgrid/project/ProjectController.java`
- Create: `apps/api/src/main/java/com/momentgrid/project/ProjectService.java`
- Create: `apps/api/src/main/java/com/momentgrid/project/InMemoryProjectRepository.java`
- Create: `apps/api/src/main/java/com/momentgrid/analysis/AnalysisController.java`
- Create: `apps/api/src/main/java/com/momentgrid/analysis/AnalysisService.java`
- Create: `apps/api/src/main/java/com/momentgrid/analysis/DeterministicRecommendationEngine.java`
- Create: `apps/api/src/main/java/com/momentgrid/caption/CaptionFactory.java`
- Create: `apps/api/src/main/java/com/momentgrid/api/ApiDtos.java`
- Create: `apps/api/src/main/java/com/momentgrid/config/WebConfig.java`
- Create: `apps/api/src/main/resources/application.yml`
- Create: `apps/api/src/test/java/com/momentgrid/project/ProjectControllerTest.java`
- Create: `apps/api/src/test/java/com/momentgrid/analysis/AnalysisControllerTest.java`
- Create: `apps/api/src/test/java/com/momentgrid/analysis/DeterministicRecommendationEngineTest.java`

**Interfaces:**
- Produces: `POST /api/v1/projects -> { projectId, status }`.
- Produces: `POST /api/v1/projects/{projectId}/analysis` consuming `{ assets: AssetInput[], scene: string }` and returning `AnalysisResult`.
- Produces: exactly the DTO field names defined in `apps/web/src/shared/api/contracts.ts`.

- [ ] **Step 1: Write failing service and MockMvc tests**

Assert project creation, unknown-project 404, 1/3/4/6/9/12 asset behavior, no missing/duplicate asset IDs per plan, stable deterministic order, three plan kinds, six caption styles, validation for empty and >50 assets, and CORS for the Vite dev origin.

- [ ] **Step 2: Run backend tests and verify failure**

Run: `mvn test` with Java 21.
Expected: FAIL because controllers and engine are absent.

- [ ] **Step 3: Implement the minimal in-memory API**

Use immutable records for DTOs, a thread-safe repository, validation annotations, and one error response shape `{ code, message, fieldErrors }`. Recommendation selection must be deterministic from metadata and original index; include `engineVersion: "metadata-mvp-v1"`.

- [ ] **Step 4: Run backend tests**

Run: `mvn test` with Java 21.
Expected: PASS with zero failures and errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: add project analysis api"
```

### Task 9: End-to-end integration and delivery verification

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/moment-grid-flow.spec.ts`
- Create: `docker-compose.yml`
- Modify: `README.md`
- Modify: `apps/web/vite.config.ts`

**Interfaces:**
- Consumes: running API at `http://localhost:8080` through Vite `/api` proxy.
- Produces: a verified flow from local photo selection to recommendation, reorder, caption selection, and PNG download.

- [ ] **Step 1: Write the failing Playwright happy-path and recovery tests**

Use generated in-memory image fixtures. Assert five-page navigation, three recommendation cards, drag/reorder result, clipboard action, download event, API-offline retry, and direct-route guard.

- [ ] **Step 2: Run E2E and verify failure before integration fixes**

Run: `npm run e2e` from `apps/web` with backend running.
Expected: FAIL until proxy, startup scripts, and browser fixtures are complete.

- [ ] **Step 3: Add dev orchestration and finish integration seams**

Document two-terminal startup; `docker-compose.yml` only reserves future PostgreSQL/Redis/MinIO services and is not required for this in-memory slice.

- [ ] **Step 4: Run full verification**

Run frontend unit tests, frontend production build, backend tests, and Playwright E2E.
Expected: all commands exit 0; no skipped core flow tests.

- [ ] **Step 5: Commit**

```bash
git add README.md docker-compose.yml apps/web
git commit -m "test: verify moment grid vertical slice"
```

