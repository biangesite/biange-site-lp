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
// CONTACTフォーム送信処理（Web3Forms対応）
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitButton = document.getElementById('submit-button');
    const statusMessage = document.getElementById('form-status-message');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // デフォルトの送信を防ぐ
            
            // 送信中の状態に
            submitButton.disabled = true;
            submitButton.textContent = '送信中...';
            showMessage('sending', 'メッセージを送信しています...');
            
            // フォームデータを取得
            const formData = new FormData(form);
            
            try {
                // Web3Forms APIに送信
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 送信成功
                    showMessage('success', 'メッセージを送信しました！ご連絡ありがとうございます。');
                    form.reset(); // フォームをリセット
                    
                    // 5秒後にメッセージを非表示
                    setTimeout(() => {
                        hideMessage();
                    }, 5000);
                    
                } else {
                    // 送信失敗
                    showMessage('error', '送信に失敗しました。もう一度お試しください。');
                    console.error('Form submission error:', data);
                }
                
            } catch (error) {
                // ネットワークエラー等
                showMessage('error', '送信中にエラーが発生しました。インターネット接続を確認してください。');
                console.error('Network error:', error);
            } finally {
                // ボタンを元に戻す
                submitButton.disabled = false;
                submitButton.textContent = '送信';
            }
        });
    }
});

// メッセージ表示関数
function showMessage(type, message) {
    const statusMessage = document.getElementById('form-status-message');
    
    // 既存のクラスを削除
    statusMessage.className = 'form-status-skeleton';
    
    // 新しいクラスを追加
    statusMessage.classList.add(type);
    
    // メッセージを設定
    statusMessage.textContent = message;
}

// メッセージ非表示関数
function hideMessage() {
    const statusMessage = document.getElementById('form-status-message');
    statusMessage.className = 'form-status-skeleton';
    statusMessage.textContent = '';
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

// ページ読み込み時の処理
window.addEventListener('load', function() {
    // URLのハッシュを削除
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }
    
    // トップにスクロール（即座に）
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });
    
    // 画像の配置調整（少し遅延）
    setTimeout(() => {
        justifyImages();
    }, 100);
});
// ==========================================================
// ギャラリーモーダル機能
// ==========================================================

// ギャラリー画像配列（テンプレートから動的生成）
let galleryImages = [];

// ページ読み込み時にギャラリー画像を収集
document.addEventListener('DOMContentLoaded', function() {
    // すべてのギャラリーイベントから画像を収集
    const allImages = document.querySelectorAll('.gallery-event-images img');
    galleryImages = Array.from(allImages).map(img => ({
        src: img.src,
        caption: img.alt
    }));
    
    // 画像クリックイベントを追加
    allImages.forEach((img, index) => {
        img.addEventListener('click', function() {
            openGalleryModal(index);
        });
    });
});

// アコーディオンの開閉
function toggleGalleryEvent(titleElement) {
    const imagesContainer = titleElement.nextElementSibling;
    const isActive = titleElement.classList.contains('active');
    
    // すべてのアコーディオンを閉じる
    document.querySelectorAll('.gallery-event-title').forEach(title => {
        title.classList.remove('active');
    });
    document.querySelectorAll('.gallery-event-images').forEach(images => {
        images.classList.remove('show');
    });
    
    // クリックされたアコーディオンを開く（既に開いていた場合は閉じる）
    if (!isActive) {
        titleElement.classList.add('active');
        imagesContainer.classList.add('show');
    }
}

// ギャラリーモーダルを開く
let currentImageIndex = 0;
function openGalleryModal(index) {
    currentImageIndex = index;
    const modal = document.getElementById('gallery-modal');
    const img = document.getElementById('gallery-modal-img');
    const caption = document.getElementById('gallery-modal-caption');
    
    if (galleryImages[index]) {
        img.src = galleryImages[index].src;
        caption.textContent = galleryImages[index].caption;
        modal.classList.add('show');
        document.body.classList.add('no-scroll');
    }
}

// ギャラリーモーダルを閉じる
function closeGalleryModal(event) {
    if (!event || event.target.id === 'gallery-modal' || event.target.classList.contains('gallery-modal-close')) {
        const modal = document.getElementById('gallery-modal');
        modal.classList.remove('show');
        document.body.classList.remove('no-scroll');
    }
}

// ギャラリー画像を切り替え
function changeGalleryImage(direction) {
    currentImageIndex += direction;
    
    // ループ処理
    if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    } else if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    }
    
    const img = document.getElementById('gallery-modal-img');
    const caption = document.getElementById('gallery-modal-caption');
    
    if (galleryImages[currentImageIndex]) {
        img.src = galleryImages[currentImageIndex].src;
        caption.textContent = galleryImages[currentImageIndex].caption;
    }
}

// キーボード操作（矢印キー、ESC）
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('gallery-modal');
    if (modal && modal.classList.contains('show')) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
            changeGalleryImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeGalleryImage(1);
        } else if (e.key === 'Escape') {
            closeGalleryModal();
        }
    }
})

// ページ読み込み時とチケットバッジクリック時の処理
document.addEventListener('DOMContentLoaded', function() {
    const contactTypeSelect = document.getElementById('contact-type');
    
    // セッションストレージを使用（タブを閉じるまで有効）
    const TICKET_FLAG_KEY = 'autoSelectTicket';
    
    // ページ読み込み時に自動選択をチェック
    function checkAndAutoSelectTicket() {
        const shouldAutoSelect = sessionStorage.getItem(TICKET_FLAG_KEY);
        
        if (shouldAutoSelect === 'true' && contactTypeSelect) {
            contactTypeSelect.value = 'ticket';
        }
        
        // 使用後はすぐにクリア
        sessionStorage.removeItem(TICKET_FLAG_KEY);
    }
    
    // ページ読み込み時に実行
    checkAndAutoSelectTicket();
    
    // チケットバッジクリック時の処理
    const ticketBadgeLinks = document.querySelectorAll('.ticket-badge-link');
    ticketBadgeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const contactType = this.getAttribute('data-contact-type');
            if (contactType === 'ticket') {
                // セッションストレージにフラグを設定
                sessionStorage.setItem(TICKET_FLAG_KEY, 'true');
                
                // CONTACTセクションに遷移
                window.location.hash = 'contact';
                
                // 少し遅延させて自動選択
                setTimeout(() => {
                    if (contactTypeSelect) {
                        contactTypeSelect.value = 'ticket';
                    }
                    // CONTACTセクションにスムーズスクロール
                    const contactSection = document.getElementById('contact');
                    if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    // 自動選択後、フラグをクリア
                    sessionStorage.removeItem(TICKET_FLAG_KEY);
                }, 100);
            }
        });
    });
    
    // メインメニューのCONTACTリンククリック時の処理
    const contactNavLinks = document.querySelectorAll('a[href="#contact"]');
    contactNavLinks.forEach(link => {
        // チケットバッジ以外のCONTACTリンク
        if (!link.classList.contains('ticket-badge-link')) {
            link.addEventListener('click', function() {
                // フラグをクリア（自動選択させない）
                sessionStorage.removeItem(TICKET_FLAG_KEY);
                
                // 少し遅延させてリセット
                setTimeout(() => {
                    if (contactTypeSelect) {
                        contactTypeSelect.value = '';
                    }
                }, 100);
            });
        }
    });
    
    // ページ読み込み完了後、CONTACTセクション以外に遷移したらフラグをクリア
    window.addEventListener('hashchange', function() {
        if (window.location.hash !== '#contact') {
            sessionStorage.removeItem(TICKET_FLAG_KEY);
        }
    });
});