import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { refreshToken } from './api/authApi'
import { useAuthStore } from './stores/authStore'
import './index.css'

// 应用启动时初始化认证状态（只执行一次）
const accessToken = useAuthStore.getState().accessToken;
if (!accessToken) {
  refreshToken().catch((error) => {
    console.error('初始化认证状态失败:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
