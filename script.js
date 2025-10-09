document.addEventListener('DOMContentLoaded', () => {
    // AOS (Animate On Scroll) 初期化
    AOS.init({
        duration: 1200, // アニメーション時間
        once: true // 1回だけ実行
    });

    // ライブ詳細モーダルの初期状態を設定
    const modal = document.getElementById('live-detail-modal');
    modal.classList.add('modal-hidden'); 
});


// ハンバーガーメニューの開閉関数
function toggleNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.toggle('nav-visible');
    
    // ナビゲーションが開いた時に、背景のスクロールを止める
    document.body.classList.toggle('no-scroll', nav.classList.contains('nav-visible'));
}

// ナビゲーション項目クリック時にメニューを閉じる関数
function closeNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.remove('nav-visible');
    document.body.classList.remove('no-scroll');
}


// ライブ詳細モーダルの表示/非表示を切り替える関数
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


// NEWSセクションのアコーディオン開閉
function toggleAccordion(detailId) {
    const detail = document.getElementById(detailId);
    const accordionItem = detail.closest('.news-accordion');
    accordionItem.classList.toggle('open');
}


// CONTACTフォームのダミー送信処理
function handleFormSubmit(event) {
    event.preventDefault(); // フォームのデフォルト送信をキャンセル
    
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
        // 成功メッセージ
        statusMessage.textContent = 'お問い合わせありがとうございます！3営業日以内に返信いたします。';
        statusMessage.style.color = '#e0b466'; 
        
        // フォームをリセット（お名前やアドレスなどの入力を消す）
        form.reset();

        // ボタンを元に戻す
        submitButton.disabled = false;
        submitButton.textContent = '送信';
    }, 3000); 
}


// ==========================================================
// NEW: GALLERY ジャスティファイ・レイアウト計算処理
// ==========================================================

const MAX_ROW_HEIGHT = 250; // PCでの基準の行の高さ (CSSのheightと一致させる)
const MOBILE_MAX_ROW_HEIGHT = 150; // モバイルでの基準の行の高さ

function getContainerWidth() {
    const container = document.querySelector('.justified-container');
    if (!container) return 0;
    // paddingやmarginを考慮した実際のコンテンツ幅を取得
    return container.getBoundingClientRect().width;
}

function getAspectRatio(imgElement) {
    // 縦横比 (幅 / 高さ) を計算
    // naturalWidth/Heightが取得できない場合は、フォールバックとして現在のwidth/heightを使用
    return (imgElement.naturalWidth && imgElement.naturalHeight) ? 
           (imgElement.naturalWidth / imgElement.naturalHeight) : 
           (imgElement.width / imgElement.height); 
}

function justifyImages() {
    const container = document.querySelector('.justified-container');
    if (!container) return;

    // 現在の画面幅に基づいて、基準となる行の高さを設定
    const isMobile = window.innerWidth <= 768;
    const targetRowHeight = isMobile ? MOBILE_MAX_ROW_HEIGHT : MAX_ROW_HEIGHT;
    
    // 画像アイテムを全て取得
    const items = Array.from(container.querySelectorAll('.gallery-item'));
    if (items.length === 0) return;

    let row = []; // 現在処理中の行の画像アイテム
    let currentRowWidth = 0; // 現在の行の合計幅（ターゲット高さに正規化後）
    const containerWidth = getContainerWidth();
    const gap = isMobile ? 3 : 5; // CSSのgapと合わせる

    // 全ての画像を処理
    items.forEach((item, index) => {
        const img = item.querySelector('img');
        if (!img || !img.complete) return; 

        // 1. 各画像の縦横比を取得
        const aspectRatio = getAspectRatio(img);

        // 2. 基準の行の高さに調整した際の画像の幅を計算 (幅 = 縦横比 * 高さ)
        const targetWidth = aspectRatio * targetRowHeight;
        
        // 3. 行に画像を追加できるかチェック
        // (合計幅 + 次の画像の幅 + 現在の行のスキマ数 * gap) がコンテナ幅を超えるか
        if (currentRowWidth + targetWidth + (row.length * gap) > containerWidth && row.length > 0) {
            // 4. 行が満たされたら、その行をジャスティファイ（幅調整）する
            renderRow(row, containerWidth, gap);

            // 5. 新しい行を開始
            row = [item];
            currentRowWidth = targetWidth;
        } else {
            // 6. 行に画像を追加
            row.push(item);
            currentRowWidth += targetWidth;
        }

        // 最後の画像の場合、残りの画像で最後の行をレンダリング
        if (index === items.length - 1) {
            renderRow(row, containerWidth, gap, true); 
        }
    });
}


// 行内の画像の幅と高さを再計算し、適用する関数
function renderRow(row, containerWidth, gap, isLastRow = false) {
    if (row.length === 0) return;

    // 行内のスキマの合計
    const totalGap = (row.length - 1) * gap;

    // 現在の行に含まれるすべての画像の幅（ターゲット高さに正規化後）の合計
    const totalTargetWidth = row.reduce((sum, item) => {
        const img = item.querySelector('img');
        const aspectRatio = getAspectRatio(img);
        // PCのMAX_ROW_HEIGHTを使用 (高さを基準にするため)
        return sum + aspectRatio * MAX_ROW_HEIGHT; 
    }, 0);

    // 最終行でない場合、行の高さを調整して幅いっぱいに広げる
    if (!isLastRow) {
        // 新しい行の高さを計算 (幅いっぱいに調整するためのスケールファクター)
        const scaleFactor = (containerWidth - totalGap) / totalTargetWidth;
        const newRowHeight = MAX_ROW_HEIGHT * scaleFactor;

        row.forEach(item => {
            const img = item.querySelector('img');
            const aspectRatio = getAspectRatio(img);

            // 新しい高さと縦横比に基づいて、新しい幅を計算
            const newWidth = aspectRatio * newRowHeight;

            // スタイルを適用
            item.style.height = `${newRowHeight}px`;
            item.style.width = `${newWidth}px`;
            item.style.flexGrow = '0'; // 幅が固定されるので拡大を無効化
        });
    } else {
        // 最終行は、左寄せで元の高さを維持する
        row.forEach(item => {
            const img = item.querySelector('img');
            const aspectRatio = getAspectRatio(img);
            const targetHeight = window.innerWidth <= 768 ? MOBILE_MAX_ROW_HEIGHT : MAX_ROW_HEIGHT;

            // スタイルを適用
            item.style.height = `${targetHeight}px`;
            item.style.width = `${aspectRatio * targetHeight}px`;
            item.style.flexGrow = '0'; // 拡大を無効化
        });
    }
}


// 画像の読み込み完了後にレイアウト計算を実行
window.addEventListener('load', () => {
    // すべての画像が読み込まれてから計算を実行するため、ロードが完了した画像だけを処理
    const container = document.querySelector('.justified-container');
    if (container) {
        const images = container.querySelectorAll('img');
        let loadedCount = 0;
        
        images.forEach(img => {
            if (img.complete) {
                loadedCount++;
            } else {
                img.addEventListener('load', () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                        justifyImages();
                    }
                });
            }
        });

        if (loadedCount === images.length) {
            justifyImages();
        }
    }
});


// ウィンドウサイズ変更時にもレイアウト計算を再実行
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(justifyImages, 100);
});