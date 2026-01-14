import { Modal } from 'antd';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

function isUserRejected(error: unknown) {
  type RpcError = { code?: unknown; info?: { error?: { code?: unknown; message?: string } } };
  const err = error as RpcError;
  const code = err?.code ?? err?.info?.error?.code;
  if (code === 4001) return true;
  if (typeof code === 'string' && code.includes('ACTION_REJECTED')) return true;
  if (typeof code === 'number' && String(code).includes('ACTION_REJECTED')) return true;
  return false;
}

function isRequestAlreadyPending(error: unknown) {
  // MetaMask: -32002 "Request of type 'eth_requestAccounts' already pending"
  type RpcError = { code?: unknown; info?: { error?: { code?: unknown } } };
  const err = error as RpcError;
  const code = err?.code ?? err?.info?.error?.code;
  return code === -32002;
}

export async function restoreWallet(): Promise<{ provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner; address: string } | null> {
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);

  let accounts: string[];
  try {
    accounts = await provider.send('eth_accounts', []);
  } catch (error) {
    console.error('Get accounts error:', error);
    return null;
  }

  if (!accounts || accounts.length === 0) return null;

  let signer: ethers.JsonRpcSigner;
  try {
    signer = await provider.getSigner();
  } catch (error) {
    console.error('Get signer error:', error);
    return null;
  }

  let address: string;
  try {
    address = await signer.getAddress();
  } catch (error) {
    console.error('Get address error:', error);
    return null;
  }

  return { provider, signer, address };
}

export async function ensureWalletConnected(): Promise<{ provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner; address: string } | null> {
  if (!window.ethereum) {
    Modal.info({ title: '需要钱包', content: '请先安装并打开 MetaMask 钱包，然后再进行资源提交与铸造。' });
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  let accounts: string[];
  try {
    accounts = await provider.send('eth_accounts', []);
  } catch (error) {
    if (isUserRejected(error)) {
      Modal.info({ title: '已取消', content: '已取消连接钱包操作。' });
      return null;
    }
    console.error('Get accounts error:', error);
    Modal.error({ title: '钱包异常', content: '无法获取钱包账户，请刷新页面重试。' });
    return null;
  }

  if (!accounts || accounts.length === 0) {
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '连接钱包',
        content: '需要连接 MetaMask 钱包以完成接下来的操作。点击“连接”后，请在 MetaMask 弹窗中确认授权（如果没有看到弹窗，请检查浏览器扩展图标）。',
        okText: '连接',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (!confirmed) return null;

    try {
      await provider.send('eth_requestAccounts', []);
    } catch (error) {
      if (isUserRejected(error)) {
        Modal.info({ title: '未授权', content: '你在 MetaMask 中拒绝了连接授权。请重新点击提交，并在 MetaMask 弹窗里点击“下一步/连接”。' });
        return null;
      }
      if (isRequestAlreadyPending(error)) {
        Modal.info({ title: '已有待处理请求', content: 'MetaMask 已经有一个待处理的连接请求。请打开 MetaMask（浏览器扩展或 App）完成授权，然后再回来点击提交。' });
        return null;
      }
      console.error('Request accounts error:', error);
      Modal.error({ title: '连接失败', content: '钱包拒绝连接或发生异常，请重试。' });
      return null;
    }

    try {
      accounts = await provider.send('eth_accounts', []);
    } catch (error) {
      console.error('Get accounts after request error:', error);
      Modal.error({ title: '连接失败', content: '已请求连接，但未能获取账户。请确认 MetaMask 已解锁并授权。' });
      return null;
    }
    if (!accounts || accounts.length === 0) {
      Modal.info({ title: '未连接成功', content: '未检测到已连接的钱包账户。请检查 MetaMask 是否已解锁并完成授权。' });
      return null;
    }
  }

  let signer: ethers.JsonRpcSigner;
  try {
    signer = await provider.getSigner();
  } catch (error) {
    console.error('Get signer error:', error);
    Modal.error({ title: '钱包异常', content: '无法获取签名账户，请重试。' });
    return null;
  }

  let address: string;
  try {
    address = await signer.getAddress();
  } catch (error) {
    console.error('Get address error:', error);
    Modal.error({ title: '钱包异常', content: '无法获取钱包地址，请重试。' });
    return null;
  }

  return { provider, signer, address };
}

