import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message, Spin } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getCourse, getResourceList, createResource, updateResource } from '../../api/baseApi';
import type { CourseInfo } from '../../types/courseType';
import type { ResourceInfo } from '../../types/resourceType';
import ResourceForm from '../../components/courseMgmt/ResourceForm';
import ResourceList from '../../components/courseMgmt/ResourceList';
import CourseDetailCard from '../../components/courseMgmt/CourseDetail';
import { UserRole } from '../../constants/role';
import { buildCreateResourceFormData } from '../../utils/buildApiParams';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceInfo | null>(null);
  const [resourcePage, setResourcePage] = useState(1);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const courseLoadingRef = useRef(false);
  const resourceLoadingRef = useRef(false);
  const courseRequestIdRef = useRef(0);
  const resourceRequestIdRef = useRef(0);

  // 加载课程详情数据
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    if (courseLoadingRef.current) return;

    const currentRequestId = ++courseRequestIdRef.current;
    courseLoadingRef.current = true;

    queueMicrotask(() => {
      if (courseRequestIdRef.current !== currentRequestId) {
        courseLoadingRef.current = false;
        return;
      }
      setCourseLoading(true);
    });

    let result;
    try {
      result = await getCourse(Number(courseId));
    } catch (error) {
      console.error('Load course error:', error);
      if (courseRequestIdRef.current === currentRequestId) {
        setCourseLoading(false);
        courseLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (courseRequestIdRef.current !== currentRequestId) return;

    setCourseLoading(false);
    courseLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setCourse(result.data);
  }, [courseId]);

  // 加载课程资源列表数据
  const loadResources = useCallback(async () => {
    if (!courseId) return;
    if (resourceLoadingRef.current) return;

    const currentRequestId = ++resourceRequestIdRef.current;
    resourceLoadingRef.current = true;

    queueMicrotask(() => {
      if (resourceRequestIdRef.current !== currentRequestId) {
        resourceLoadingRef.current = false;
        return;
      }
      setResourceLoading(true);
    });

    let result;
    try {
      result = await getResourceList({ courseId: Number(courseId), page: resourcePage, pageSize });
    } catch (error) {
      console.error('Load resources error:', error);
      if (resourceRequestIdRef.current === currentRequestId) {
        setResourceLoading(false);
        resourceLoadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (resourceRequestIdRef.current !== currentRequestId) return;

    setResourceLoading(false);
    resourceLoadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setResources(result.data.records);
    setResourceTotal(result.data.total);
  }, [courseId, resourcePage, pageSize]);

  useEffect(() => {
    const effectRequestId = courseRequestIdRef.current;
    queueMicrotask(() => {
      loadCourse();
    });
    return () => {
      courseRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadCourse]);

  useEffect(() => {
    const effectRequestId = resourceRequestIdRef.current;
    queueMicrotask(() => {
      loadResources();
    });
    return () => {
      resourceRequestIdRef.current = effectRequestId + 1;
    };
  }, [loadResources]);

  // 创建新资源
  const handleCreateResource = async (values: Partial<ResourceInfo> & { file?: File }) => {
    const resourceCourseId = values.courseId || courseId;
    if (!resourceCourseId) {
      message.error('课程ID不存在');
      return;
    }

    if (!values.file) {
      message.error('请选择要上传的文件');
      return;
    }

    const formData = buildCreateResourceFormData({
      courseId: Number(resourceCourseId),
      title: values.title || '',
      description: values.description,
      resourceType: values.resourceType,
      price: values.price,
      accessScope: values.accessScope,
      file: values.file,
    });

    let result;
    try {
      result = await createResource(formData);
    } catch (error) {
      console.error('Create resource error:', error);
      message.error('创建失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '创建失败');
      return;
    }

    message.success('资源创建成功，等待审核');
    setResourceModalVisible(false);
    loadResources();
  };

  // 编辑资源信息
  const handleEditResource = async (values: Partial<ResourceInfo>) => {
    if (!editingResource || !editingResource.resourceId) {
      message.error('资源信息不存在');
      return;
    }

    let result;
    try {
      result = await updateResource(editingResource.resourceId, {
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
    setEditingResource(null);
    loadResources();
  };

  // 处理编辑资源点击事件
  const handleEditClick = (resource: ResourceInfo) => {
    setEditingResource(resource);
  };

  // 处理资源点击，跳转到资源详情页
  const handleResourceClick = (resource: ResourceInfo) => {
    if (resource.resourceId && courseId) {
      navigate(`/coursemgmt/${courseId}/resource/${resource.resourceId}`);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">课程不存在</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/coursemgmt')} className="mb-4">返回课程列表</Button>
          <h1 className="text-lg font-semibold text-[#1d1d1f]">课程详情</h1>
        </div>

        <CourseDetailCard course={course} />

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">资源列表</h2>
          {user?.role !== UserRole.STUDENT && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setResourceModalVisible(true)} className="rounded-lg">上传资源</Button>
          )}
        </div>
        <Card className="shadow-sm">
          <ResourceList data={resources} loading={resourceLoading} page={resourcePage} pageSize={pageSize} total={resourceTotal} onPageChange={(p, s) => { setResourcePage(p); setPageSize(s); }} onEdit={user?.role !== UserRole.STUDENT ? handleEditClick : undefined} onItemClick={handleResourceClick} />
        </Card>

        <Drawer title="上传资源" open={resourceModalVisible} onClose={() => setResourceModalVisible(false)} width={700} placement="right">
          {courseId && <ResourceForm courseId={Number(courseId)} onSubmit={handleCreateResource} onCancel={() => setResourceModalVisible(false)} />}
        </Drawer>

        <Drawer title="编辑资源" open={!!editingResource} onClose={() => setEditingResource(null)} width={700} placement="right">
          {editingResource && courseId && (
            <ResourceForm courseId={Number(courseId)} initialValues={editingResource} onSubmit={async (values) => { await handleEditResource(values); }} onCancel={() => setEditingResource(null)} />
          )}
        </Drawer>
      </div>
    </div>
  );
}
