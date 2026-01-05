import { useEffect } from 'react';
import { message } from 'antd';

/**
 * Message 配置组件
 */
export default function Message() {
  useEffect(() => {
    // 配置 message 全局设置
    // top: 距离顶部的距离，设置为 100px，避免被 header 遮挡
    // header 是 sticky 定位，高度约 64px，设置 100px 确保有足够间距
    message.config({
      top: 70,
      duration: 3, // 默认显示时长 3 秒
      maxCount: 3, // 最多同时显示 3 条消息
    });
  }, []);

  return null;
}

