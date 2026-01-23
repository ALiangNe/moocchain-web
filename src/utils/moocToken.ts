import { ethers } from 'ethers';
import MOOCTokenArtifact from '@/contracts/MOOCToken.json';
// import { MOOC_TOKEN_ADDRESS } from '@/contracts/contractAddresses';

type MOOCTokenArtifact = { abi: ethers.InterfaceAbi };

function getAbi() {
  return (MOOCTokenArtifact as MOOCTokenArtifact).abi;
}

/**
 * 查询代币余额
 * @param params.provider 以太坊提供者（BrowserProvider）
 * @param params.contractAddress 合约地址（MOOC_TOKEN_ADDRESS）
 * @param params.walletAddress 要查询的钱包地址
 * @returns 格式化的代币余额字符串（例如 "10.50"）
 */
export async function getMOOCTokenBalance(params: {
  provider: ethers.BrowserProvider;
  contractAddress: string;
  walletAddress: string;
}): Promise<string> {
  const abi = getAbi();
  // 创建合约实例（使用 provider，因为是只读操作，不需要 signer）
  const contract = new ethers.Contract(params.contractAddress, abi, params.provider);

  let balance;
  try {
    // 调用 balanceOf 方法查询余额（返回 BigInt，单位是 wei）
    balance = await contract.balanceOf(params.walletAddress);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Query balance failed');
  }

  // 将 wei 转换为代币单位（ERC20 通常使用 18 位小数）
  const balanceInTokens = ethers.formatUnits(balance, 18);

  // 格式化为保留2位小数的字符串
  const formattedBalance = parseFloat(balanceInTokens).toFixed(2);

  return formattedBalance;
}

