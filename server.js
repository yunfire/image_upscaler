import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import sharp from 'sharp';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 設置 CORS 和 JSON 解析
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.static('public'));

// 處理圖片放大請求
app.post('/api/upscale', async (req, res) => {
    try {
        const { image, settings } = req.body;
        
        // 將 base64 圖片轉換為 buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
        
        if (settings.imageType === 'illustration') {
            // 創建 FormData
            const formData = new FormData();
            formData.append('file', imageBuffer, {
                filename: 'image.png',
                contentType: 'image/png'
            });

            // 使用 waifu2x API
            const response = await fetch(`https://unlimited.waifu2x.net`, {
                method: 'POST',
                headers: {
                    ...formData.getHeaders()
                },
                body: formData,
                // 添加查詢參數
                search: new URLSearchParams({
                    scale: settings.scale,
                    denoise: settings.noise
                }).toString()
            });

            if (!response.ok) {
                console.log(response)
                throw new Error('Waifu2x API 請求失敗');
            }

            const processedImageBuffer = await response.buffer();

            res.json({
                success: true,
                output_url: `data:image/png;base64,${processedImageBuffer.toString('base64')}`
            });
        } else {
            // 使用 sharp 處理普通照片
            const metadata = await sharp(imageBuffer).metadata();
            
            let sharpInstance = sharp(imageBuffer)
                .resize({
                    width: metadata.width * parseInt(settings.scale),
                    height: metadata.height * parseInt(settings.scale),
                    kernel: sharp.kernel.lanczos3
                });

            // 根據降噪程度設置不同的銳化參數
            // noise 值: 0=無, 1=低, 2=中, 3=高
            switch(parseInt(settings.noise)) {
                case 0: // 無降噪
                    break;
                case 1: // 低度降噪
                    sharpInstance = sharpInstance.median(1).sharpen(0.5, 0.5, 0.5);
                    break;
                case 2: // 中度降噪
                    sharpInstance = sharpInstance.median(2).sharpen(1, 0.8, 0.8);
                    break;
                case 3: // 高度降噪
                    sharpInstance = sharpInstance.median(3).sharpen(1.5, 1, 1);
                    break;
            }

            const processedImage = await sharpInstance
                .jpeg({
                    quality: 90,
                    force: false
                })
                .png({
                    quality: 90,
                    force: false
                })
                .toBuffer();

            res.json({
                success: true,
                output_url: `data:image/${metadata.format};base64,${processedImage.toString('base64')}`
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 