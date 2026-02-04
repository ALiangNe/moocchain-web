import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { register } from '@/api/baseApi';
import type { ResponseType } from '@/types/responseType';
import type { UserInfo } from '@/types/userType';
import icon from '@/assets/images/moocchain-icon.png';
import exploreBg from '@/assets/images/explore-bg-04.jpg';
import RegisterForm from '@/components/register/RegisterForm';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 处理注册表单提交
  const onFinish = async (values: { username: string; password: string; email: string }, agreedToTerms: boolean) => {
    if (!agreedToTerms) {
      message.warning('请先同意服务条款和隐私政策');
      return;
    }

    setLoading(true);
    let response: ResponseType<UserInfo>;
    try {
      response = await register(values);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '请求失败');
      setLoading(false);
      return;
    }
    setLoading(false);

    if (response.code !== 0) {
      message.error(response.message || '注册失败');
      return;
    }

    message.success('注册成功，请登录');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center antialiased py-12 px-4 relative" style={{ backgroundImage: `url(${exploreBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="w-full max-w-md mx-auto">
        <div className="relative bg-white/70 rounded-2xl lg:rounded-3xl shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] overflow-hidden flex flex-col border border-slate-100/70">
          <div className="px-6 pt-8 pb-8 flex-1 flex flex-col gap-6">
            {/* Header */}
            <header className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
                <img src={icon} alt="MOOC Chain" className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">加入 MOOC Chain</h2>
              <p className="text-sm text-slate-500">创建您的账户，开始探索</p>
            </header>

            <RegisterForm onFinish={onFinish} loading={loading} />
          </div>

          {/* Footer */}
          <footer className="text-center text-sm pb-4 px-6 pt-2">
            <p className="text-slate-500">
              已有账户？{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors no-underline">
                立即登录
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

