import { ethers } from 'ethers';
import CertificateNFTArtifact from '@/contracts/CertificateNFT.json';
import { CERTIFICATE_NFT_ADDRESS } from '@/contracts/contractAddresses';

// 只使用 ABI，不关心 bytecode
type CertificateNftArtifact = { abi: ethers.InterfaceAbi };

function getAbi() {
  return (CertificateNFTArtifact as CertificateNftArtifact).abi;
}

export interface CertificateChainData {
  tokenId: number;
  owner: string;
  contentHash: string;
  ipfsHash: string;
  createdAt: number;
}

export function buildCertificateContentHash(params: { ipfsHash: string; ownerAddress: string; completedAt: number }): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'address', 'uint256'],
    [params.ipfsHash, params.ownerAddress, params.completedAt]
  );
}

export async function mintCertificateNft(params: { signer: ethers.Signer; ownerAddress: string; ipfsHash: string; completedAt: number }): Promise<{ tokenId: string; transactionHash: string }> {
  const abi = getAbi();
  const contract = new ethers.Contract(CERTIFICATE_NFT_ADDRESS, abi, params.signer);
  const contentHash = buildCertificateContentHash({ ipfsHash: params.ipfsHash, ownerAddress: params.ownerAddress, completedAt: params.completedAt });

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

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'CertificateMinted') {
        const tokenId = parsed.args?.tokenId;
        return {
          tokenId: tokenId?.toString?.() ?? String(tokenId),
          transactionHash: receipt.hash,
        };
      }
    } catch {
      // 忽略非本合约事件
    }
  }

  throw new Error('Mint succeeded but tokenId not found in logs');
}

export async function getCertificateChainDataByTxHash(params: {
  provider: ethers.Provider;
  txHash: string;
}): Promise<CertificateChainData | null> {
  const receipt = await params.provider.getTransactionReceipt(params.txHash);
  if (!receipt) return null;
  const iface = new ethers.Interface(getAbi());
  const targetAddress = CERTIFICATE_NFT_ADDRESS.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== targetAddress) continue;
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (!parsed || parsed.name !== 'CertificateMinted') continue;
      return {
        tokenId: Number(parsed.args?.tokenId ?? 0),
        owner: String(parsed.args?.owner),
        contentHash: String(parsed.args?.contentHash),
        ipfsHash: String(parsed.args?.ipfsHash),
        createdAt: Number(parsed.args?.createdAt ?? 0),
      };
    } catch {
      // 忽略非本合约事件
    }
  }
  return null;
}
