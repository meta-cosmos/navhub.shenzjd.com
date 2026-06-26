/**
 * 拖拽排序逻辑 Hook
 * 支持分类拖拽和跨分类站点拖拽
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Category } from "@/lib/storage/local-storage";

interface UseDragAndDropProps {
  categories: Category[];
  filteredCategories: Category[];
  onUpdateSites: (sites: Category[]) => void;
}

interface UseDragAndDropResult {
  sensors: ReturnType<typeof useSensors>;
  handleDragEnd: (event: DragEndEvent) => void;
  allSiteIds: string[];
  siteIdToCategoryId: Record<string, string>;
}

export function useDragAndDrop({
  categories,
  filteredCategories,
  onUpdateSites,
}: UseDragAndDropProps): UseDragAndDropResult {
  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 构建所有站点的扁平 ID 列表 + 站点ID→分类 映射
  const { allSiteIds, siteIdToCategoryId } = useMemo(() => {
    const idToCat: Record<string, string> = {};
    const ids: string[] = [];

    for (const cat of filteredCategories) {
      for (const site of cat.sites) {
        ids.push(site.id);
        idToCat[site.id] = cat.id;
      }
    }

    return { allSiteIds: ids, siteIdToCategoryId: idToCat };
  }, [filteredCategories]);

  // 处理拖拽结束事件
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // 情况1：拖拽的是分类
      const catIndex = categories.findIndex((c) => c.id === activeId);

      if (catIndex !== -1) {
        const overCatIndex = categories.findIndex((c) => c.id === overId);

        if (overCatIndex !== -1) {
          onUpdateSites(arrayMove(categories, catIndex, overCatIndex));
        }

        return;
      }

      // 情况2：拖拽的是站点（支持跨分类）
      let sourceCategory: Category | null = null;
      let sourceSiteIndex = -1;

      for (const cat of categories) {
        const idx = cat.sites.findIndex((s) => s.id === activeId);

        if (idx !== -1) {
          sourceCategory = cat;
          sourceSiteIndex = idx;
          break;
        }
      }

      if (!sourceCategory || sourceSiteIndex === -1) return;

      // 找到目标分类
      let targetCategoryId = sourceCategory.id; // 默认同分类内移动
      let targetSiteIndex = -1;

      // 目标是站点
      const overCatId = siteIdToCategoryId[overId];

      if (overCatId) {
        targetCategoryId = overCatId;
        const targetCat = categories.find((c) => c.id === overCatId);

        if (targetCat) {
          targetSiteIndex = targetCat.sites.findIndex(
            (s) => s.id === overId
          );
        }
      } else {
        // 目标是分类 → 移动到该分类末尾
        targetCategoryId = overId;
        targetSiteIndex = -1; // -1 表示 append 到末尾
      }

      // 构建新的 categories 数据
      const newCategories = categories.map((cat) => ({
        ...cat,
        sites: [...cat.sites],
      }));

      // 从源分类移除站点
      const sourceCat = newCategories.find(
        (c) => c.id === sourceCategory.id
      )!;
      const [movedSite] = sourceCat.sites.splice(sourceSiteIndex, 1);

      // 插入到目标分类
      const targetCat = newCategories.find(
        (c) => c.id === targetCategoryId
      )!;

      if (targetSiteIndex >= 0) {
        targetCat.sites.splice(targetSiteIndex, 0, movedSite);
      } else {
        targetCat.sites.push(movedSite);
      }

      // 更新 sort 字段
      for (const cat of newCategories) {
        cat.sites = cat.sites.map((site, index) => ({
          ...site,
          sort: index,
        }));
      }

      onUpdateSites(newCategories);
    },
    [categories, siteIdToCategoryId, onUpdateSites]
  );

  return {
    sensors,
    handleDragEnd,
    allSiteIds,
    siteIdToCategoryId,
  };
}
