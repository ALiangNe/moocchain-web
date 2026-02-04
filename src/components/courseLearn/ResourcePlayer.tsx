import { useRef, useEffect, useState } from 'react';
import { Card, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ResourceInfo } from '@/types/resourceType';

interface ResourcePlayerProps {
  resource: ResourceInfo;
  fileUrl: string;
  onDownload?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

export default function ResourcePlayer({ resource, fileUrl, onDownload, onTimeUpdate, onComplete }: ResourcePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const reportIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportTimeRef = useRef<number>(0);
  // 记录用户实际观看到的最远时间，用于禁止快进但允许回看
  const maxWatchedTimeRef = useRef<number>(0);

  const resourceType = resource.resourceType || 0;

  // 处理视频/音频时间更新
  useEffect(() => {
    if (resourceType !== 2 && resourceType !== 3) return;

    const mediaElement = resourceType === 3 ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      // 每次加载新媒体时重置时间相关状态
      setCurrentTime(0);
      lastReportTimeRef.current = 0;
      maxWatchedTimeRef.current = 0;
    };

    const handleTimeUpdate = () => {
      const current = mediaElement.currentTime;
      setCurrentTime(current);
      // 记录用户实际观看到的最远时间（只增加不减少）
      if (current > maxWatchedTimeRef.current) {
        maxWatchedTimeRef.current = current;
      }
      if (onTimeUpdate) {
        onTimeUpdate(current, mediaElement.duration);
      }
    };

    const handleEnded = () => {
      if (onComplete) {
        onComplete();
      }
    };

    // 禁止快进但允许回放：当用户拖动进度条到超过已观看的最大时间时，将播放位置拉回
    const handleSeeking = () => {
      const current = mediaElement.currentTime;
      // 允许回看（拖到已看过的时间以内）
      if (current <= maxWatchedTimeRef.current + 0.1) {
        return;
      }
      // 禁止快进：拉回到已观看的最远位置
      mediaElement.currentTime = maxWatchedTimeRef.current;
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('seeking', handleSeeking);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('seeking', handleSeeking);
    };
  }, [resourceType, onTimeUpdate, onComplete]);

  // 定期上报学习时间（10-15秒周期）
  useEffect(() => {
    if (resourceType !== 2 && resourceType !== 3) return;
    if (duration === 0) return;

    // 每12秒上报一次（10-15秒的中间值）
    reportIntervalRef.current = setInterval(() => {
      const mediaElement = resourceType === 3 ? videoRef.current : audioRef.current;
      if (!mediaElement) return;

      const current = mediaElement.currentTime;
      const timeIncrement = current - lastReportTimeRef.current;

      // 只上报有效的学习时间增量（5-20秒范围内）
      if (timeIncrement >= 5 && timeIncrement <= 20) {
        // 这里不直接调用API，而是通过回调传递给父组件
        // 父组件会处理API调用
      }

      lastReportTimeRef.current = current;
    }, 12000); // 12秒

    return () => {
      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current);
      }
    };
  }, [resourceType, duration]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="shadow-sm mb-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">资源播放</h2>
        </div>
      </Card>
      <Card className="shadow-sm rounded-2xl">
        <div className="w-full">
          {resourceType === 3 && (
            <div>
              <video ref={videoRef} controls className="w-full rounded-lg" src={fileUrl}>您的浏览器不支持视频播放</video>
              {duration > 0 && (
                <div className="mt-2 text-sm text-[#6e6e73] text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>
          )}
          {resourceType === 2 && (
            <div>
              <audio ref={audioRef} controls className="w-full" src={fileUrl}>您的浏览器不支持音频播放</audio>
              {duration > 0 && (
                <div className="mt-2 text-sm text-[#6e6e73] text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>
          )}
          {resourceType === 1 && (
            <div className="w-full h-[200px] border border-gray-200 rounded-lg">
              {fileUrl.endsWith('.pdf') ? (
                <iframe src={fileUrl} className="w-full h-full rounded-lg" title={resource.title} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#6e6e73]">
                  <p className="mb-4">该文档类型不支持在线预览</p>
                  {onDownload && (
                    <Button type="primary" icon={<DownloadOutlined />} onClick={onDownload}>下载查看</Button>
                  )}
                </div>
              )}
            </div>
          )}
          {resourceType === 0 && (
            <div className="text-center py-12 text-[#6e6e73]">
              <p>该资源类型不支持预览</p>
              {onDownload && (
                <Button type="link" onClick={onDownload} className="mt-4">点击下载查看</Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
