import { useMemo, useState } from 'react';
import { Alert, Card, Form, Input, InputNumber, Typography } from 'antd';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { ResourceInfo } from '@/types/resourceType';
import type { CertificateInfo } from '@/types/certificateType';
import type { LearningRecordAnchorData } from '@/utils/learningRecord';
import type { ResourceChainData } from '@/utils/resourceNft';
import type { CertificateChainData } from '@/utils/certificateNft';
import { buildLearningCompletionContentHash } from '@/utils/learningRecord';
import { buildContentHash } from '@/utils/resourceNft';
import { buildCertificateContentHash } from '@/utils/certificateNft';
import { useAuthStore } from '@/stores/authStore';

type RecordType = 'learningRecord' | 'resource' | 'certificate';

interface HashVerifyPanelProps {
  recordType: RecordType;
  learningRecord?: LearningRecordInfo;
  resource?: ResourceInfo;
  certificate?: CertificateInfo;
  learningRecordAnchor?: LearningRecordAnchorData | null;
  resourceChainData?: ResourceChainData | null;
  certificateChainData?: CertificateChainData | null;
}

interface LearningInputs {
  courseId: number;
  resourceId: number;
  studentId: number;
  progress: number;
  learningTime: number;
  completedAtSec: number;
}

interface AssetInputs {
  ipfsHash: string;
  ownerAddress: string;
  completedAt: number;
}

// 把time转为秒级时间戳
function toUnixSec(value: string | Date | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

export default function HashVerifyPanel({
  recordType,
  learningRecord,
  resource,
  certificate,
  learningRecordAnchor,
  resourceChainData,
  certificateChainData,
}: HashVerifyPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const defaultWallet = currentUser?.walletAddress || '';

  const learningDefaults = useMemo(() => ({
    courseId: Number(learningRecord?.resource?.courseId ?? 0),
    resourceId: Number(learningRecord?.resourceId ?? 0),
    studentId: Number(learningRecord?.studentId ?? 0),
    progress: Number(learningRecord?.progress ?? 0),
    learningTime: Number(learningRecord?.learningTime ?? 0),
    completedAtSec: toUnixSec(learningRecord?.completedAt),
  }), [learningRecord]);
  const resourceDefaults = useMemo(() => ({
    ipfsHash: String(resource?.ipfsHash ?? ''),
    ownerAddress: defaultWallet,
    completedAt: toUnixSec(resource?.completedAt),
  }), [resource, defaultWallet]);
  const certificateDefaults = useMemo(() => ({
    ipfsHash: String(certificate?.ipfsHash ?? ''),
    ownerAddress: defaultWallet,
    completedAt: toUnixSec(certificate?.completedAt),
  }), [certificate, defaultWallet]);

  const [learningOverrides, setLearningOverrides] = useState<Partial<LearningInputs>>({});
  const [resourceOverrides, setResourceOverrides] = useState<Partial<AssetInputs>>({});
  const [certificateOverrides, setCertificateOverrides] = useState<Partial<AssetInputs>>({});

  const learningInputs = useMemo<LearningInputs>(
    () => ({ ...learningDefaults, ...learningOverrides }),
    [learningDefaults, learningOverrides]
  );
  const resourceInputs = useMemo<AssetInputs>(
    () => ({ ...resourceDefaults, ...resourceOverrides }),
    [resourceDefaults, resourceOverrides]
  );
  const certificateInputs = useMemo<AssetInputs>(
    () => ({ ...certificateDefaults, ...certificateOverrides }),
    [certificateDefaults, certificateOverrides]
  );

  // 根据url不同的参数来获取到父组件传过来的不同数据
  const chainContentHash = useMemo(() => {
    if (recordType === 'learningRecord') return learningRecordAnchor?.contentHash || '';
    if (recordType === 'resource') return resourceChainData?.contentHash || '';
    return certificateChainData?.contentHash || '';
  }, [recordType, learningRecordAnchor, resourceChainData, certificateChainData]);

  // 解析url传过来的类型，然后进行不同类型的校验
  const computedHash = useMemo(() => {
    try {
      if (recordType === 'learningRecord') {
        return buildLearningCompletionContentHash(
          Number(learningInputs.courseId || 0),
          Number(learningInputs.resourceId || 0),
          Number(learningInputs.studentId || 0),
          Number(learningInputs.progress || 0),
          Number(learningInputs.learningTime || 0),
          new Date(Number(learningInputs.completedAtSec || 0) * 1000)
        );
      }
      if (recordType === 'resource') {
        return buildContentHash({
          ipfsHash: resourceInputs.ipfsHash || '',
          ownerAddress: resourceInputs.ownerAddress || '',
          completedAt: Number(resourceInputs.completedAt || 0),
        });
      }
      return buildCertificateContentHash({
        ipfsHash: certificateInputs.ipfsHash || '',
        ownerAddress: certificateInputs.ownerAddress || '',
        completedAt: Number(certificateInputs.completedAt || 0),
      });
    } catch {
      return '';
    }
  }, [recordType, learningInputs, resourceInputs, certificateInputs]);

  // 两个hash转为小写之后比对，是否一致
  const verified = Boolean(chainContentHash) && Boolean(computedHash) && chainContentHash.toLowerCase() === computedHash.toLowerCase();

  const verifiedSuccessMessage = useMemo(() => {
    if (recordType === 'learningRecord') {
      return '验证通过：您输入的参与式校验字段重新计算得到的内容哈希与链上内容哈希完全一致，这意味着课程ID，资源ID，学生ID，进度，学习时长(秒)，学习完成时间戳(秒)等关键数据未发生篡改。';
    }
    if (recordType === 'resource') {
      return '验证通过：您输入的参与式校验字段重新计算得到的内容哈希与链上内容哈希完全一致，这意味着文件CID，用户钱包地址，数据生成时间戳(秒)等关键数据未发生篡改。';
    }
    return '验证通过：您输入的参与式校验字段重新计算得到的内容哈希与链上内容哈希完全一致，这意味着文件CID，用户钱包地址，数据生成时间戳(秒)等关键数据未发生篡改。';
  }, [recordType]);

  const explainText = useMemo(() => {
    if (recordType === 'learningRecord') {
      return '链上内容哈希是通过数据库中的课程ID，资源ID，学生ID，进度，学习时长(秒)，学习完成时间戳(秒)拼接并使用 keccak256 计算而成，您可以在左边手动校验数据是否被篡改。';
    }
    if (recordType === 'resource') {
      return '链上内容哈希是通过数据库中的文件CID，用户钱包地址，数据生成时间戳(秒)拼接并使用 keccak256 计算而成，您可以在左边手动校验数据是否被篡改。';
    }
    return '链上内容哈希是通过数据库中的文件CID，用户钱包地址，数据生成时间戳(秒)拼接并使用 keccak256 计算而成，您可以在左边手动校验数据是否被篡改。';
  }, [recordType]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          className="shadow-none rounded-xl"
          title="要校验的数据"
          headStyle={{ borderBottom: 'none', padding: '12px 16px' }}
          bodyStyle={{ padding: '12px 16px 16px' }}
        >
          {/* 学习记录的输入框 */}
          {recordType === 'learningRecord' && (
            <Form layout="vertical" className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <Form.Item label="课程ID">
                <InputNumber className="w-full" value={learningInputs.courseId} onChange={(v) => setLearningOverrides((s) => ({ ...s, courseId: Number(v ?? 0) }))} />
              </Form.Item>
              <Form.Item label="资源ID">
                <InputNumber className="w-full" value={learningInputs.resourceId} onChange={(v) => setLearningOverrides((s) => ({ ...s, resourceId: Number(v ?? 0) }))} />
              </Form.Item>
              <Form.Item label="学生ID">
                <InputNumber className="w-full" value={learningInputs.studentId} onChange={(v) => setLearningOverrides((s) => ({ ...s, studentId: Number(v ?? 0) }))} />
              </Form.Item>
              <Form.Item label="进度">
                <InputNumber className="w-full" value={learningInputs.progress} onChange={(v) => setLearningOverrides((s) => ({ ...s, progress: Number(v ?? 0) }))} />
              </Form.Item>
              <Form.Item label="学习时长(秒)">
                <InputNumber className="w-full" value={learningInputs.learningTime} onChange={(v) => setLearningOverrides((s) => ({ ...s, learningTime: Number(v ?? 0) }))} />
              </Form.Item>
              <Form.Item label="学习完成时间戳(秒)">
                <InputNumber className="w-full" value={learningInputs.completedAtSec} onChange={(v) => setLearningOverrides((s) => ({ ...s, completedAtSec: Number(v ?? 0) }))} />
              </Form.Item>
            </Form>
          )}

          {/* 资源的输入框 */}
          {recordType === 'resource' && (
            <Form layout="vertical" className="grid grid-cols-1 gap-y-2">
              <Form.Item label="文件CID">
                <Input value={resourceInputs.ipfsHash} onChange={(e) => setResourceOverrides((s) => ({ ...s, ipfsHash: e.target.value }))} />
              </Form.Item>
              <Form.Item label="用户钱包地址">
                <Input value={resourceInputs.ownerAddress} onChange={(e) => setResourceOverrides((s) => ({ ...s, ownerAddress: e.target.value }))} />
              </Form.Item>
              <Form.Item label="数据生成时间戳(秒)">
                <InputNumber className="w-full" value={resourceInputs.completedAt} onChange={(v) => setResourceOverrides((s) => ({ ...s, completedAt: Number(v ?? 0) }))} />
              </Form.Item>
            </Form>
          )}

          {/* 证书的输入框 */}
          {recordType === 'certificate' && (
            <Form layout="vertical" className="grid grid-cols-1 gap-y-2">
              <Form.Item label="文件CID">
                <Input value={certificateInputs.ipfsHash} onChange={(e) => setCertificateOverrides((s) => ({ ...s, ipfsHash: e.target.value }))} />
              </Form.Item>
              <Form.Item label="用户钱包地址">
                <Input value={certificateInputs.ownerAddress} onChange={(e) => setCertificateOverrides((s) => ({ ...s, ownerAddress: e.target.value }))} />
              </Form.Item>
              <Form.Item label="数据生成时间戳(秒)">
                <InputNumber className="w-full" value={certificateInputs.completedAt} onChange={(v) => setCertificateOverrides((s) => ({ ...s, completedAt: Number(v ?? 0) }))} />
              </Form.Item>
            </Form>
          )}
        </Card>

        <Card
          className="shadow-none rounded-xl"
          title="计算结果与链上数据"
          headStyle={{ borderBottom: 'none', padding: '12px 16px' }}
          bodyStyle={{ padding: '12px 16px 16px' }}
        >
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
            <Typography.Text strong>输入后计算得到的哈希</Typography.Text>
            <Typography.Paragraph copyable className="!mb-2 break-all">{computedHash || '-'}</Typography.Paragraph>
            <Typography.Text strong>链上内容哈希</Typography.Text>
            <Typography.Paragraph copyable className="!mb-0 break-all">{chainContentHash || '-'}</Typography.Paragraph>
          </div>

          <div className="mt-3">
            <Alert type="info" showIcon message={explainText} />
          </div>

          <Alert
            className="mt-3"
            type={verified ? 'success' : 'warning'}
            showIcon
            message={verified ? verifiedSuccessMessage : '验证未通过：请检查输入字段是否与上链时完全一致（尤其时间戳单位必须是秒）。'}
          />
        </Card>
      </div>
    </div>
  );
}

