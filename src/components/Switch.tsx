import { useEffect } from 'react';

/**
 * Switch 全局配置组件
 * 移除所有 antd Switch 的 focus 和 active 状态下的黑色边框
 */
export default function SwitchConfig() {
  useEffect(() => {
    // 创建样式元素
    const styleId = 'antd-switch-no-focus-outline';
    
    // 检查是否已经存在样式
    if (document.getElementById(styleId)) {
      return;
    }

    // 创建 style 元素
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 移除所有 antd Switch 的 focus 和 active 状态下的黑色边框 */
      .ant-switch:focus,
      .ant-switch:focus-visible,
      .ant-switch:active,
      .ant-switch:focus-within {
        outline: none !important;
        box-shadow: none !important;
      }
    `;

    // 添加到 document.head
    document.head.appendChild(style);

    // 清理函数：组件卸载时移除样式
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return null;
}
