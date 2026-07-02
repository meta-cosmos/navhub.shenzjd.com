/**
 * 设置对话框
 * 显示账户信息、同步选项和退出登录
 *
 * 同步由 SyncManager 后台自动驱动，本对话框不再提供手动同步入口。
 */

"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
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
  /** 退出登录回调 */
  onLogout: () => void;
  /** 运行时配置 */
  runtimeConfig: RuntimePublicConfig | null;
}

export function SettingsDialog({
  open,
  onOpenChange,
  authUser,
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

          {/* 同步说明 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">同步状态</h3>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/45 p-3 text-sm text-[var(--muted-foreground)]">
              <p>同步完全自动进行，修改后 3 秒内自动推送到 GitHub。无需手动操作。</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          {authUser && (
            <Button
              variant="destructive"
              onClick={onLogout}
              className="h-12 w-full cursor-pointer gap-1 text-base font-medium"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
