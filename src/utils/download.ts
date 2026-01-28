export interface DownloadOptions {
  filename?: string;
  /**
   * 当 fetch() 因为跨域 / 网络问题失败时，是否回退为浏览器直接打开下载地址
   * 默认：true
   */
  fallbackToBrowser?: boolean;
}

/**
 * 通用下载工具函数：
 * - 优先使用 fetch() 拉取二进制并通过 blob 触发下载（不会新开标签页，体验更好）
 * - 如果被 CORS / 网络问题阻止，则回退为浏览器直接打开下载链接
 *
 * 对 Pinata：自动给 `gateway.pinata.cloud/ipfs/` 地址追加 `?download=1`，尽量以附件形式下载
 */
export async function downloadFile(url: string, options: DownloadOptions = {}) {
  const { filename = 'download', fallbackToBrowser = true } = options;

  // 清洗文件名，去掉非法字符
  const sanitize = (name: string, fallback = 'download') => {
    const safe = (name || '')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
    return safe || fallback;
  };

  // 对部分网关（如 Pinata）追加下载参数，提升“直接下载”成功率
  const withForceDownloadParam = (rawUrl: string) => {
    if (!rawUrl || !rawUrl.startsWith('http')) return rawUrl;
    if (rawUrl.includes('gateway.pinata.cloud/ipfs/')) {
      return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}download=1`;
    }
    return rawUrl;
  };

  // 退回到浏览器原生下载 / 打开行为（可能会新开标签页）
  const downloadViaBrowser = (finalUrl: string, safeName?: string) => {
    const a = document.createElement('a');
    a.href = finalUrl;
    if (safeName) a.download = safeName;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const safeName = sanitize(filename);
  const finalUrl = withForceDownloadParam(url);

  try {
    const resp = await fetch(finalUrl, { method: 'GET', credentials: 'omit', cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
    }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objectUrl);
    return { ok: true as const, method: 'blob' as const };
  } catch (error) {
    if (fallbackToBrowser) {
      downloadViaBrowser(finalUrl, safeName);
      return { ok: true as const, method: 'browser' as const, error };
    }
    return { ok: false as const, method: 'blob' as const, error };
  }
}
