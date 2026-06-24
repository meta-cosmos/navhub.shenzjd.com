/**
 * 设置对话框
 * 显示账户信息、同步状态和操作按钮
 */

"use client";

import Image from "next/image";
import { LogOut, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AuthUser, RuntimePublicConfig } from "@/types";

interface SettingsDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 显示/隐藏切换 */
  onOpenChange: (open: boolean) => void;
  /** 用户信息 */
  authUser: AuthUser | null;
  /** 是否在线 */
  isOnline: boolean;
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 手动同步回调 */
  onManualSync: () => Promise<void>;
  /** 退出登录回调 */
  onLogout: () => void;
  /** 运行时配置 */
  runtimeConfig: RuntimePublicConfig | null;
}

export function SettingsDialog({
  open,
  onOpenChange,
  authUser,
  isOnline,
  isSyncing,
  onManualSync,
  onLogout,
  runtimeConfig,
}: SettingsDialogProps) {
  const githubRepo = runtimeConfig?.githubRepo || "navhub.shenzjd.com";
  const dataFilePath = runtimeConfig?.dataFilePath || "data/sites.json";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>管理账户和同步选项</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 账户信息 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">GitHub 账户</h3>
            {authUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-3">
                  <Image
                    src={authUser.avatar}
                    alt={authUser.name}
                    className="h-10 w-10 rounded-full"
                    width={40}
                    height={40}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{authUser.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">已登录</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  <div>• 数据自动同步到你的 GitHub 仓库</div>
                  <div>
                    • 仓库:{" "}
                    <code className="rounded bg-[var(--muted)] px-1.5 py-0.5">{githubRepo}</code>
                  </div>
                  <div>
                    • 文件:{" "}
                    <code className="rounded bg-[var(--muted)] px-1.5 py-0.5">{dataFilePath}</code>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted-foreground)]">
                未登录，当前为访客模式（只读示例数据）
              </div>
            )}
          </div>

          {/* 同步状态 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">同步状态</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-2">
                <div className="text-xs text-[var(--muted-foreground)]">网络状态</div>
                <div className={isOnline ? "font-semibold text-success" : "font-semibold text-warning"}>
                  {isOnline ? "在线" : "离线"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-2">
                <div className="text-xs text-[var(--muted-foreground)]">登录状态</div>
                <div className={authUser ? "font-semibold text-success" : "text-[var(--muted-foreground)]"}>
                  {authUser ? "已登录" : "未登录"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {authUser && (
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={onManualSync}
                disabled={isSyncing}
                className="h-12 flex-1 cursor-pointer gap-1 text-base font-medium sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "同步中..." : "手动同步"}
              </Button>

              <Button
                variant="destructive"
                onClick={onLogout}
                className="h-12 flex-1 cursor-pointer gap-1 text-base font-medium sm:flex-none"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
