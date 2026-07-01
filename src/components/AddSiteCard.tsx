/**
 * 添加站点卡片组件
 *
 * Dialog 提升到父级单一实例，避免 per-card Suspense 全屏 spinner。
 * 卡片只负责触发打开事件，由父级 SortableSites 统一渲染 Dialog。
 */

"use client";

import { Plus } from "lucide-react";

interface AddSiteCardProps {
  /** 点击时回调，由父级打开共享的 Dialog */
  onOpen: () => void;
  view?: "grid" | "list";
}

export function AddSiteCard({ onOpen, view = "grid" }: AddSiteCardProps) {
  if (view === "grid") {
    return (
      <div
        onClick={onOpen}
        className="site-card group border-dashed border-[var(--border)] bg-[var(--background-secondary)]/70 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/65 cursor-pointer"
        title="添加新站点"
      >
        <div className="site-icon-wrapper bg-[var(--muted)] transition-colors group-hover:bg-[var(--primary-100)]">
          <Plus className="w-4 h-4 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-600)]" />
        </div>
        <span className="site-title text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--primary-700)]">
          添加站点
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/80 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/65 transition-all cursor-pointer"
      title="添加新站点"
    >
      <div className="w-10 h-10 flex-shrink-0 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--muted)] transition-colors">
        <Plus className="w-5 h-5 text-[var(--muted-foreground)]" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-[var(--foreground-secondary)]">添加站点</div>
        <div className="text-xs text-[var(--muted-foreground)]">点击添加新网站</div>
      </div>
    </div>
  );
}
