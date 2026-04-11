import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, message, Button, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { getLearningRecordList, getResourceList, getCertificateList, getResource, getCourse } from '@/api/baseApi';
import type { CourseInfo } from '@/types/courseType';
import type { LearningRecordInfo } from '@/types/learningRecordType';
import type { ResourceInfo } from '@/types/resourceType';
import type { CertificateInfo } from '@/types/certificateType';
import HashVerifyDetail from '@/components/hashVerify/HashVerifyDetail';
import HashVerifyPanel from '@/components/hashVerify/HashVerifyPanel';
import { getLearningRecordAnchor, type LearningRecordAnchorData } from '@/utils/learningRecord';
import { getResourceChainDataByTxHash, type ResourceChainData } from '@/utils/resourceNft';
import { getCertificateChainDataByTxHash, type CertificateChainData } from '@/utils/certificateNft';

type RecordType = 'learningRecord' | 'resource' | 'certificate' | null;
type HashSource = 'learningRecord' | 'resource' | 'certificate' | null;

export default function HashVerifyId() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>(null);
  const [learningRecord, setLearningRecord] = useState<LearningRecordInfo | null>(null);
  const [resourceRecord, setResourceRecord] = useState<ResourceInfo | null>(null);
  const [certificateRecord, setCertificateRecord] = useState<CertificateInfo | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState('');
  const [learningRecordAnchor, setLearningRecordAnchor] = useState<LearningRecordAnchorData | null>(null);
  const [resourceChainData, setResourceChainData] = useState<ResourceChainData | null>(null);
  const [certificateChainData, setCertificateChainData] = useState<CertificateChainData | null>(null);
  const hasFetchedRef = useRef(false);

  // 解释跳转页面携带的source参数，用于后续get查询
  const normalizedHash = useMemo(() => (hash ? hash.trim() : ''), [hash]);
  const source = useMemo<HashSource>(() => {
    const raw = searchParams.get('source');
    if (raw === 'learningRecord' || raw === 'resource' || raw === 'certificate') return raw;
    return null;
  }, [searchParams]);

  const fetchByHash = useCallback(async () => {
    if (!normalizedHash) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    setLoading(true);
    setRecordType(null);
    setLearningRecord(null);
    setResourceRecord(null);
    setCertificateRecord(null);
    try {
      if (source === 'learningRecord') {
        const lr = await getLearningRecordList({ transactionHash: normalizedHash, page: 1, pageSize: 1 });
        if (lr?.code === 0 && lr?.data?.records && lr.data.records.length > 0) {
          const rec = lr.data.records[0] as LearningRecordInfo & { resource?: Partial<ResourceInfo> };
          // 追加查询资源以获取课程ID
          if (rec.resourceId) {
            try {
              const resDetail = await getResource(rec.resourceId);
              if (resDetail?.code === 0 && resDetail?.data) {
                rec.resource = { ...(rec.resource || {}), courseId: resDetail.data.courseId };
              }
            } catch {
              // 忽略资源查询失败，保持已有数据
            }
          }
          setLearningRecord(rec as LearningRecordInfo);
          setRecordType('learningRecord');
          return;
        }
        message.warning('未在学习记录中找到该交易哈希对应的数据');
        return;
      }

      if (source === 'resource') {
        const rs = await getResourceList({ transactionHash: normalizedHash, page: 1, pageSize: 1 });
        if (rs?.code === 0 && rs?.data?.records && rs.data.records.length > 0) {
          setResourceRecord(rs.data.records[0]);
          setRecordType('resource');
          return;
        }
        message.warning('未在资源记录中找到该交易哈希对应的数据');
        return;
      }

      if (source === 'certificate') {
        const cs = await getCertificateList({ transactionHash: normalizedHash, page: 1, pageSize: 1 });
        if (cs?.code === 0 && cs?.data?.records && cs.data.records.length > 0) {
          const rec = cs.data.records[0];
          if (rec.courseId) {
            try {
              const courseDetail = await getCourse(rec.courseId);
              if (courseDetail?.code === 0 && courseDetail?.data) {
                rec.course = courseDetail.data as CourseInfo;
                rec.teacher = courseDetail.data.teacher ?? rec.teacher ?? null;
              }
            } catch {
              // 忽略课程查询失败，保留证书基础数据
            }
          }
          setCertificateRecord(rec);
          setRecordType('certificate');
          return;
        }
        message.warning('未在证书记录中找到该交易哈希对应的数据');
        return;
      }

    } catch (error) {
      console.error('Fetch by hash error:', error);
      message.error('查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [normalizedHash, source]);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [normalizedHash, source]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchByHash();
    });
  }, [fetchByHash]);

  // 读取链上数据，按照source参数的不同，分别读取学习记录、资源、证书的链上数据
  useEffect(() => {
    const recordId = learningRecord?.recordId;
    if (!recordType || !normalizedHash) {
      setLearningRecordAnchor(null);
      setResourceChainData(null);
      setCertificateChainData(null);
      setChainError('');
      setChainLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      if (!window.ethereum) {
        if (!cancelled) {
          setLearningRecordAnchor(null);
          setResourceChainData(null);
          setCertificateChainData(null);
          setChainError('未检测到钱包环境，无法读取链上数据');
          setChainLoading(false);
        }
        return;
      }
      setChainLoading(true);
      setChainError('');
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        if (recordType === 'learningRecord') {
          if (!recordId) {
            if (!cancelled) {
              setLearningRecordAnchor(null);
              setChainError('缺少学习记录ID，无法读取链上数据');
            }
            return;
          }
          // 获取学习记录的链上数据
          const anchor = await getLearningRecordAnchor({
            provider,
            recordId,
          });
          if (!cancelled) {
            setLearningRecordAnchor(anchor);
            setResourceChainData(null);
            setCertificateChainData(null);
          }
          return;
        }

        // 获取资源链上数据
        if (recordType === 'resource') {
          const chainData = await getResourceChainDataByTxHash({
            provider,
            txHash: normalizedHash,
          });
          if (!cancelled) {
            setResourceChainData(chainData);
            setLearningRecordAnchor(null);
            setCertificateChainData(null);
          }
          return;
        }

        // 获取证书链上数据
        if (recordType === 'certificate') {
          const chainData = await getCertificateChainDataByTxHash({
            provider,
            txHash: normalizedHash,
          });
          if (!cancelled) {
            setCertificateChainData(chainData);
            setLearningRecordAnchor(null);
            setResourceChainData(null);
          }
        }
      } catch (error) {
        console.error('Fetch chain data error:', error);
        if (!cancelled) {
          setLearningRecordAnchor(null);
          setResourceChainData(null);
          setCertificateChainData(null);
          setChainError('读取链上数据失败');
        }
      } finally {
        if (!cancelled) setChainLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recordType, learningRecord?.recordId, normalizedHash]);

  if (!normalizedHash) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm mb-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate(-1)} aria-label="返回" />
                <h1 className="text-lg font-semibold text-[#1d1d1f]">哈希核验</h1>
              </div>
            </div>
          </Card>
          <Empty description="缺少交易哈希" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} type="text" shape="circle" onClick={() => navigate(-1)} aria-label="返回" />
              <h1 className="text-lg font-semibold text-[#1d1d1f]">哈希核验</h1>
            </div>
          </div>
        </Card>

        {recordType ? (
          <>
            <HashVerifyDetail
              recordType={recordType}
              hash={normalizedHash}
              learningRecord={learningRecord || undefined}
              resource={resourceRecord || undefined}
              certificate={certificateRecord || undefined}
              chainLoading={chainLoading}
              chainError={chainError}
              learningRecordAnchor={learningRecordAnchor}
              resourceChainData={resourceChainData}
              certificateChainData={certificateChainData}
            />
            <HashVerifyPanel
              recordType={recordType}
              learningRecord={learningRecord || undefined}
              resource={resourceRecord || undefined}
              certificate={certificateRecord || undefined}
              learningRecordAnchor={learningRecordAnchor}
              resourceChainData={resourceChainData}
              certificateChainData={certificateChainData}
            />
          </>
        ) : (
          <Card className="shadow-sm rounded-2xl">
            <Empty description="未在数据库中找到该交易哈希对应的数据" />
          </Card>
        )}
      </div>
    </div>
  );
}

