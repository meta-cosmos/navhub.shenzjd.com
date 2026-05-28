# UX Interaction Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 12 UX interaction issues across 3 priority batches, committed in 3 separate commits.

**Architecture:** Each batch is independent and can be committed separately. Batch 1 fixes critical broken/overlapping systems (toast, sync feedback, dead code, offline). Batch 2 improves interaction polish (menus, animations, loading states). Batch 3 adds validation and visual completeness.

**Tech Stack:** React 19, Next.js 16 App Router, Tailwind CSS v4, Vitest, Zod

---

## Batch 1: Critical Experience Fixes

### Task 1: Migrate SyncStatus from imperative toast to context toast

**Files:**
- Modify: `src/components/SyncStatus.tsx:11`
- Modify: `src/components/SyncStatus.tsx:56-89`

- [ ] **Step 1: Update SyncStatus imports and usage**

Replace the imperative `showToast` import with the context-based `useToast` hook.

In `src/components/SyncStatus.tsx`, change line 11 from:
```tsx
import { showToast } from "@/components/Toast";
```
to:
```tsx
import { useToast } from "@/components/ui/toast";
```

Then add `useToast()` inside the `SyncStatus` function body, after `const [mounted, setMounted] = useState(false);` (around line 19):
```tsx
const { showToast } = useToast();
```

- [ ] **Step 2: Verify build**

Run: `npm run type-check`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/SyncStatus.tsx
git commit -m "refactor(sync-status): migrate to context-based toast"
```

### Task 2: Delete imperative Toast.tsx and clean up imports

**Files:**
- Delete: `src/components/Toast.tsx`

- [ ] **Step 1: Delete Toast.tsx**

Run: `rm src/components/Toast.tsx`

- [ ] **Step 2: Verify no remaining imports**

Run: `grep -r "from.*components/Toast" src/ --include="*.ts" --include="*.tsx"`
Expected: No results (empty output)

- [ ] **Step 3: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(toast): remove duplicate imperative toast system"
```

### Task 3: Add sync failure user feedback in SitesContext

**Files:**
- Modify: `src/contexts/SitesContext.tsx:224-242`

- [ ] **Step 1: Add useToast import**

In `src/contexts/SitesContext.tsx`, add after line 8:
```tsx
import { useToast } from "@/components/ui/toast";
```

- [ ] **Step 2: Call useToast inside SitesProvider**

Inside `SitesProvider` function (after line 53), add:
```tsx
const { showToast } = useToast();
```

- [ ] **Step 3: Add toast error feedback in syncToGitHub**

Replace the `syncToGitHub` function (lines 224-242) with:

```tsx
const syncToGitHub = useCallback(
  async (immediateSync = false) => {
    if (!githubToken || isGuestMode) return;
    const navData = loadFromLocalStorage();
    if (!navData) return;

    if (immediateSync) {
      try {
        await syncNow(navData);
      } catch (error) {
        console.error("同步失败:", error);
        const msg = error instanceof Error ? error.message : "同步失败";
        showToast(msg, "error");
        sync(navData);
      }
    } else {
      sync(navData);
    }
  },
  [githubToken, sync, syncNow, isGuestMode, showToast]
);
```

- [ ] **Step 4: Move ToastProvider above SitesProvider in layout**

In `src/app/layout.tsx`, swap the order so `ToastProvider` wraps `SitesProvider`:

```tsx
<ErrorBoundary>
  <ToastProvider>
    <SitesProvider>
      <ServiceWorkerRegister />
      <UpdateBanner />
      {children}
    </SitesProvider>
  </ToastProvider>
</ErrorBoundary>
```

- [ ] **Step 5: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/contexts/SitesContext.tsx src/app/layout.tsx
git commit -m "fix(sync): show toast on sync failure"
```

### Task 4: Remove BottomNav dead code

**Files:**
- Delete: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Verify no imports**

Run: `grep -r "BottomNav" src/ --include="*.ts" --include="*.tsx"`
Expected: Only the file itself

- [ ] **Step 2: Delete file**

Run: `rm src/components/layout/BottomNav.tsx`

- [ ] **Step 3: Verify build**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "cleanup: remove unused BottomNav component"
```

### Task 5: Fix Service Worker offline experience

**Files:**
- Modify: `public/sw.js:86-112`

- [ ] **Step 1: Update SW to cache navigation responses**

The SW already caches successful navigation responses on line 93-95. The problem is `APP_SHELL_URL` (`/`) is never in cache because `STATIC_CACHE_URLS` is empty. Fix: when offline navigation has no cached response, return the most recently cached navigation response instead of a plain "Offline" string.

Replace lines 99-108 in `public/sw.js`:
```js
.catch(() => {
  return caches.match(event.request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }
    if (event.request.mode === "navigate") {
      // Return any cached navigation page as fallback
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(new Request(APP_SHELL_URL, { mode: "navigate" }));
      }).then((appShell) => {
        if (appShell) return appShell;
        return new Response(
          "<!DOCTYPE html><html><head><meta charset='utf-8'><title>离线</title>" +
          "<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#333}" +
          "div{text-align:center}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#666}</style></head>" +
          "<body><div><h1>无法连接网络</h1><p>请检查网络连接后重试</p></div></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      });
    }
    return new Response("Offline");
  });
})
```

- [ ] **Step 2: Bump cache version**

Change line 6 from:
```js
const CACHE_NAME = "navhub-v4";
```
to:
```js
const CACHE_NAME = "navhub-v5";
```

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: PASS (SW is plain JS, not type-checked, but other files should still pass)

- [ ] **Step 4: Commit Batch 1**

```bash
git add public/sw.js
git commit -m "fix(offline): return cached page instead of blank text when offline"
```

---

## Batch 2: Interaction Details

### Task 6: Context menu viewport awareness

**Files:**
- Modify: `src/components/SiteCard.tsx:171-229`

- [ ] **Step 1: Add viewport-aware positioning**

Add a `useEffect` and state to track menu position. In `SiteCard.tsx`, add after `const contextMenuRef = useRef<HTMLDivElement>(null);` (line 49):

```tsx
const [menuPosition, setMenuPosition] = useState<{ top?: string; bottom?: string; left?: string; right?: string }>({});
```

Add a `useEffect` after the existing `isContextMenuOpen` effect (after line 69):

```tsx
useEffect(() => {
  if (!isContextMenuOpen || !contextMenuRef.current || !cardRef.current) {
    setMenuPosition({});
    return;
  }
  const menuEl = contextMenuRef.current;
  const cardRect = cardRef.current.getBoundingClientRect();
  const menuRect = menuEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const pos: typeof menuPosition = {};
  if (view === "grid") {
    const spaceBelow = vh - cardRect.bottom;
    const spaceAbove = cardRect.top;
    pos.left = cardRect.left + menuRect.width > vw ? undefined : "0";
    pos.right = cardRect.left + menuRect.width > vw ? "0" : undefined;
    if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
      pos.bottom = "100%";
      pos.top = undefined;
    } else {
      pos.top = "100%";
      pos.bottom = undefined;
    }
    pos.marginTop = pos.bottom ? undefined : "0.5rem";
    pos.marginBottom = pos.bottom ? "0.5rem" : undefined;
  } else {
    pos.left = cardRect.left + cardRect.width + menuRect.width > vw ? undefined : "1rem";
    pos.right = cardRect.left + cardRect.width + menuRect.width > vw ? "0" : undefined;
  }
  setMenuPosition(pos);
}, [isContextMenuOpen, view]);
```

Update the context menu `<div>` (line 176-184) to use `menuPosition`:

Replace the `className` position classes on the menu container div. Change:
```tsx
view === "grid" ? "top-full mt-2 left-0" : "left-4 top-1/2 -translate-y-1/2",
```
to:
```tsx
view === "grid"
  ? `${menuPosition.bottom ? "bottom-full mb-2" : "top-full mt-2"} ${menuPosition.right ? "right-0" : "left-0"}`
  : `${menuPosition.right ? "right-4" : "left-4"} top-1/2 -translate-y-1/2`,
```

- [ ] **Step 2: Verify build**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteCard.tsx
git commit -m "fix(site-card): context menu viewport-aware positioning"
```

### Task 7: Error banner dismiss button

**Files:**
- Modify: `src/contexts/SitesContext.tsx:21-44` (add clearError to interface)
- Modify: `src/contexts/SitesContext.tsx:337-361` (add clearError to provider value)
- Modify: `src/app/page.tsx:42-50` (destructure clearError)
- Modify: `src/app/page.tsx:193-197` (add close button)

- [ ] **Step 1: Add clearError to SitesContext**

In `src/contexts/SitesContext.tsx`, add to the `SitesContextType` interface (after line 31):
```tsx
clearError: () => void;
```

In the provider value (around line 339), add:
```tsx
clearError: () => setError(null),
```

- [ ] **Step 2: Add dismiss button to error banner**

In `src/app/page.tsx`, add `clearError` to the destructured values from `useSites()` (line 43):
```tsx
const { sites: categories, loading, error, clearError, refreshSites, isGuestMode, addCategory, updateSites } = useSites();
```

Replace the error banner (lines 193-197):
```tsx
{error && (
  <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-lg)] text-[var(--error)] mb-4 flex items-center justify-between gap-2">
    <span>{error}</span>
    <button
      onClick={clearError}
      className="text-[var(--error)] hover:text-[var(--error)]/70 transition-colors p-1 cursor-pointer"
      aria-label="关闭错误提示"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
)}
```

Add `X` to the lucide-react import on line 10:
```tsx
import { Plus, Trash2, Keyboard, X } from "lucide-react";
```

- [ ] **Step 3: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/contexts/SitesContext.tsx src/app/page.tsx
git commit -m "fix(error-banner): add dismiss button to error messages"
```

### Task 8: Favicon loading state

**Files:**
- Modify: `src/components/FaviconImage.tsx`

- [ ] **Step 1: Add loading state**

Replace the entire `FaviconImage.tsx`:

```tsx
"use client";

import Image from "next/image";
import { Globe, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getRenderableFaviconUrl } from "@/lib/favicon-url";

interface FaviconImageProps {
  src?: string;
  alt: string;
  fill?: boolean;
  size?: number;
  imageClassName?: string;
  fallbackClassName?: string;
  iconClassName?: string;
}

export function FaviconImage({
  src,
  alt,
  fill = false,
  size = 24,
  imageClassName,
  fallbackClassName,
  iconClassName,
}: FaviconImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const resolvedSrc = useMemo(() => getRenderableFaviconUrl(src), [src]);
  const shouldShowImage = Boolean(resolvedSrc) && failedSrc !== resolvedSrc;

  if (shouldShowImage) {
    if (fill) {
      return (
        <>
          {isLoading && (
            <div className={cn("absolute inset-0 flex items-center justify-center animate-pulse", fallbackClassName)}>
              <Loader2 className={cn("w-4 h-4 animate-spin text-[var(--muted-foreground)]", iconClassName)} />
            </div>
          )}
          <Image
            src={resolvedSrc!}
            alt={alt}
            fill
            className={cn(imageClassName, isLoading && "opacity-0")}
            unoptimized
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setFailedSrc(resolvedSrc);
              setIsLoading(false);
            }}
          />
        </>
      );
    }

    return (
      <>
        {isLoading && (
          <div className={cn("flex items-center justify-center animate-pulse", fallbackClassName)}>
            <Loader2 className={cn("w-4 h-4 animate-spin text-[var(--muted-foreground)]", iconClassName)} />
          </div>
        )}
        <Image
          src={resolvedSrc!}
          alt={alt}
          width={size}
          height={size}
          className={cn(imageClassName, isLoading && "opacity-0")}
          unoptimized
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setFailedSrc(resolvedSrc);
            setIsLoading(false);
          }}
        />
      </>
    );
  }

  return (
    <div className={cn("w-full h-full flex items-center justify-center", fallbackClassName)}>
      <Globe className={cn("w-4 h-4", iconClassName)} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/FaviconImage.tsx
git commit -m "feat(favicon): add loading spinner while image loads"
```

### Task 9: Adaptive skeleton count

**Files:**
- Modify: `src/app/page.tsx:199-214`

- [ ] **Step 1: Use category count from data for skeleton**

Replace the skeleton section in `page.tsx` (lines 199-214):

```tsx
{loading ? (
  <div className="space-y-4">
    {[...Array(Math.max(2, categories.length || 2))].map((_, i) => (
      <div key={i} className="category-card p-5 animate-pulse">
        <div className="h-6 bg-[var(--muted)] rounded-[var(--radius-sm)] mb-4 w-1/3"></div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2 w-full">
          {[...Array(4)].map((_, j) => (
            <div
              key={j}
              className="w-[100px] h-[100px] bg-[var(--muted)] rounded-[var(--radius-md)] flex-shrink-0"
            ></div>
          ))}
        </div>
      </div>
    ))}
  </div>
```

- [ ] **Step 2: Verify build**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit Batch 2**

```bash
git add src/app/page.tsx
git commit -m "fix(skeleton): adapt skeleton count to previous data size"
```

---

## Batch 3: Polish

### Task 10: EditSiteDialog form validation

**Files:**
- Modify: `src/components/EditSiteDialog.tsx`

- [ ] **Step 1: Add validation**

In `src/components/EditSiteDialog.tsx`, add imports after line 6:
```tsx
import { siteTitleSchema, urlSchema } from "@/lib/validation";
```

Add validation state inside the component (after line 29):
```tsx
const [titleError, setTitleError] = useState<string | null>(null);
const [urlError, setUrlError] = useState<string | null>(null);

const isFormValid = title.trim().length > 0 && url.trim().length > 0 && !titleError && !urlError;
```

Update `handleSave` to validate before saving:
```tsx
const handleSave = async () => {
  const titleResult = siteTitleSchema.safeParse(title);
  const urlResult = urlSchema.safeParse(url);

  if (!titleResult.success) {
    setTitleError(titleResult.error.issues[0]?.message || "标题无效");
    return;
  }
  if (!urlResult.success) {
    setUrlError(urlResult.error.issues[0]?.message || "URL 无效");
    return;
  }

  try {
    setIsLoading(true);
    await onSave({ title, url, favicon });
    onOpenChange(false);
  } finally {
    setIsLoading(false);
  }
};
```

Add inline error display below each input. After the title `<Input>` (after line 56), add:
```tsx
{titleError && <p className="text-xs text-[var(--error)]">{titleError}</p>}
```

After the URL `<Input>` (after line 70), add:
```tsx
{urlError && <p className="text-xs text-[var(--error)]">{urlError}</p>}
```

Add `onChange` handlers to clear errors. On the title Input:
```tsx
onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
```

On the URL Input:
```tsx
onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
```

Update the save button `disabled` prop:
```tsx
disabled={isLoading || !isFormValid}
```

- [ ] **Step 2: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/EditSiteDialog.tsx
git commit -m "feat(edit-site): add form validation with Zod schemas"
```

### Task 11: Dark mode completion

**Files:**
- Modify: `src/app/globals.css:62-74`

- [ ] **Step 1: Add dark mode variable overrides**

Replace the dark mode block (lines 62-74) in `globals.css`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0d171d;
    --background-secondary: #13232b;
    --foreground: #eaf4f8;
    --foreground-secondary: #afc3cd;
    --muted: #192c35;
    --muted-foreground: #8ba3af;
    --border: #223843;
    --border-strong: #2b4855;
    --input-border: #2e4a56;

    --primary-50: #0d2925;
    --primary-100: #143d38;
    --primary-200: #1a524b;
    --primary-300: #2a7068;
    --primary-400: #3a9087;
    --primary-500: #4ab0a5;
    --primary-600: #5ec4b9;
    --primary-700: #7ed4cb;
    --primary-800: #a3e3dc;
    --primary-900: #d0f2ed;

    --accent-400: #ffb347;
    --accent-500: #ffb657;
    --accent-600: #ffc470;

    --success: #2dd4a0;
    --warning: #f5b24e;
    --error: #f06b6b;
    --info: #5fb3f0;
  }
}
```

- [ ] **Step 2: Update dark body background gradient**

Add a dark-mode specific body background. In the `@layer base` body rule, the `background-image` uses semi-transparent colors that work in both modes. Verify by running the dev server.

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "fix(dark-mode): complete dark mode color palette"
```

### Task 12: Remove CategoryFilter stub

**Files:**
- Modify: `src/components/SearchBar.tsx:138-140`

- [ ] **Step 1: Verify no imports of CategoryFilter**

Run: `grep -r "CategoryFilter" src/ --include="*.ts" --include="*.tsx"`
Expected: Only the definition in SearchBar.tsx

- [ ] **Step 2: Remove the stub**

Delete lines 138-140 from `src/components/SearchBar.tsx`:
```tsx
export function CategoryFilter() {
  return null;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run type-check && npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit Batch 3**

```bash
git add src/components/SearchBar.tsx
git commit -m "cleanup: remove unused CategoryFilter stub"
```

---

## Final Verification

- [ ] **Run full test suite**: `npx vitest run`
- [ ] **Run type check**: `npm run type-check`
- [ ] **Run lint**: `npm run lint`
- [ ] **Run dev server and visually verify**: `npm run dev`
