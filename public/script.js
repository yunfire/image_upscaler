document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagesContainer = document.getElementById('imagesContainer');
    const batchSettings = {
        imageType: document.getElementById('batchImageType'),
        scale: document.getElementById('batchScale'),
        noise: document.getElementById('batchNoise')
    };
    const applyBatchBtn = document.getElementById('applyBatch');
    const processAllBtn = document.getElementById('processAll');
    const downloadAllBtn = document.getElementById('downloadAll');
    const removeAllBtn = document.getElementById('removeAll');

    // 拖曳上傳
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0071e3';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
        handleFiles(e.dataTransfer.files);
    });

    // 點擊上傳
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    createImageCard(e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
        });
        // 清空 fileInput 的值，這樣相同的文件可以再次上傳
        fileInput.value = '';
    }

    function createImageCard(imageUrl, fileName) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.processed = 'false';
        card.innerHTML = `
            <img src="${imageUrl}" class="image-preview" alt="${fileName}">
            <div class="card-settings">
                <select class="image-type">
                    <option value="">選擇圖片類型</option>
                    <option value="photo">照片</option>
                    <option value="illustration" style="display: none;">卡通/插畫</option>
                </select>
                <select class="scale">
                    <option value="">選擇放大倍數</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                </select>
                <select class="noise">
                    <option value="0">無降噪</option>
                    <option value="1">低度降噪</option>
                    <option value="2">中度降噪</option>
                    <option value="3">高度降噪</option>
                </select>
            </div>
            <div class="card-buttons">
                <button class="btn btn-primary download-single-btn" disabled>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 15L8 11H11V4H13V11H16L12 15Z"/>
                        <path d="M4 17V19H20V17H4Z"/>
                    </svg>
                    下載
                </button>
                <button class="btn btn-danger remove-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                    </svg>
                    移除
                </button>
            </div>
            <div class="processing-status">未處理</div>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
        `;

        // 添加移除按鈕事件
        const removeBtn = card.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            card.remove();
            // 如果沒有圖片了，禁用下載全部按鈕
            const remainingCards = document.querySelectorAll('.image-card');
            if (remainingCards.length === 0) {
                downloadAllBtn.disabled = true;
            }
            // 確保 fileInput 的值被清空
            fileInput.value = '';
        });

        // 添加下載按鈕事件
        const downloadBtn = card.querySelector('.download-single-btn');
        downloadBtn.addEventListener('click', () => {
            downloadImage(card.querySelector('img').src, fileName);
        });

        // 修改參數變更監聽器
        const settingsSelects = card.querySelectorAll('.card-settings select');
        settingsSelects.forEach(select => {
            select.addEventListener('change', () => {
                // 重置處理狀態
                card.dataset.processed = 'false';
                // 禁用下載按鈕並改變顏色
                const downloadBtn = card.querySelector('.download-single-btn');
                downloadBtn.disabled = true;
                // 更新狀態文字
                const statusDiv = card.querySelector('.processing-status');
                statusDiv.textContent = '未處理';
                statusDiv.style.color = '#6e6e73'; // 直接使用顏色代碼
                // 重置進度條
                card.querySelector('.progress').style.width = '0%';
                // 移除處理中的樣式
                card.classList.remove('processing');
                // 禁用批量下載按鈕
                downloadAllBtn.disabled = true;
            });
        });

        // 將卡片添加到 imagesContainer
        imagesContainer.appendChild(card);
        return card;
    }

    function downloadImage(imageUrl, fileName) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `processed_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadAllImages() {
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach(card => {
            const img = card.querySelector('img');
            const fileName = img.alt;
            downloadImage(img.src, fileName);
        });
    }

    // 批量設置
    applyBatchBtn.addEventListener('click', () => {
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach(card => {
            if (batchSettings.imageType.value) {
                card.querySelector('.image-type').value = batchSettings.imageType.value;
            }
            if (batchSettings.scale.value) {
                card.querySelector('.scale').value = batchSettings.scale.value;
            }
            if (batchSettings.noise.value) {
                card.querySelector('.noise').value = batchSettings.noise.value;
            }
        });
    });

    // 添加 processImage 函數
    async function processImage(originalImageUrl, settings) {
        try {
            const progressBar = settings.progressBar;
            const statusDiv = settings.statusDiv;
            updateProgress(progressBar, 20);
            statusDiv.textContent = '處理中...';
            statusDiv.style.color = '#6e6e73'; // 直接使用顏色代碼

            // 準備請求數據
            const requestData = {
                image: originalImageUrl,
                settings: {
                    imageType: settings.imageType,
                    scale: parseInt(settings.scale),
                    noise: parseInt(settings.noise)
                }
            };

            const response = await fetch('http://localhost:3000/api/upscale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('處理請求失敗');
            }

            updateProgress(progressBar, 60);
            statusDiv.textContent = '下載處理結果...';

            const result = await response.json();
            
            if (!result.success || !result.output_url) {
                throw new Error(result.error || '處理失敗');
            }

            updateProgress(progressBar, 100);
            statusDiv.textContent = '處理完成';
            statusDiv.style.color = '#34c759'; // 完成時使用綠色

            return result.output_url;

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // 添加 updateProgress 函數
    function updateProgress(progressBar, progress) {
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    // 添加進度更新函數
    function updateProgressBasedOnStatus(status, progressBar) {
        let progress = 0;
        switch (status) {
            case 'starting':
                progress = 10;
                break;
            case 'processing':
                progress = 50;
                break;
            case 'succeeded':
                progress = 100;
                break;
            default:
                progress = 0;
        }
        updateProgress(progressBar, progress);
    }

    // 修改處理圖片的點擊事件
    processAllBtn.addEventListener('click', async () => {
        const imageCards = document.querySelectorAll('.image-card');
        let allSettingsComplete = true;

        // 驗證設置
        imageCards.forEach(card => {
            // 跳過已處理的圖片
            if (card.dataset.processed === 'true') {
                return;
            }

            const settings = {
                imageType: card.querySelector('.image-type').value,
                scale: card.querySelector('.scale').value,
                noise: card.querySelector('.noise').value
            };
            
            if (!settings.imageType || !settings.scale || !settings.noise) {
                allSettingsComplete = false;
            }
        });

        if (!allSettingsComplete) {
            showError('請為所有未處理的圖片完成設置');
            return;
        }

        // 處理每張圖片
        for (const card of imageCards) {
            // 跳過已處理的圖片
            if (card.dataset.processed === 'true') {
                continue;
            }

            try {
                const statusDiv = card.querySelector('.processing-status');
                const downloadBtn = card.querySelector('.download-single-btn');
                const imgElement = card.querySelector('img');
                const progressBar = card.querySelector('.progress');
                const settings = {
                    imageType: card.querySelector('.image-type').value,
                    scale: card.querySelector('.scale').value,
                    noise: card.querySelector('.noise').value,
                    progressBar: progressBar,
                    statusDiv: statusDiv
                };
                
                card.classList.add('processing');
                statusDiv.textContent = '處理中...';
                
                const processedImageUrl = await processImage(imgElement.src, settings);
                
                imgElement.src = processedImageUrl;
                statusDiv.textContent = '處理完成';
                downloadBtn.disabled = false;
                card.classList.remove('processing');
                card.dataset.processed = 'true';
                
            } catch (error) {
                handleError(card, error);
            }
        }

        // 檢查是否所有圖片都已處理完成
        const allProcessed = Array.from(imageCards).every(card => 
            card.dataset.processed === 'true' || card.querySelector('.processing-status').textContent.includes('錯誤')
        );
        
        if (allProcessed) {
            downloadAllBtn.disabled = false;
        }
    });

    // 添加錯誤處理函數
    function handleError(card, error) {
        const statusDiv = card.querySelector('.processing-status');
        statusDiv.textContent = `錯誤: ${error.message}`;
        statusDiv.style.color = '#ff3b30';
        card.classList.remove('processing');
        
        // 確保下載按鈕保持禁用狀態
        const downloadBtn = card.querySelector('.download-single-btn');
        downloadBtn.disabled = true;
        
        showError(error.message);
    }

    // 添加錯誤提示函數
    function showError(message) {
        // 創建錯誤提示元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 3秒後自動移除錯誤提示
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // 添加錯誤提示樣式
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff3b30;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // 添加批量載事件監聽
    downloadAllBtn.addEventListener('click', downloadAllImages);

    removeAllBtn.addEventListener('click', () => {
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach(card => card.remove());
        downloadAllBtn.disabled = true;
        fileInput.value = '';
    });
}); 