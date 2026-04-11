import { ethers } from 'ethers';
import LearningRecordArtifact from '@/contracts/LearningRecord.json';
import { LEARNING_RECORD_ADDRESS } from '@/contracts/contractAddresses';

type LearningRecordArtifactType = { abi: ethers.InterfaceAbi };

function getAbi(): ethers.InterfaceAbi {
  return (LearningRecordArtifact as LearningRecordArtifactType).abi;
}

export interface LearningRecordAnchorData {
  owner: string;
  contentHash: string;
  createdAt: number;
}

export function buildLearningCompletionContentHash(
  courseId: number,
  resourceId: number,
  studentId: number,
  progress: number,
  learningTime: number,
  completedAt: Date
): string {
  const completedAtSec = Math.floor(completedAt.getTime() / 1000);
  return ethers.solidityPackedKeccak256(
    ['uint256', 'uint256', 'uint256', 'uint8', 'uint256', 'uint256'],
    [courseId, resourceId, studentId, progress, learningTime, completedAtSec]
  );
}

export async function anchorLearningCompletion(params: {
  signer: ethers.Signer;
  recordId: number;
  ownerAddress: string;
  contentHash: string;
}): Promise<string | null> {
  const contract = new ethers.Contract(LEARNING_RECORD_ADDRESS, getAbi(), params.signer);
  try {
    const existingHash = await contract.getContentHash(params.recordId);
    if (existingHash !== ethers.ZeroHash) return null;

    const tx = await contract.anchor(params.recordId, params.ownerAddress, params.contentHash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  } catch (error) {
    const err = error as { shortMessage?: string; message?: string; reason?: string };
    throw new Error(err.shortMessage || err.reason || err.message || 'Anchor learning completion failed');
  }
}

export async function getLearningRecordAnchor(params: {
  provider: ethers.Provider;
  recordId: number;
}): Promise<LearningRecordAnchorData> {
  const contract = new ethers.Contract(LEARNING_RECORD_ADDRESS, getAbi(), params.provider);
  const anchor = await contract.getAnchor(params.recordId);
  return {
    owner: String(anchor.owner),
    contentHash: String(anchor.contentHash),
    createdAt: Number(anchor.createdAt),
  };
}
