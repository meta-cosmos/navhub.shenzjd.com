/**
 * 快捷键提示组件
 */

"use client";

import { Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  isGuestMode: boolean;
  loading: boolean;
}

export function KeyboardShortcuts({
  isGuestMode,
  loading,
}: KeyboardShortcutsProps) {
  // 只在非访客模式且非加载状态下显示
  if (isGuestMode || loading) {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-[var(--background-secondary)] rounded-[var(--radius-lg)] border border-[var(--border)]">
      <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-2">
        <Keyboard className="w-4 h-4" />
        <span className="font-medium">快捷键</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <span className="kbd">Ctrl</span> + <span className="kbd">K</span>
          <span>快速搜索</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="kbd">Ctrl/Cmd</span> + <span className="kbd">Alt</span> +{" "}
          <span className="kbd">N</span>
          <span>新建分类</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="kbd">Esc</span>
          <span>关闭对话框</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="kbd">拖拽</span>
          <span>排序分类和站点</span>
        </div>
      </div>
    </div>
  );
}
