// ==========================================================
// 1. 初期化処理
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // AOS (Animate On Scroll) 初期化
    AOS.init({
        duration: 1200,
        once: true
    });

    // ライブ詳細モーダルの初期状態を設定
    const modal = document.getElementById('live-detail-modal');
    if (modal) {
        modal.classList.add('modal-hidden');
    }

    // ギャラリー画像の初期化
    initGallery();

    // BGM関連の初期化
    initBGM();
});

// ==========================================================
// 2. ハンバーガーメニューの開閉
// ==========================================================
function toggleNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.toggle('nav-visible');
    
    // ナビゲーションが開いた時に、背景のスクロールを止める
    document.body.classList.toggle('no-scroll', nav.classList.contains('nav-visible'));
}

function closeNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.remove('nav-visible');
    document.body.classList.remove('no-scroll');
}

// ==========================================================
// 3. ライブ詳細モーダルの表示/非表示
// ==========================================================
function toggleLiveModal(event) {
    const modal = document.getElementById('live-detail-modal');
    
    // モーダルの背景クリック（modal-contentではない部分）でのみ閉じる
    if (event && event.target.id === 'live-detail-modal') {
        modal.classList.add('modal-hidden');
    } 
    // オーバーレイクリックまたは閉じるボタンクリック時
    else if (!event || event.target.id === 'live-info-overlay' || event.target.classList.contains('modal-close')) {
        modal.classList.toggle('modal-hidden');
    }
    
    // モーダルが開いた時に、背景のスクロールを止める
    document.body.classList.toggle('no-scroll', !modal.classList.contains('modal-hidden'));
}

// ==========================================================
// 4. NEWSセクションのアコーディオン開閉
// ==========================================================
function toggleAccordion(detailId) {
    const detail = document.getElementById(detailId);
    if (!detail) return;
    
    const accordionItem = detail.closest('.news-accordion');
    accordionItem.classList.toggle('open');
}

// ==========================================================
// 5. CONTACTフォームの送信処理
// ==========================================================
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = document.getElementById('contact-form');
    const statusMessage = document.getElementById('form-status-message');
    const submitButton = document.getElementById('submit-button');

    // フォームを無効化
    submitButton.disabled = true;
    submitButton.textContent = '送信中...';
    statusMessage.textContent = 'メッセージを送信しています。しばらくお待ちください...';
    statusMessage.style.color = '#fff';

    // 模擬的な送信遅延（3秒後）
    setTimeout(() => {
        statusMessage.textContent = 'お問い合わせありがとうございます！3営業日以内に返信いたします。';
        statusMessage.style.color = '#e0b466'; 
        
        form.reset();
        
        submitButton.disabled = false;
        submitButton.textContent = '送信';
    }, 3000); 
}

// ==========================================================
// 6. BGM機能
// ==========================================================
let bgmAudio = null;
let isBGMPlaying = false;

function initBGM() {
    bgmAudio = document.getElementById('bgm-audio');
    if (!bgmAudio) return;

    // 初期音量を設定（30%）
    bgmAudio.volume = 0.3;

    // メタデータ読み込み完了後にトラック情報を表示
    bgmAudio.addEventListener('loadedmetadata', updateTrackInfo);
    
    // 既にロード済みの場合は即座に実行
    if (bgmAudio.readyState >= 1) {
        updateTrackInfo();
    }

    // ブラウザの自動再生ポリシー対応
    document.body.addEventListener('click', function enableBGM() {
        if (!isBGMPlaying) {
            bgmAudio.play().then(() => {
                bgmAudio.pause();
                bgmAudio.currentTime = 0;
            }).catch(() => {
                // 自動再生が許可されていない場合は何もしない
            });
        }
        document.body.removeEventListener('click', enableBGM);
    }, { once: true });
}

async function updateTrackInfo() {
    const trackNameElement = document.getElementById('bgm-track-name');
    if (!trackNameElement || !bgmAudio) return;

    // audioのsourceタグから最初のファイルパスを取得
    const sources = bgmAudio.querySelectorAll('source');
    let filePath = '';
    
    for (let source of sources) {
        const src = source.getAttribute('src');
        if (src) {
            filePath = src;
            break;
        }
    }

    if (!filePath) {
        trackNameElement.innerHTML = '<span style="opacity: 0.6;">BGM未選択</span>';
        return;
    }

    try {
        // ファイルを取得してメタデータを読み込む
        const response = await fetch(filePath);
        const blob = await response.blob();
        
        // jsmediatags（CDN経由で読み込み想定）が利用可能か確認
        if (typeof jsmediatags !== 'undefined') {
            jsmediatags.read(blob, {
                onSuccess: function(tag) {
                    const tags = tag.tags;
                    let displayText = '';
                    
                    // タイトル
                    if (tags.title) {
                        displayText += tags.title;
                    }
                    
                    // アーティスト
                    if (tags.artist) {
                        displayText += displayText ? ' / ' + tags.artist : tags.artist;
                    }
                    
                    // アルバム
                    if (tags.album) {
                        displayText += displayText ? '<br><span style="font-size: 9px; opacity: 0.7;">' + tags.album : '<span style="font-size: 9px; opacity: 0.7;">' + tags.album;
                        
                        // 年
                        if (tags.year) {
                            displayText += ' (' + tags.year + ')';
                        }
                        displayText += '</span>';
                    } else if (tags.year) {
                        displayText += displayText ? '<br><span style="font-size: 9px; opacity: 0.7;">' + tags.year + '</span>' : '<span style="font-size: 9px; opacity: 0.7;">' + tags.year + '</span>';
                    }
                    
                    // メタデータがない場合はファイル名を表示
                    if (!displayText) {
                        displayText = filePath.split('/').pop();
                    }
                    
                    trackNameElement.innerHTML = displayText;
                },
                onError: function(error) {
                    // エラー時はファイル名を表示
                    trackNameElement.textContent = filePath.split('/').pop();
                }
            });
        } else {
            // jsmediatagsが利用できない場合はファイル名を表示
            trackNameElement.textContent = filePath.split('/').pop();
        }
    } catch (error) {
        // フェッチエラー時はファイル名を表示
        trackNameElement.textContent = filePath.split('/').pop();
    }
}

function toggleBGM() {
    if (!bgmAudio) return;

    const icon = document.getElementById('bgm-icon');
    
    if (isBGMPlaying) {
        // BGMを停止
        bgmAudio.pause();
        isBGMPlaying = false;
        icon.textContent = '🔇';
    } else {
        // BGMを再生
        bgmAudio.play().catch(error => {
            console.log('BGM再生エラー:', error);
            alert('BGMの再生に失敗しました。\n音声ファイル（MP3またはWAV）が正しく配置されているかご確認ください。');
        });
        isBGMPlaying = true;
        icon.textContent = '🔊';
    }
}

function adjustVolume(value) {
    if (!bgmAudio) return;

    const volume = value / 100;
    bgmAudio.volume = volume;
    
    // 音量パーセンテージを表示
    const volumePercentage = document.getElementById('volume-percentage');
    if (volumePercentage) {
        volumePercentage.textContent = value + '%';
    }

    // 音量0の場合はミュートアイコンに変更
    const icon = document.getElementById('bgm-icon');
    if (icon) {
        if (value == 0) {
            icon.textContent = '🔇';
        } else if (isBGMPlaying) {
            icon.textContent = '🔊';
        }
    }
}

// ==========================================================
// 7. GALLERY ジャスティファイ・レイアウト計算処理
// ==========================================================

const MAX_ROW_HEIGHT = 250; // PCでの基準の行の高さ
const MOBILE_MAX_ROW_HEIGHT = 120; // モバイルでの基準の行の高さ

function getContainerWidth() {
    const container = document.querySelector('.justified-container');
    if (!container) return 0;
    return container.getBoundingClientRect().width;
}

function getAspectRatio(imgElement) {
    // 画像がロード済みの場合はnaturalサイズを使用
    if (imgElement.naturalWidth && imgElement.naturalHeight) {
        return imgElement.naturalWidth / imgElement.naturalHeight;
    }
    // ロード中の場合は表示サイズを使用（フォールバック）
    if (imgElement.width && imgElement.height) {
        return imgElement.width / imgElement.height;
    }
    // デフォルト値（正方形と仮定）
    return 1;
}

function justifyImages() {
    const container = document.querySelector('.justified-container');
    if (!container) return;

    const isMobile = window.innerWidth <= 768;
    const targetRowHeight = isMobile ? MOBILE_MAX_ROW_HEIGHT : MAX_ROW_HEIGHT; 
    
    const items = Array.from(container.querySelectorAll('.gallery-item'));
    if (items.length === 0) return;

    let row = [];
    let currentRowWidth = 0;
    const containerWidth = getContainerWidth();
    const gap = isMobile ? 3 : 5;

    items.forEach((item, index) => {
        const img = item.querySelector('img');
        const aspectRatio = getAspectRatio(img);
        const targetWidth = aspectRatio * targetRowHeight;
        
        if (currentRowWidth + targetWidth + (row.length * gap) > containerWidth && row.length > 0) {
            renderRow(row, containerWidth, gap, targetRowHeight);
            row = [item];
            currentRowWidth = targetWidth;
        } else {
            row.push(item);
            currentRowWidth += targetWidth;
        }

        if (index === items.length - 1) {
            renderRow(row, containerWidth, gap, targetRowHeight, true); 
        }
    });
}

function renderRow(row, containerWidth, gap, maxRowHeight, isLastRow = false) {
    if (row.length === 0) return;

    const totalGap = (row.length - 1) * gap;

    const totalTargetWidth = row.reduce((sum, item) => {
        const img = item.querySelector('img');
        const aspectRatio = getAspectRatio(img);
        return sum + aspectRatio * maxRowHeight; 
    }, 0);

    if (!isLastRow) {
        const scaleFactor = (containerWidth - totalGap) / totalTargetWidth;
        const newRowHeight = maxRowHeight * scaleFactor;

        row.forEach(item => {
            const img = item.querySelector('img');
            const aspectRatio = getAspectRatio(img);
            const newWidth = aspectRatio * newRowHeight;

            item.style.height = `${newRowHeight}px`;
            item.style.width = `${newWidth}px`;
            item.style.flexGrow = '0';
        });
    } else {
        row.forEach(item => {
            const img = item.querySelector('img');
            const aspectRatio = getAspectRatio(img);
            const targetHeight = maxRowHeight;

            item.style.height = `${targetHeight}px`;
            item.style.width = `${aspectRatio * targetHeight}px`;
            item.style.flexGrow = '0';
        });
    }
}

// ギャラリーの初期化処理（改善版）
function initGallery() {
    const container = document.querySelector('.justified-container');
    if (!container) return;

    const images = container.querySelectorAll('.gallery-item img');
    let loadedCount = 0;
    let totalImages = images.length;

    // 全画像のロード完了を監視
    images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
            // 既にロード済み
            loadedCount++;
            if (loadedCount === totalImages) {
                justifyImages();
            }
        } else {
            // ロード完了を待つ
            img.addEventListener('load', () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    justifyImages();
                }
            });
            
            // エラー時も処理を継続
            img.addEventListener('error', () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    justifyImages();
                }
            });
        }
    });

    // 既に全てロード済みの場合の保険
    if (loadedCount === totalImages && totalImages > 0) {
        justifyImages();
    }
}

// ウィンドウサイズ変更時にもレイアウト計算を再実行
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        justifyImages();
    }, 150);
});

// 画面の完全なロード後にも一度実行（保険）
window.addEventListener('load', () => {
    setTimeout(() => {
        justifyImages();
    }, 100);
});