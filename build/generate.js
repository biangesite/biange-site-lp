require('dotenv').config();
// Node.js 18.17.1 で動作する静的生成スクリプト
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const fetch = require('node-fetch');

// microCMS API設定
const MICROCMS_SERVICE_ID = 'biangesite';
const MICROCMS_API_KEY = process.env.MICROCMS_API_KEY || '';

if (!MICROCMS_API_KEY) {
  console.error('❌ Error: MICROCMS_API_KEY is not set');
  console.error('Set environment variable: MICROCMS_API_KEY');
  process.exit(1);
}

// API呼び出しヘルパー
async function fetchFromMicroCMS(endpoint) {
  const url = `https://${MICROCMS_SERVICE_ID}.microcms.io/api/v1/${endpoint}`;
  console.log(`  Fetching: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log(`  ✓ Success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}

// 日付フォーマットヘルパー（YYYY.MM.DD形式）
Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  
  // 日本時間（JST = UTC+9）として日付を取得
  const date = new Date(dateString);
  
  // 日本時間での年月日を取得（getTimezoneOffsetを使用）
  const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  
  return `${year}.${month}.${day}`;
});

// 改行をHTMLの<br>に変換
Handlebars.registerHelper('nl2br', function(text) {
  if (!text) return '';
  return new Handlebars.SafeString(text.replace(/\n/g, '<br>'));
});

// 配列かどうかを判定
Handlebars.registerHelper('isArray', function(value) {
  return Array.isArray(value);
});

// 配列の最初の要素を取得
Handlebars.registerHelper('firstItem', function(array) {
  if (Array.isArray(array) && array.length > 0) {
    return array[0];
  }
  return '';
});

// NEWSカテゴリに応じたクラス名を返す
Handlebars.registerHelper('newsCategoryClass', function(category) {
  // カテゴリが配列の場合は最初の要素を使用
  const categoryValue = Array.isArray(category) ? category[0] : category;
  
  const classes = {
    'ライブ': 'news-category--live',
    'ゲスト出演': 'news-category--guest',
    'レッスン': 'news-category--lesson',
    'リリース': 'news-category--release',
    '二胡教室': 'news-category--erhu-class',
    'イベント': 'news-category--event',
    'お知らせ': 'news-category--announcement',
    'その他': 'news-category--other'
  };
  return classes[categoryValue] || 'news-category--other';
});

// 文字列に特定の文字が含まれているかチェック
Handlebars.registerHelper('includes', function(str, search) {
  if (Array.isArray(str)) {
    str = str[0];
  }
  return str && str.includes(search);
});
// スタイルプリセットを適用
Handlebars.registerHelper('applyStyle', function(styleName, type) {
  // 配列の場合は最初の要素を取得
  if (Array.isArray(styleName)) {
    styleName = styleName[0];
  }
  
  // 文字列に「hidden」が含まれていれば非表示
  if (styleName && (styleName === 'hidden' || styleName.includes('hidden') || styleName.includes('非表示'))) {
    return 'display: none;';
  }
  
  // 「visible」または「表示」が含まれていればStandard
  if (!styleName || styleName === 'visible' || styleName.includes('visible') || styleName.includes('表示')) {
    styleName = 'Standard';
  }
  
  const styles = {
    keyTitle: {
      Standard: 'font-size: 60px; color: rgba(255, 255, 255, 0.8);',
      Emphasis: 'font-size: 70px; color: #e0b466; font-weight: 700;'
    },
    artistName: {
      Standard: 'font-size: 36px; color: #e0b466;',
      Emphasis: 'font-size: 42px; color: #fff; font-weight: 700;'
    },
    newsDetail: {
      Standard: 'font-size: 14px; color: #cccccc;',
      Emphasis: 'font-size: 16px; color: #e0b466; font-weight: 500;'
    },
    liveEventsTitle: {
      Standard: 'font-size: 20px; color: #ffffff;',
      Emphasis: 'font-size: 22px; color: #e0b466; font-weight: 700;'
    },
    setList: {
      Standard: 'font-size: 14px; color: #cccccc;',
      Emphasis: 'font-size: 15px; color: #ffffff; font-weight: 500;'
    },
    sideOverlay: {
      Standard: '',  // 既存のCSSを使用
      Emphasis: ''
    }
  };
  
  const result = styles[type] && styles[type][styleName] ? styles[type][styleName] : '';
  return result || null;  // 空文字列の場合はnullを返す
});

// チケットステータスのバッジクラスを返す
Handlebars.registerHelper('ticketBadgeClass', function(status) {
  const badges = {
    '完売': 'ticket-badge--完売',
    '前売り': 'ticket-badge--前売り',
    'お早めに': 'ticket-badge--お早めに'
  };
  return badges[status] || 'ticket-badge--前売り';
});

// 等価比較ヘルパー
Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

// 配列の最初の要素を取得
Handlebars.registerHelper('first', function(array) {
    return Array.isArray(array) ? array[0] : array;
});

// 配列に特定の値が含まれるかチェック
Handlebars.registerHelper('includes', function(array, value) {
    if (Array.isArray(array)) {
        return array.includes(value);
    }
    return array === value;
});

// メイン処理
async function generateHTML() {
  try {
    console.log('🔄 Fetching data from microCMS...');
    console.log('');
    
    // コンテンツデータの取得
    const [siteContent, newsResponse, liveResponse, lessonData] = await Promise.all([
      fetchFromMicroCMS('bgsitecontent'),
      fetchFromMicroCMS('news?orders=-newsDate&limit=10'),
      fetchFromMicroCMS('live?orders=-liveEventsDate&limit=10'),
      fetchFromMicroCMS('lessonetc')
    ]);
    // ↓↓↓  JSONのデータの詳細をデバッグ出力 ↓↓↓
    console.log('🔍 bgsitecontent data:', JSON.stringify(siteContent, null, 2));

        // ↓↓↓  liveResponseのデータの詳細をデバッグ出力 ↓↓↓
    console.log('');
    console.log('🔍 DEBUG: liveResponse:');
    console.log(JSON.stringify(liveResponse, null, 2));
    console.log('');

    console.log('');
    console.log('✅ Data fetched successfully');
    console.log('🔍 DEBUG: siteContent:');
    console.log(JSON.stringify(siteContent, null, 2));
    console.log('📚 LESSON Data:');
    console.log(JSON.stringify(lessonData, null, 2));
    console.log('');
    
    // NEWS
    console.log('📋 NEWS Response Structure:');
    console.log(JSON.stringify(newsResponse, null, 2));
    console.log('');
    
    // データの結合（newsResponseがcontents配列を持つか確認）
    const newsItems = newsResponse.contents || newsResponse || [];

    console.log(`📰 NEWS Items Count: ${newsItems.length}`);
    if (newsItems.length > 0) {
      console.log('📰 First NEWS Item:');
      console.log(JSON.stringify(newsItems[0], null, 2));
    } else {
      console.warn('⚠️  WARNING: No NEWS items found!');
    }
    console.log('');

    // LIVEデータ処理
    const liveItems = liveResponse.contents || liveResponse || [];
    console.log(`🎵 LIVE Items Count: ${liveItems.length}`);
    console.log('🎵 All LIVE Items:');
    liveItems.forEach((item, index) => {
      console.log(`  [${index}] showAsLatest: ${item.showAsLatest}, title: ${item.liveEventsTitle}`);
    });

    const latestLive = liveItems.find(item => item.showAsLatest) || liveItems[0] || null;
    if (latestLive) {
      console.log('🎵 Latest LIVE:');
      console.log(JSON.stringify(latestLive, null, 2));
    }
    console.log('');

    console.log('📚 Lesson Data:');
    console.log(JSON.stringify(lessonData, null, 2));
    console.log('');

    const data = {
      ...siteContent,
      news: newsItems,
      liveEvents: liveItems,
      latestLive: latestLive,
      lesson: lessonData,
      termsAndSupport: lessonData?.termsAndAid || []
    };
    
    // データ構造確認（デバッグ用）
    console.log('📋 Final Data Structure:');
    console.log(`  - keyVisualImage: ${data.keyVisualImage ? '✓' : '✗'}`);
    console.log(`  - keyTitle: ${data.keyTitle ? '✓' : '✗'}`);
    console.log(`  - artistName: ${data.artistName ? '✓' : '✗'}`);
    console.log(`  - news: ${data.news ? data.news.length + ' items' : '✗'}`);
    console.log(`  - liveEvents: ${data.liveEvents ? data.liveEvents.length + ' items' : '✗'}`);
    console.log(`  - latestLive: ${data.latestLive ? '✓' : '✗'}`);
    console.log(`  - liveOverlay: ${data.liveOverlay ? '✓' : '✗'}`);
    console.log(`  - lesson: ${data.lesson ? '✓' : '✗'}`);
    console.log(`  - termsAndSupport: ${data.termsAndSupport ? data.termsAndSupport.length + ' items' : '✗'}`);
    console.log('🔍 lesson data in templateData:', JSON.stringify(data.lesson, null, 2));
    console.log('');

    // テンプレートロード
    const templatePath = path.join(__dirname, 'templates', 'index.hbs');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // データに生成日時を追加
    data.generatedAt = new Date().toISOString();

    // HTML生成
    console.log('🔨 Generating HTML...');
    const html = template(data);

    // ファイル出力
    const outputPath = path.join(__dirname, '..', 'index.html');
    fs.writeFileSync(outputPath, html, 'utf8');

    console.log(`✅ HTML generated: ${outputPath}`);
    console.log(`📄 File size: ${(html.length / 1024).toFixed(2)} KB`);
    console.log('🚀 Ready for deployment');

    // CNAME ファイルを生成（カスタムドメイン用）
    const cnameContent = 'www.biange.jp\n';
    const cnamePath = path.join(__dirname, '..', 'CNAME');
    fs.writeFileSync(cnamePath, cnameContent, 'utf8');
    console.log('✅ CNAME file generated:', cnamePath);

    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Generation failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.error('');
    process.exit(1);
  }
}

generateHTML();
