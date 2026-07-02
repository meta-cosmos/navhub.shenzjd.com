/**
 * 同步状态指示器（纯显示组件）
 *
 * 数据来源：
 * - isOnline: navigator.onLine 通过 useSyncExternalStore 订阅 online/offline 事件
 * - lastSync: localStorage nav_last_sync，定时轮询更新
 *
 * 自动同步由 SyncManager (src/lib/storage/sync-manager.ts) 内部自驱动，
 * 用户无需手动触发；顶栏状态圆点仅作反馈。
 */

"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLastSyncTime } from "@/lib/storage/local-storage";

function subscribeOnline(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function SyncStatus() {
  const { isGuestMode } = useAuth();
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
  const [mounted, setMounted] = useState(false);

  // 只在客户端挂载后显示，避免 SSR/CSR 不一致闪烁
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载标记，避免 SSR/CSR 渲染不一致
    setMounted(true);
  }, []);

  // 最后同步时间：定期从 localStorage 读取（auto-sync 已写入）
  const [lastSync, setLastSync] = useState<Date | null>(null);
  useEffect(() => {
    // 首次读取（立即）- 外部存储的初始值同步到 state
    try {
      const time = getLastSyncTime();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 读取外部存储的初始值
      if (time) setLastSync(new Date(time));
    } catch {
      // ignore
    }

    // 之后每 5s 轮询更新
    const timer = setInterval(() => {
      try {
        const t = getLastSyncTime();
        if (t) setLastSync(new Date(t));
      } catch {
        // ignore
      }
    }, 5_000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const isLoggedIn = !isGuestMode;

  const formatLastSync = (lastSyncTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 5) return "刚刚同步";
    if (seconds < 60) return `${seconds}秒前同步`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前同步`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前同步`;
    return lastSyncTime.toLocaleDateString();
  };

  const getStatusText = () => {
    if (!isOnline) return "离线";
    return isLoggedIn ? "在线" : "待同步";
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-[var(--foreground-secondary)] md:flex">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
        />
        <span className="font-semibold">{getStatusText()}</span>
        {lastSync && isLoggedIn && (
          <span className="text-[var(--muted-foreground)]">{formatLastSync(lastSync)}</span>
        )}
      </div>
    </div>
  );
}
