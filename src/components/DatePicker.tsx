import { useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

/**
 * DatePicker 全局配置组件
 * 配置 dayjs 和 Ant Design DatePicker 使用中文
 */
export default function DatePickerConfig() {
  useEffect(() => {
    // 配置 dayjs 全局使用中文
    dayjs.locale('zh-cn');
  }, []);

  return null;
}
