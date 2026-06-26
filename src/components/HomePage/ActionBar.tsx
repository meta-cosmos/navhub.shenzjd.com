/**
 * 视图切换和更多操作菜单
 */

"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  LayoutGrid,
  List,
  Check,
  ArrowDownUp,
} from "lucide-react";

interface ActionBarProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onImportExport: () => void;
}

export function ActionBar({
  viewMode,
  onViewModeChange,
  onImportExport,
}: ActionBarProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!moreMenuOpen) return;

    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreMenuOpen]);

  const menuItemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] cursor-pointer";

  return (
    <div className="relative flex-shrink-0" ref={moreRef}>
      <button
        onClick={() => setMoreMenuOpen(!moreMenuOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-secondary)] transition-colors hover:bg-[var(--muted)] hover:border-[var(--border-strong)] cursor-pointer"
        aria-label="更多操作"
        aria-expanded={moreMenuOpen}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {moreMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[60] mt-1 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] py-1 shadow-[var(--shadow-lg)]"
        >
          {/* 网格视图 */}
          <button
            role="menuitem"
            onClick={() => {
              onViewModeChange("grid");
              setMoreMenuOpen(false);
            }}
            className={menuItemClass}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="flex-1">网格视图</span>
            {viewMode === "grid" && (
              <Check className="h-4 w-4 text-[var(--primary-600)]" />
            )}
          </button>

          {/* 列表视图 */}
          <button
            role="menuitem"
            onClick={() => {
              onViewModeChange("list");
              setMoreMenuOpen(false);
            }}
            className={menuItemClass}
          >
            <List className="h-4 w-4" />
            <span className="flex-1">列表视图</span>
            {viewMode === "list" && (
              <Check className="h-4 w-4 text-[var(--primary-600)]" />
            )}
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          {/* 导入/导出 */}
          <button
            role="menuitem"
            onClick={() => {
              onImportExport();
              setMoreMenuOpen(false);
            }}
            className={menuItemClass}
          >
            <ArrowDownUp className="h-4 w-4" />
            <span>导入 / 导出</span>
          </button>
        </div>
      )}
    </div>
  );
}
