import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, message, Tag, Button } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { createTeacherApplication, getAuditRecordList, uploadCertificate } from '@/api/baseApi';
import type { AuditRecordInfo } from '@/types/auditRecordType';
import { UserRole, RoleName, type UserRoleType } from '@/constants/role';
import ApplyStatusCard from '@/components/teacherApply/ApplyStatusCard';
import CertificateUpload from '@/components/teacherApply/CertificateUpload';
import { formatDateTime } from '@/utils/formatTime';

export default function TeacherApply() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auditRecord, setAuditRecord] = useState<AuditRecordInfo | null>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // 加载审核记录的函数，供外部调用
  const loadAuditRecord = useCallback(async () => {
    if (!user?.userId) return;
    if (loadingRef.current) return;

    const currentUserId = user.userId;
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
      result = await getAuditRecordList({ targetId: currentUserId, page: 1, pageSize: 1 });
    } catch (error) {
      console.error('Load audit record error:', error);
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        loadingRef.current = false;
      }
      return;
    }

    if (requestIdRef.current !== currentRequestId) {
      return;
    }

    setLoading(false);
    loadingRef.current = false;

    if (result.code !== 0) return;
    if (!result.data?.records || result.data.records.length === 0) return;

    setAuditRecord(result.data.records[0]);
  }, [user]);

  useEffect(() => {
    // 如果正在加载中，则不重复加载
    if (loadingRef.current) {
      return;
    }

    // 保存当前的 requestId，用于 cleanup
    const effectRequestId = requestIdRef.current;

    // 使用 queueMicrotask 延迟调用，避免在 effect 中同步调用 setState
    queueMicrotask(() => {
      loadAuditRecord();
    });

    // 清理函数：组件卸载或依赖变化时取消请求
    return () => {
      // 标记当前请求为过期（通过增加 requestId）
      requestIdRef.current = effectRequestId + 1;
    };
  }, [loadAuditRecord]);

  // 上传教师认证材料
  const handleUploadMaterial = async (file: File) => {
    setLoading(true);

    let result;
    try {
      result = await uploadCertificate(file);
    } catch (error) {
      console.error('Upload material error:', error);
      message.error('上传失败，请重试');
      setLoading(false);
      return;
    }

    setLoading(false);

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '上传失败');
      return;
    }

    setAuth(accessToken, result.data);
    message.success('材料上传成功');
  };

  // 提交教师认证申请
  const handleSubmitApplication = async () => {
    if (!user?.userId) return;

    if (!user.certificateFile) {
      message.warning('请先上传认证材料');
      return;
    }

    if (auditRecord?.auditStatus === 0) {
      message.warning('您已有待审核的申请，请勿重复提交');
      return;
    }

    setSubmitting(true);

    let result;
    try {
      result = await createTeacherApplication({});
    } catch (error) {
      console.error('Submit application error:', error);
      message.error('提交失败，请重试');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    if (result.code !== 0 || !result.data) {
      message.error(result.message || '提交失败');
      return;
    }

    setAuditRecord(result.data);
    message.success('申请提交成功，等待管理员审核');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  const isTeacher = user.role === UserRole.TEACHER;
  const currentStatus = auditRecord?.auditStatus ?? -1;
  const canSubmit = !isTeacher && currentStatus !== 0;
  const showReuploadButton = !isTeacher && currentStatus !== 0;

  return (
    <div className="py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm mb-8 rounded-2xl">
          <h1 className="text-lg font-semibold text-[#1d1d1f]">教师认证</h1>
        </Card>

        <Card className="shadow-sm mb-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">基本信息</h2>
          <div className="flex items-center gap-4">
            <Tag color="default" className="text-base px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 rounded-lg">{user.username}</Tag>
            <Tag color="default" className="text-base px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 rounded-lg">
              {user.role != null && (user.role as UserRoleType) in RoleName ? RoleName[user.role as UserRoleType] : '未知角色'}
            </Tag>
          </div>
        </Card>

        {auditRecord ? (
          <Card className="shadow-sm mb-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">审核信息</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                {(() => {
                  const status = auditRecord.auditStatus;
                  const statusConfig = {
                    0: { text: '待审核', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    1: { text: '已通过', color: 'bg-green-50 text-green-700 border-green-200' },
                    2: { text: '已拒绝', color: 'bg-red-50 text-red-700 border-red-200' },
                  };
                  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
                  return (
                    <>
                      <div className={`text-base px-4 py-2 rounded-lg border ${currentStatus.color}`}>
                        {currentStatus.text}
                      </div>
                      {auditRecord.auditTime && (
                        <div className={`text-base px-4 py-2 rounded-lg border ${currentStatus.color}`}>
                          审核时间：{formatDateTime(auditRecord.auditTime)}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {auditRecord.auditComment && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">审核意见</p>
                  <p className="text-gray-600">{auditRecord.auditComment}</p>
                </div>
              )}
              <ApplyStatusCard auditRecord={auditRecord} />
            </div>
          </Card>
        ) : (
          <Card className="shadow-sm mb-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">审核信息</h2>
            <ApplyStatusCard auditRecord={auditRecord} />
          </Card>
        )}

        <Card className="shadow-sm mb-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4 text-[#1d1d1f]">上传认证材料</h2>
          <CertificateUpload user={user} onUpload={handleUploadMaterial} loading={loading} showReuploadButton={showReuploadButton} />
        </Card>

        {canSubmit && (
          <Card className="shadow-sm mb-6 rounded-2xl">
            <div className="text-center">
              <p className="text-gray-600 mb-4">请先上传认证材料，然后提交申请等待管理员审核</p>
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmitApplication} className="bg-[#007aff] border-[#007aff] hover:bg-[#0051d5] hover:border-[#0051d5]">
                提交申请
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

