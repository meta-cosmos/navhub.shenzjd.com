/**
 * 页脚组件 - 社交链接 + 导航站点
 */

"use client";

import { MessageCircle, Github, Twitter, HardDrive, Search, Film, Newspaper, Navigation, Image } from "lucide-react";

// 社交链接配置
const socialLinks = [
  { name: "Telegram", icon: MessageCircle, href: "https://t.me/shenzjd_com", color: "#26A5E4" },
  { name: "GitHub", icon: Github, href: "https://github.com/wu529778790", color: "#333" },
  { name: "X (Twitter)", icon: Twitter, href: "https://x.com/shenzujiudi", color: "#000" },
];

// 导航站点配置
const navLinks = [
  { name: "Alist", icon: HardDrive, href: "https://alist.shenzjd.com", desc: "文件列表" },
  { name: "网盘搜索", icon: Search, href: "https://panhub.shenzjd.com", desc: "聚合搜索" },
  { name: "视频解析", icon: Film, href: "https://parse.shenzjd.com", desc: "无广告解析" },
  { name: "热点聚合", icon: Newspaper, href: "https://newshub.shenzjd.com", desc: "实时热点" },
  { name: "个人导航", icon: Navigation, href: "https://navhub.shenzjd.com", desc: "书签管理" },
  { name: "必应壁纸", icon: Image, href: "https://bing.shenzjd.com", desc: "每日壁纸" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background-secondary)]/50">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        {/* 导航站点 */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">
            我的站点
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] p-4 transition-all duration-200 hover:border-[var(--primary-300)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
              >
                <link.icon className="h-6 w-6 text-[var(--primary-600)] transition-transform group-hover:scale-110" />
                <span className="text-sm font-medium text-[var(--foreground)]">{link.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{link.desc}</span>
              </a>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="mb-6 h-px bg-[var(--border)]" />

        {/* 底部信息：社交链接 + 版权 */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* 社交链接 */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                title={link.name}
              >
                <link.icon className="h-4 w-4" style={{ color: link.color }} />
                <span className="hidden sm:inline">{link.name}</span>
              </a>
            ))}
          </div>

          {/* 版权信息 */}
          <div className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://shenzjd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--primary-600)]"
            >
              shenzjd.com
            </a>
            {" "}· Powered by NavHub
          </div>
        </div>
      </div>
    </footer>
  );
}
