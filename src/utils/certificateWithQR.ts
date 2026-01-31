import { QRCode } from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * 将证书图片和二维码合成，生成新的图片
 * @param imageUrl 证书图片URL
 * @param qrCodeData 二维码数据（交易哈希）
 * @returns Promise<Blob> 合成后的图片Blob
 */
export async function generateCertificateWithQrCode(
  imageUrl: string,
  qrCodeData: string
): Promise<Blob> {
  // 1. 加载证书图片
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('无法加载证书图片'));
      image.src = imageUrl;
    });
  } catch {
    throw new Error('无法加载证书图片');
  }

  // 2. 创建canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }

  // 3. 设置canvas尺寸为证书图片尺寸
  canvas.width = img.width;
  canvas.height = img.height;

  // 4. 绘制证书图片
  ctx.drawImage(img, 0, 0);

  // 5. 生成二维码canvas（二维码数据格式：证书唯一哈希：xxxxx）
  const qrCodeText = `${qrCodeData}`;
  let qrCodeCanvas: HTMLCanvasElement;
  try {
    qrCodeCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      // 创建一个临时容器来渲染QRCode组件
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '150px';
      container.style.height = '150px';
      document.body.appendChild(container);

      // 使用React渲染QRCode
      let root;
      try {
        root = createRoot(container);
      } catch {
        document.body.removeChild(container);
        reject(new Error('无法创建React根节点'));
        return;
      }

      try {
        root.render(
          React.createElement(QRCode, {
            value: qrCodeText,
            size: 150,
            errorLevel: 'M',
            type: 'canvas',
          })
        );
      } catch {
        root.unmount();
        document.body.removeChild(container);
        reject(new Error('无法渲染二维码组件'));
        return;
      }

      // 等待QRCode渲染完成
      setTimeout(() => {
        const canvasElement = container.querySelector('canvas') as HTMLCanvasElement;
        
        if (!canvasElement) {
          root.unmount();
          document.body.removeChild(container);
          reject(new Error('二维码渲染失败'));
          return;
        }

        // 清理
        root.unmount();
        document.body.removeChild(container);
        resolve(canvasElement);
      }, 200);
    });
  } catch {
    throw new Error('无法生成二维码');
  }
  
  // 6. 将二维码canvas转换为图片
  let qrCodeImg: HTMLImageElement;
  try {
    qrCodeImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('无法加载二维码图片'));
      image.src = qrCodeCanvas.toDataURL('image/png');
    });
  } catch {
    throw new Error('无法加载二维码图片');
  }

  // 7. 计算二维码位置（右下角，留出边距）
  const qrCodeSize = 150;
  const marginRight = 50;
  const marginBottom = 50;
  const qrCodeX = canvas.width - qrCodeSize - marginRight;
  const qrCodeY = canvas.height - qrCodeSize - marginBottom;

  // 8. 绘制白色背景（让二维码更清晰）
  const bgSize = qrCodeSize + 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(
    qrCodeX - 5,
    qrCodeY - 5,
    bgSize,
    bgSize
  );

  // 9. 绘制二维码
  ctx.drawImage(qrCodeImg, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

  // 10. 转换为Blob
  let blob: Blob;
  try {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('无法生成图片'));
        }
      }, 'image/png', 0.95);
    });
  } catch {
    throw new Error('无法生成图片');
  }

  return blob;
}
