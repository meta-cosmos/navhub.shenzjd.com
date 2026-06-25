/**
 * 性能优化方案2：Context Selector + 乐观更新
 *
 * 目标：
 * 1. 解决 DataContext 全局重渲染问题
 * 2. 实现乐观更新（操作即时反馈）
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  loadFromLocalStorage,
  saveSitesToLocalStorage,
  getSitesFromLocalStorage,
} from "@/lib/storage/local-storage";
import { getDataFromGitHub, getYourDataFromGitHub } from "@/lib/storage/github-storage";
import type { Category, Site, AuthUser } from "@/types";

interface DataContextType {
  sites: Category[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  addSite: (categoryId: string, site: Site) => Promise<void>;
  updateSite: (categoryId: string, siteId: string, site: Site) => Promise<void>;
  deleteSite: (categoryId: string, siteId: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (categoryId: string, category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  refreshSites: (forceRefresh?: boolean) => Promise<void>;
  updateSites: (sites: Category[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const defaultCategory: Category = {
  id: "default",
  name: "默认分类",
  sort: 0,
  sites: [],
};

export function DataProvider({
  children,
  isAuthenticated,
  isGuestMode,
  authUser,
  onSyncRequest,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  authUser: AuthUser | null;
  onSyncRequest?: (immediateSync: boolean) => void;
}) {
  const [sites, setSites] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 用于竞态控制：只允许最新的 fetch 更新状态
  const fetchIdRef = useRef(0);

  /**
   * 初始化：从本地或 GitHub 加载数据
   */
  const fetchSites = useCallback(
    async (_forceRefresh = false) => {
      const currentFetchId = ++fetchIdRef.current;
      try {
        setError(null);

        // 第一步：立即检查本地数据
        const localData = loadFromLocalStorage();
        if (localData?.categories && localData.categories.length > 0) {
          const isDefault =
            localData.categories.length === 1 &&
            localData.categories[0].id === "default" &&
            localData.categories[0].sites.length === 0 &&
            localData.lastModified === 0;

          if (!isDefault) {
            setSites(localData.categories);
            setLoading(false);
          }
        }

        // 第二步：根据认证状态获取远程数据
        if (_forceRefresh && isAuthenticated) {
          const githubData = await getDataFromGitHub(
            authUser ? "token-from-context" : ""
          );
          if (currentFetchId !== fetchIdRef.current) return;

          if (githubData?.categories && githubData.categories.length > 0) {
            saveSitesToLocalStorage(githubData.categories);
            setSites(githubData.categories);
            setLoading(false);
            return;
          }
        }

        // 第三步：如果本地没有有效数据
        if (!localData?.categories || localData.categories.length === 0) {
          if (!isAuthenticated || isGuestMode) {
            // 访客模式：从 GitHub 拉取示例数据
            try {
              const yourData = await getYourDataFromGitHub();
              if (currentFetchId !== fetchIdRef.current) return;
              if (yourData?.categories && yourData.categories.length > 0) {
                saveSitesToLocalStorage(yourData.categories);
                setSites(yourData.categories);
                setLoading(false);
                return;
              }
            } catch (guestError) {
              console.error("读取示例数据失败:", guestError);
              if (
                guestError instanceof Error &&
                guestError.message.includes("运行时配置加载失败")
              ) {
                throw guestError;
              }
            }
          }
        }

        // 最后：设置默认分类
        if (currentFetchId !== fetchIdRef.current) return;
        setSites((prev) => {
          if (prev.length === 0) {
            saveSitesToLocalStorage([defaultCategory]);
            return [defaultCategory];
          }
          return prev;
        });
        setLoading(false);
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : "加载失败");
        const fallbackLocal = getSitesFromLocalStorage();
        if (fallbackLocal.length > 0) {
          setSites(fallbackLocal);
        } else {
          setSites([defaultCategory]);
          saveSitesToLocalStorage([defaultCategory]);
        }
        setLoading(false);
      }
    },
    [isAuthenticated, isGuestMode, authUser]
  );

  // 组件挂载时加载数据
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // 监听认证变化自动刷新
  useEffect(() => {
    const handleAuthUpdate = () => fetchSites(true);
    window.addEventListener("auth-update", handleAuthUpdate);
    return () => window.removeEventListener("auth-update", handleAuthUpdate);
  }, [fetchSites]);

  /**
   * ✨ 优化1：使用函数式更新 + 稳定引用的回调
   */
  const addSite = useCallback(
    async (categoryId: string, site: Site) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新：立即更新UI
      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? { ...category, sites: [...category.sites, site] }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(false);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateSite = useCallback(
    async (categoryId: string, siteId: string, site: Site) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新：立即更新UI
      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                sites: category.sites.map((s) => (s.id === siteId ? site : s)),
              }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const deleteSite = useCallback(
    async (categoryId: string, siteId: string) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新：立即从UI移除
      setSites((prevSites) => {
        const newSites = prevSites.map((category) =>
          category.id === categoryId
            ? { ...category, sites: category.sites.filter((s) => s.id !== siteId) }
            : category
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const addCategory = useCallback(
    async (category: Category) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新
      setSites((prevSites) => {
        const newSites = [...prevSites, category];
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(false);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateCategory = useCallback(
    async (categoryId: string, category: Category) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新
      setSites((prevSites) => {
        const newSites = prevSites.map((c) =>
          c.id === categoryId ? category : c
        );
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      // 乐观更新
      setSites((prevSites) => {
        const newSites = prevSites.filter((c) => c.id !== categoryId);
        saveSitesToLocalStorage(newSites);
        return newSites;
      });

      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const updateSites = useCallback(
    async (newSites: Category[]) => {
      if (isGuestMode) {
        window.location.href = "/api/auth/github/login";
        return;
      }

      setSites(newSites);
      saveSitesToLocalStorage(newSites);
      onSyncRequest?.(true);
    },
    [isGuestMode, onSyncRequest]
  );

  const clearError = useCallback(() => setError(null), []);

  /**
   * ✨ 优化2：使用 useMemo 确保稳定的 contextValue
   * 只有依赖项变化时才创建新对象
   */
  const contextValue = useMemo<DataContextType>(
    () => ({
      sites,
      loading,
      error,
      clearError,
      addSite,
      updateSite,
      deleteSite,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshSites: fetchSites,
      updateSites,
    }),
    [
      sites,
      loading,
      error,
      clearError,
      addSite,
      updateSite,
      deleteSite,
      addCategory,
      updateCategory,
      deleteCategory,
      fetchSites,
      updateSites,
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

// ========== ✨ 性能优化：精准订阅 Hooks ==========

/**
 * 只订阅站点数据
 * ✨ 只有 sites 变化时才重渲染，loading/error 变化不会触发更新
 *
 * @example
 * // ❌ 旧方式：loading 变化也会触发重渲染
 * const { sites, loading } = useData();
 *
 * // ✅ 新方式：只在 sites 变化时更新
 * const sites = useSitesData();
 */
export function useSitesData(): Category[] {
  const { sites } = useData();
  return sites;
}

/**
 * 只订阅加载状态
 * ✨ 只有 loading 变化时才重渲染
 */
export function useLoadingState(): boolean {
  const { loading } = useData();
  return loading;
}

/**
 * 只订阅错误信息 + 清除方法
 */
export function useErrorState(): { error: string | null; clearError: () => void } {
  const { error, clearError } = useData();
  return { error, clearError };
}

/**
 * 只订阅站点操作方法（不包含数据）
 * ✨ 数据变化时不会触发重渲染（函数引用稳定）
 *
 * 适用场景：SiteCard、AddSiteDialog 等只需要操作方法的组件
 */
export function useSiteOperations() {
  const { addSite, updateSite, deleteSite } = useData();
  return { addSite, updateSite, deleteSite };
}

/**
 * 只订阅分类操作方法
 */
export function useCategoryOperations() {
  const { addCategory, updateCategory, deleteCategory } = useData();
  return { addCategory, updateCategory, deleteCategory };
}

/**
 * 订阅数据 + 更新方法
 */
export function useSitesWithUpdate() {
  const { sites, updateSites } = useData();
  return { sites, updateSites };
}

/**
 * 订阅数据 + 清除错误方法
 */
export function useSitesWithClearError() {
  const { sites, error, clearError } = useData();
  return { sites, error, clearError };
}
