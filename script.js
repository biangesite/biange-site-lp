/**
 * ライブ詳細モーダルの表示/非表示を切り替える関数
 */
function toggleLiveModal() {
    const modal = document.getElementById('live-detail-modal');
    
    // modal-hiddenクラスの有無で表示/非表示を判定
    const isHidden = modal.classList.contains('modal-hidden');

    if (isHidden) {
        // 表示にする
        modal.classList.remove('modal-hidden');
        // ❗UX改善: 背景のスクロール禁止を削除
    } else {
        // 非表示にする
        modal.classList.add('modal-hidden');
        // ❗UX改善: スクロール解除の処理も不要
    }
}

/**
 * ハンバーガーメニューの表示/非表示を切り替える関数
 */
function toggleNav() {
    // 画面幅が768pxを超えていたら（PC表示）、処理を中断
    if (window.innerWidth > 768) {
        return;
    }
    
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const isVisible = nav.classList.contains('nav-visible');

    if (isVisible) {
        // 非表示にする
        nav.classList.remove('nav-visible');
        toggle.innerHTML = '≡'; // アイコンをハンバーガーに戻す
        document.body.style.overflow = 'auto'; // スクロール解除（ハンバーガーメニューは全画面のため、これは残す）
    } else {
        // 表示にする
        nav.classList.add('nav-visible');
        toggle.innerHTML = '×'; // アイコンをクローズに変更
        document.body.style.overflow = 'hidden'; // 背景のスクロール禁止（ハンバーガーメニューは全画面のため、これは残す）
    }
}

/**
 * メニュー項目クリック時にメニューを閉じる関数
 */
function closeNav() {
    const nav = document.getElementById('main-nav');
    if (nav.classList.contains('nav-visible')) {
        toggleNav(); // toggleNavを呼び出してメニューを閉じ、アイコンを戻す
    }
}


// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
    // ❗リロード時にページがトップに戻るように設定
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0); // ページを最上部に強制移動

    // AOS (Animate On Scroll) の初期化
    AOS.init({
        duration: 1200, // アニメーションにかかる時間
        once: true // 一度だけアニメーションを実行
    });
    
    // ライブモーダルの初期状態を設定
    const modal = document.getElementById('live-detail-modal');
    if(modal) {
        // ページロード時に非表示クラスを付与
        modal.classList.add('modal-hidden');
    }
});