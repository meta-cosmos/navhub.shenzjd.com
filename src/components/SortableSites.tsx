/**
 * 站点列表展示组件 - 纯展示，拖拽由外层统一 DndContext 管理
 */

"use client";

import { memo, useState } from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/contexts/SitesContext";
import { SiteCard } from "@/components/SiteCard";
import { AddSiteCard } from "@/components/AddSiteCard";
import { AddSiteDialog } from "@/components/AddSiteDialog";

interface SortableSitesProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    sort?: number;
    sites: Array<{
      id: string;
      title: string;
      url: string;
      favicon?: string;
      sort?: number;
    }>;
  };
  view?: "grid" | "list";
}

/** 可排序的站点项包装器 */
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    // 拖拽中提升层级，避免被其他元素遮挡
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export const SortableSites = memo(function SortableSites({
  category,
  view = "grid",
}: SortableSitesProps) {
  const { isGuestMode } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(category.id);

  const openDialog = (catId: string) => {
    setActiveCategory(catId);
    setDialogOpen(true);
  };

  return (
    <>
      {/* 网格视图布局 — 用 CSS Grid 固定列宽，避免拖拽时的挤压/跳动 */}
      {view === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2 w-full contain-layout">
          {category.sites.map((site) => (
            <SortableItem key={site.id} id={site.id}>
              <SiteCard
                id={site.id}
                title={site.title}
                url={site.url}
                favicon={site.favicon}
                categoryId={category.id}
                view="grid"
              />
            </SortableItem>
          ))}

          {/* 添加站点卡片（登录态始终可见） */}
          {!isGuestMode && (
            <div className="w-[100px] h-[100px] flex-shrink-0">
              <AddSiteCard onOpen={() => openDialog(category.id)} view="grid" />
            </div>
          )}
        </div>
      ) : (
        /* 列表视图布局 */
        <div className="flex flex-col gap-2 mt-2">
          {category.sites.map((site) => (
            <SortableItem key={site.id} id={site.id}>
              <SiteCard
                id={site.id}
                title={site.title}
                url={site.url}
                favicon={site.favicon}
                categoryId={category.id}
                view="list"
              />
            </SortableItem>
          ))}

          {/* 添加站点卡片（登录态始终可见） */}
          {!isGuestMode && (
            <AddSiteCard onOpen={() => openDialog(category.id)} view="list" />
          )}
        </div>
      )}

      {/* 单一共享 Dialog，避免 per-card Suspense 全屏 spinner */}
      <AddSiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activeCategory={activeCategory}
      />
    </>
  );
});
