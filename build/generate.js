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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}

// 日付フォーマットヘルパー（YYYY.MM.DD形式）
Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
});

// 改行をHTMLの<br>に変換
Handlebars.registerHelper('nl2br', function(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
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
    
    // bgsitecontent エンドポイントから取得
    const data = await fetchFromMicroCMS('bgsitecontent');
    
    console.log('');
    console.log('✅ Data fetched successfully');
    console.log('');
    
    // データ構造確認（デバッグ用）
    console.log('📋 Data structure:');
    console.log(`  - keyVisualImage: ${data.keyVisualImage ? '✓' : '✗'}`);
    console.log(`  - keyTitle: ${data.keyTitle ? '✓' : '✗'}`);
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
    console.log('🚀 Ready for deployment');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Generation failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

generateHTML();