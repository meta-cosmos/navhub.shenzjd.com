/**
 * 统一类型定义
 * 所有核心数据模型集中管理，避免分散重复定义
 */

/** 站点/书签 */
export interface Site {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  description?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 分类 */
export interface Category {
  id: string;
  name: string;
  icon?: string;
  sort: number;
  sites: Site[];
}

/** 导航数据根结构 */
export interface NavData {
  version: string;
  lastModified: number;
  categories: Category[];
  /** 内部版本号（用于冲突检测，不暴露给用户） */
  _version?: number;
}

/** 认证用户信息 */
export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
}

/** 运行时公共配置 */
export interface RuntimePublicConfig {
  githubClientId: string;
  githubOwner: string;
  githubRepo: string;
  dataFilePath: string;
}

/** 同步相关类型 */
export type SyncStep =
  | "prepare"
  | "fetching"
  | "comparing"
  | "uploading"
  | "downloading"
  | "merging"
  | "done";

export interface SyncStepInfo {
  step: SyncStep;
  label: string;
  progress: number; // 0-100
}

export interface SyncResult {
  success: boolean;
  direction: "upload" | "download" | "none";
  conflictResolved?: boolean;
  message?: string;
  error?: string;
}

export enum SyncStatus {
  IDLE = "🟢",
  SYNCING = "🟡",
  UPLOADING = "⬆️",
  DOWNLOADING = "⬇️",
  CONFLICT = "⚠️",
  ERROR = "🔴",
  OFFLINE = "⚪",
}
