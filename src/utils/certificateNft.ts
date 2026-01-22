import { ethers } from 'ethers';
import CertificateNFTArtifact from '@/contracts/CertificateNFT.json';
import { CERTIFICATE_NFT_ADDRESS } from '@/contracts/contractAddresses';

// 只使用 ABI，不关心 bytecode
type CertificateNftArtifact = { abi: ethers.InterfaceAbi };

function getAbi() {
  return (CertificateNFTArtifact as CertificateNftArtifact).abi;
}

export function buildCertificateContentHash(params: { ipfsHash: string; ownerAddress: string; createdAt: number }): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'address', 'uint256'],
    [params.ipfsHash, params.ownerAddress, params.createdAt]
  );
}

export async function mintCertificateNft(params: { signer: ethers.Signer; ownerAddress: string; ipfsHash: string; createdAt: number }): Promise<{ tokenId: string; transactionHash: string }> {
  const abi = getAbi();
  const contract = new ethers.Contract(CERTIFICATE_NFT_ADDRESS, abi, params.signer);
  const contentHash = buildCertificateContentHash({ ipfsHash: params.ipfsHash, ownerAddress: params.ownerAddress, createdAt: params.createdAt });

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
