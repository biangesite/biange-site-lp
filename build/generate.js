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
    'メディア': 'news-category--media',
    'リリース': 'news-category--release',
    'その他': 'news-category--other'
  };
  return classes[categoryValue] || 'news-category--other';
});

// スタイルプリセットを適用
Handlebars.registerHelper('applyStyle', function(styleName, type) {
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
    }
  };
  
  return styles[type] && styles[type][styleName] ? styles[type][styleName] : '';
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

// メイン処理
async function generateHTML() {
  try {
    console.log('🔄 Fetching data from microCMS...');
    console.log('');
    
    // コンテンツデータの取得
    const [siteContent, newsResponse] = await Promise.all([
      fetchFromMicroCMS('bgsitecontent'),
      fetchFromMicroCMS('news?orders=-newsDate&limit=10')  // 最新10件を取得
    ]);
    
    console.log('');
    console.log('✅ Data fetched successfully');
    console.log('');
    
    // NEWSデータの詳細をデバッグ出力
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

    const data = {
      ...siteContent,
      news: newsItems
    };
    
    // データ構造確認（デバッグ用）
    console.log('📋 Final Data Structure:');
    console.log(`  - keyVisualImage: ${data.keyVisualImage ? '✓' : '✗'}`);
    console.log(`  - keyTitle: ${data.keyTitle ? '✓' : '✗'}`);
    console.log(`  - artistName: ${data.artistName ? '✓' : '✗'}`);
    console.log(`  - news: ${data.news ? data.news.length + ' items' : '✗'}`);
    console.log(`  - liveEvents: ${data.liveEvents ? data.liveEvents.length + ' items' : '✗'}`);
    console.log(`  - liveOverlay: ${data.liveOverlay ? '✓' : '✗'}`);
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
