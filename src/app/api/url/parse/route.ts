/**
 * URL 解析 API
 * 提取网页标题和 favicon
 *
 * 核心逻辑已提取至 @/lib/services/url-resolver
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/security";
import { resolveUrl, urlParseCache } from "@/lib/services/url-resolver";

export async function GET(request: NextRequest) {
  // 清理过期缓存
  urlParseCache.cleanup();

  // Rate Limiting
  const clientIp = getClientIP(request);
  const { allowed, resetTime } = checkRateLimit(clientIp);

  if (!allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))),
        },
      }
    );
  }

  // 参数验证
  const urlParam = request.nextUrl.searchParams.get("url")?.trim();
  if (!urlParam) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  try {
    const result = await resolveUrl(urlParam);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "URL 解析失败" },
      { status: 400 }
    );
  }
}
