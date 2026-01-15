import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource } from '@/api/baseApi';
import type { ResourceInfo } from '@/types/resourceType';
import ResourceDetail from '@/components/courseMgmt/ResourceDetail';

export default function CourseLearnResourceId() {
  const { resourceId, courseId } = useParams<{ resourceId: string; courseId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载资源详情数据
  const loadResource = useCallback(async () => {
    if (!resourceId) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setLoading(true);
    });

    let result;
    try {
      result = await getResource(Number(resourceId));
    } catch (error) {
      console.error('Load resource error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    // 检查资源状态，只有已发布（status=2）的资源才能被学生访问
    if (result.data.status !== 2) {
      message.error('该资源尚未发布，无法访问');
      navigate(-1);
      return;
    }

    setResource(result.data);
  }, [resourceId, navigate]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadResource();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadResource]);

  // 获取资源文件下载地址
  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    // 如果是完整的 URL，直接返回
    if (ipfsHash.startsWith('http')) return ipfsHash;
    // 如果是 IPFS Hash (CID)，使用 Pinata Gateway
    // IPFS Hash 通常以 Qm 开头（CIDv0）或 b 开头（CIDv1），且不包含路径分隔符
    if (!ipfsHash.startsWith('/') && (ipfsHash.startsWith('Qm') || ipfsHash.startsWith('b') || ipfsHash.length > 30)) {
      const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
      return `${gatewayUrl}${ipfsHash}`;
    }
    // 否则认为是本地路径
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  // 处理资源文件下载
  const handleDownload = () => {
    const fileUrl = getResourceFileUrl(resource?.ipfsHash);
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    if (courseId) {
      navigate(`/courselearn/${courseId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">资源不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4">返回资源列表</Button>
          <h1 className="text-lg font-semibold text-[#1d1d1f]">资源详情</h1>
        </div>

        <ResourceDetail resource={resource} onDownload={handleDownload} />
      </div>
    </div>
  );
}
