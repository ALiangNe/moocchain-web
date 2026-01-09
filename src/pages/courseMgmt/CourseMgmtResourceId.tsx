import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Spin, message, Drawer } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getResource } from '../../api/baseApi';
import { updateResource } from '../../api/baseApi';
import type { ResourceInfo } from '../../types/resourceType';
import ResourceDetail from '../../components/courseMgmt/ResourceDetail';
import ResourceForm from '../../components/courseMgmt/ResourceForm';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../constants/role';

export default function CourseMgmtResourceId() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const user = useAuthStore((state) => state.user);

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

    setResource(result.data);
  }, [resourceId]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadResource();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadResource]);

  const getResourceFileUrl = (ipfsHash?: string) => {
    if (!ipfsHash) return undefined;
    if (ipfsHash.startsWith('http')) return ipfsHash;
    const baseUrl = import.meta.env.VITE_API_BASE_URL.split('/api')[0];
    return `${baseUrl}${ipfsHash}`;
  };

  const handleDownload = () => {
    const fileUrl = getResourceFileUrl(resource?.ipfsHash);
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const handleEditSubmit = async (values: Partial<ResourceInfo>) => {
    if (!resourceId || !resource) return;

    let result;
    try {
      result = await updateResource(Number(resourceId), {
        title: values.title,
        description: values.description,
        resourceType: values.resourceType,
        price: values.price,
        accessScope: values.accessScope,
      });
    } catch (error) {
      console.error('Update resource error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('资源更新成功');
    setEditVisible(false);
    loadResource();
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">返回资源列表</Button>
            <h1 className="text-lg font-semibold text-[#1d1d1f]">资源详情</h1>
          </div>
          {user?.role !== UserRole.STUDENT && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => setEditVisible(true)} className="rounded-lg">
              编辑资源
            </Button>
          )}
        </div>

        <ResourceDetail resource={resource} onDownload={handleDownload} />

        <Drawer title="编辑资源" open={editVisible} onClose={() => setEditVisible(false)} width={700} placement="right">
          {resource && (
            <ResourceForm courseId={resource.courseId || 0} initialValues={resource} onSubmit={handleEditSubmit} onCancel={() => setEditVisible(false)} />
          )}
        </Drawer>
      </div>
    </div>
  );
}
