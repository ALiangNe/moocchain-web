import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { createCertificateTemplate, updateCertificateTemplate, getCertificateTemplateList } from '@/api/baseApi';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import CertificateTemplateForm from '@/components/certificateTemplate/CertificateTemplateForm';
import CertificateTemplateListCard from '@/components/certificateTemplate/CertificateTemplateListCard';
import { UserRole } from '@/constants/role';

export default function CertificateTemplate() {
  const user = useAuthStore((state) => state.user);
  const [templates, setTemplates] = useState<CertificateTemplateInfo[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplateInfo | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载模板列表数据
  const loadTemplates = useCallback(async () => {
    if (!user?.userId || user.role !== UserRole.ADMIN) return;
    if (loadingRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    loadingRef.current = true;

    queueMicrotask(() => {
      if (requestIdRef.current !== currentRequestId) {
        loadingRef.current = false;
        return;
      }
      setTemplateLoading(true);
    });

    let result;
    try {
      result = await getCertificateTemplateList({ page, pageSize });
    } catch (error) {
      console.error('Load templates error:', error);
      if (requestIdRef.current === currentRequestId) {
        setTemplateLoading(false);
        loadingRef.current = false;
        message.error('加载失败，请重试');
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    setTemplateLoading(false);
    loadingRef.current = false;

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '加载失败');
      return;
    }

    setTemplates(result.data.records);
    setTotal(result.data.total);
  }, [user, page, pageSize]);

  useEffect(() => {
    const effectRequestId = requestIdRef.current;
    queueMicrotask(() => {
      loadTemplates();
    });
    return () => {
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadTemplates]);

  // 创建新模板
  const handleCreateTemplate = async (values: Partial<CertificateTemplateInfo>) => {
    let result;
    try {
      result = await createCertificateTemplate(values);
    } catch (error) {
      console.error('Create template error:', error);
      message.error('创建失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '创建失败');
      return;
    }

    message.success('证书模板创建成功');
    setDrawerVisible(false);
    loadTemplates();
  };

  // 更新模板
  const handleUpdateTemplate = async (values: Partial<CertificateTemplateInfo>) => {
    if (!currentTemplate?.templateId) return;

    let result;
    try {
      result = await updateCertificateTemplate(currentTemplate.templateId, values);
    } catch (error) {
      console.error('Update template error:', error);
      message.error('更新失败，请重试');
      return;
    }

    if (result.code !== 0) {
      message.error(result.message || '更新失败');
      return;
    }

    message.success('证书模板更新成功');
    setDrawerVisible(false);
    setCurrentTemplate(undefined);
    loadTemplates();
  };

  // 编辑模板：直接使用列表数据回显
  const handleEdit = (template: CertificateTemplateInfo) => {
    setCurrentTemplate(template);
    setDrawerVisible(true);
  };

  // 查看模板：直接使用列表数据回显
  const handleView = (template: CertificateTemplateInfo) => {
    setCurrentTemplate(template);
    setViewModalVisible(true);
  };

  // 打开创建抽屉
  const handleOpenCreate = () => {
    setCurrentTemplate(undefined);
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentTemplate(undefined);
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-lg font-semibold mb-6 text-[#1d1d1f]">证书模板管理</h1>
          <Card className="shadow-sm">
            <p className="text-center text-[#6e6e73]">只有管理员可以访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">证书模板管理</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} className="rounded-lg">创建模板</Button>
        </div>

        <Card className="shadow-sm">
          <CertificateTemplateListCard templates={templates} loading={templateLoading} page={page} pageSize={pageSize} total={total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onEdit={handleEdit} onView={handleView} />
        </Card>

        <Drawer title={currentTemplate ? '编辑证书模板' : '创建证书模板'} open={drawerVisible} onClose={handleCloseDrawer} width={700} placement="right">
          <CertificateTemplateForm initialValues={currentTemplate} onSubmit={currentTemplate ? handleUpdateTemplate : handleCreateTemplate} onCancel={handleCloseDrawer} />
        </Drawer>

        <Modal title="查看证书模板" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} footer={null} width={800}>
          {currentTemplate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">模板名称</h3>
                <p className="text-[#6e6e73]">{currentTemplate.templateName}</p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">模板配置（JSON）</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                  {currentTemplate.templateContent
                    ? typeof currentTemplate.templateContent === 'string'
                      ? JSON.stringify(JSON.parse(currentTemplate.templateContent), null, 2)
                      : JSON.stringify(currentTemplate.templateContent, null, 2)
                    : '-'}
                </pre>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">启用状态</h3>
                <p className="text-[#6e6e73]">{currentTemplate.isActive === 1 ? '启用' : '禁用'}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
