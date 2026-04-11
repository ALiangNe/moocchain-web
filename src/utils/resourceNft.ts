import { ethers } from 'ethers';
import ResourceNFTArtifact from '@/contracts/ResourceNFT.json';
import { RESOURCE_NFT_ADDRESS } from '@/contracts/contractAddresses';

type ResourceNftArtifact = { abi: ethers.InterfaceAbi };

function getAbi() {
  return (ResourceNFTArtifact as ResourceNftArtifact).abi;
}

export interface ResourceChainData {
  tokenId: number;
  owner: string;
  contentHash: string;
  ipfsHash: string;
  createdAt: number;
}

export function buildContentHash(params: { ipfsHash: string; ownerAddress: string; completedAt: number }): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'address', 'uint256'],
    [params.ipfsHash, params.ownerAddress, params.completedAt]
  );
}

export async function mintResourceNft(params: { signer: ethers.Signer; ownerAddress: string; ipfsHash: string; completedAt: number }): Promise<{ tokenId: string; transactionHash: string }> {
  const abi = getAbi();
  const contract = new ethers.Contract(RESOURCE_NFT_ADDRESS, abi, params.signer);
  const contentHash = buildContentHash({ ipfsHash: params.ipfsHash, ownerAddress: params.ownerAddress, completedAt: params.completedAt });

  let tx;
  try {
    tx = await contract.mint(params.ownerAddress, contentHash, params.ipfsHash);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Mint transaction failed');
  }

  let receipt;
  try {
    receipt = await tx.wait();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Wait mint transaction failed');
  }

  const iface = new ethers.Interface(abi);
  const logs = receipt?.logs || [];

  // 从交易回执日志里解析出新铸造的 tokenId
  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'ResourceMinted') {
        const tokenId = parsed.args?.tokenId;
        return {
          tokenId: tokenId?.toString?.() ?? String(tokenId),
          transactionHash: receipt.hash,
        };
      }
    } catch {
      // ignore non-matching logs
    }
  }

  throw new Error('Mint succeeded but tokenId not found in logs');
}

// 按交易哈希去链上读取资源相关数据
export async function getResourceChainDataByTxHash(params: {
  provider: ethers.Provider;
  txHash: string;
}): Promise<ResourceChainData | null> {
  const receipt = await params.provider.getTransactionReceipt(params.txHash);
  if (!receipt) return null;
  const iface = new ethers.Interface(getAbi());
  const targetAddress = RESOURCE_NFT_ADDRESS.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== targetAddress) continue;
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (!parsed || parsed.name !== 'ResourceMinted') continue;
      return {
        tokenId: Number(parsed.args?.tokenId ?? 0),
        owner: String(parsed.args?.owner),
        contentHash: String(parsed.args?.contentHash),
        ipfsHash: String(parsed.args?.ipfsHash),
        createdAt: Number(parsed.args?.createdAt ?? 0),
      };
    } catch {
      // ignore non-matching logs
    }
  }
  return null;
}

