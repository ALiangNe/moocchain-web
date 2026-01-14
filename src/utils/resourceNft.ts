import { ethers } from 'ethers';
import ResourceNFTArtifact from '@/contracts/ResourceNFT.json';
import { RESOURCE_NFT_ADDRESS } from '@/contracts/contractAddresses';

type ResourceNftArtifact = { abi: ethers.InterfaceAbi };

function getAbi() {
  return (ResourceNFTArtifact as ResourceNftArtifact).abi;
}

export function buildContentHash(params: { ipfsHash: string; ownerAddress: string; createdAt: number }): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'address', 'uint256'],
    [params.ipfsHash, params.ownerAddress, params.createdAt]
  );
}

export async function mintResourceNft(params: { signer: ethers.Signer; ownerAddress: string; ipfsHash: string; createdAt: number }): Promise<string> {
  const abi = getAbi();
  const contract = new ethers.Contract(RESOURCE_NFT_ADDRESS, abi, params.signer);
  const contentHash = buildContentHash({ ipfsHash: params.ipfsHash, ownerAddress: params.ownerAddress, createdAt: params.createdAt });

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
      if (parsed?.name === 'ResourceMinted') {
        const tokenId = parsed.args?.tokenId;
        return tokenId?.toString?.() ?? String(tokenId);
      }
    } catch {
      // ignore non-matching logs
    }
  }

  throw new Error('Mint succeeded but tokenId not found in logs');
}

