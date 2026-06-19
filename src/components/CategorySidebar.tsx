/**
 * 分类侧边栏导航
 * - 固定在左侧，显示所有分类
 * - 点击分类跳转到对应区域
 * - 滚动时自动高亮当前分类
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { IconFolder } from "@/components/icons";
import type { Category } from "@/lib/storage/local-storage";

interface CategorySidebarProps {
  categories: Category[];
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const [activeId, setActiveId] = useState<string>("");

  // 滚动监听：高亮当前可见的分类
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个在视口中的分类
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("category-", "");
            setActiveId(id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px", // header 80px + 底部留 60%
        threshold: 0,
      }
    );

    // 观察所有分类区域
    categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  // 点击分类跳转
  const handleClick = useCallback((categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(categoryId);
    }
  }, []);

  if (categories.length === 0) return null;

  return (
    <nav
      className="hidden lg:flex flex-col w-48 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto py-2"
      aria-label="分类导航"
    >
      <div className="space-y-0.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-all text-left cursor-pointer",
              activeId === cat.id
                ? "bg-[var(--primary-50)] text-[var(--primary-700)] font-medium"
                : "text-[var(--foreground-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <IconFolder
              className={cn(
                "w-4 h-4 flex-shrink-0",
                activeId === cat.id ? "text-[var(--primary-600)]" : "text-[var(--muted-foreground)]"
              )}
            />
            <span className="truncate">{cat.name}</span>
            <span className="ml-auto text-xs text-[var(--muted-foreground)] tabular-nums">
              {cat.sites.length}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
