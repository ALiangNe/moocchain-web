import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Drawer, message, Input } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined, CodeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { createCertificateTemplate, updateCertificateTemplate, getCertificateTemplateList } from '@/api/baseApi';
import type { CertificateTemplateInfo } from '@/types/certificateTemplateType';
import CertificateTemplateForm from '@/components/certificateTemplate/CertificateTemplateForm';
import CertificateTemplateListCard from '@/components/certificateTemplate/CertificateTemplateListCard';
import CertificateTemplateDetail from '@/components/certificateTemplate/CertificateTemplateDetail';
import CertificateTemplateFilterBar, { type TemplateActiveFilter } from '@/components/certificateTemplate/CertificateTemplateFilterBar';
import { UserRole } from '@/constants/role';
import certificateTemplateJson from '@/constants/certificateTemplate.json';

const { TextArea } = Input;

export default function CertificateTemplate() {
  const user = useAuthStore((state) => state.user);
  const [templates, setTemplates] = useState<CertificateTemplateInfo[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [jsonTemplateDrawerVisible, setJsonTemplateDrawerVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplateInfo | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 筛选条件（真正用于请求的）
  const [isActiveFilter, setIsActiveFilter] = useState<TemplateActiveFilter>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 临时输入状态，点击查询按钮后才同步到筛选条件
  const [isActiveInput, setIsActiveInput] = useState<TemplateActiveFilter>(undefined);
  const [dateRangeInput, setDateRangeInput] = useState<[Dayjs | null, Dayjs | null] | null>(null);

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

    const params: {
      page: number;
      pageSize: number;
      isActive?: number;
      startDate?: string;
      endDate?: string;
    } = { page, pageSize };

    if (isActiveFilter !== undefined) {
      params.isActive = isActiveFilter;
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
      params.endDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    let result;
    try {
      result = await getCertificateTemplateList(params);
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
  }, [user, page, pageSize, isActiveFilter, dateRange]);

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

    const templateId = currentTemplate.templateId;
    let result;
    try {
      result = await updateCertificateTemplate(templateId, values);
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
    setViewDrawerVisible(true);
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

  // 处理筛选输入变化（只更新临时状态，不触发查询）
  const handleIsActiveInputChange = (value: TemplateActiveFilter) => {
    setIsActiveInput(value);
  };

  const handleDateRangeInputChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRangeInput(dates);
  };

  // 点击查询按钮，将临时状态同步到实际筛选条件并触发查询
  const handleSearch = () => {
    setIsActiveFilter(isActiveInput);
    setDateRange(dateRangeInput);
    setPage(1);
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="py-12">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm mb-6 rounded-2xl">
            <h1 className="text-lg font-semibold text-[#1d1d1f]">证书模板管理</h1>
          </Card>
          <Card className="shadow-sm rounded-2xl">
            <p className="text-center text-[#6e6e73]">只有管理员可以访问此页面</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <div className="flex justify-between items-center">
            <CertificateTemplateFilterBar isActive={isActiveInput} onIsActiveChange={handleIsActiveInputChange} dateRange={dateRangeInput} onDateRangeChange={handleDateRangeInputChange} onSearch={handleSearch} />
            <div className="flex gap-3">
              <Button type="primary" icon={<CodeOutlined />} onClick={() => setJsonTemplateDrawerVisible(true)} className="rounded-lg">JSON模板</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} className="rounded-lg">创建模板</Button>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm rounded-2xl">
          <CertificateTemplateListCard templates={templates} loading={templateLoading} page={page} pageSize={pageSize} total={total} onPageChange={(p, s) => { setPage(p); setPageSize(s); }} onEdit={handleEdit} onView={handleView} />
        </Card>

        <Drawer title={currentTemplate ? '编辑证书模板' : '创建证书模板'} open={drawerVisible} onClose={handleCloseDrawer} width={700} placement="right">
          <CertificateTemplateForm initialValues={currentTemplate} onSubmit={currentTemplate ? handleUpdateTemplate : handleCreateTemplate} onCancel={handleCloseDrawer} />
        </Drawer>

        <Drawer title="查看证书模板" open={viewDrawerVisible} onClose={() => setViewDrawerVisible(false)} width={700} placement="right" >
          {currentTemplate && <CertificateTemplateDetail template={currentTemplate} />}
        </Drawer>

        <Drawer title="JSON模板" open={jsonTemplateDrawerVisible} onClose={() => setJsonTemplateDrawerVisible(false)} width={800} placement="right">
          <TextArea value={JSON.stringify(certificateTemplateJson, null, 2)} rows={30} readOnly className="font-mono text-sm" style={{ resize: 'none' }} />
        </Drawer>
      </div>
    </div>
  );
}
