interface ImageMessage {
  imageBitmap: ImageBitmap;
}

self.onmessage = async function (e: { data: ImageMessage }) {
  const { imageBitmap } = e.data;
  const { width, height } = imageBitmap;

  // 1. 创建 OffscreenCanvas 并绘制 ImageBitmap
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageBitmap, 0, 0);

  // 释放 ImageBitmap
  imageBitmap.close();

  // 2. 获取像素数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const len = pixels.length;

  // --- 采样计算平均亮度 ---
  let totalLuminance = 0;
  let sampleCount = 0;
  const step = Math.max(4, Math.floor(len / 40000)) * 4;

  for (let i = 0; i < len; i += step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount++;
  }

  const avgLuminance = totalLuminance / sampleCount / 255;

  // --- 计算 Gamma ---
  const safeAvg = Math.max(0.01, Math.min(0.99, avgLuminance));
  let gamma = Math.log(0.5) / Math.log(safeAvg);
  gamma = Math.max(0.5, Math.min(2.5, gamma));

  // --- 生成 LUT ---
  const gammaLUT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    gammaLUT[i] = Math.pow(i / 255, gamma) * 255;
  }

  // --- 应用像素修改 ---
  for (let i = 0; i < len; i += 4) {
    pixels[i] = gammaLUT[pixels[i]];
    pixels[i + 1] = gammaLUT[pixels[i + 1]];
    pixels[i + 2] = gammaLUT[pixels[i + 2]];
  }

  // 3. 将修改后的像素数据放回 Canvas
  ctx.putImageData(imageData, 0, 0);

  // 4. 导出为 Blob 并发送回主线程
  const blob = await canvas.convertToBlob({ type: "image/png" });
  self.postMessage({ blob });
};
