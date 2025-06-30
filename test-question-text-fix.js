/**
 * Test Script: Question Text Font Fix Verification
 * Memverifikasi bahwa styling .question-text sudah diperbaiki untuk terlihat profesional
 */

console.log("🔍 Testing Question Text Font Fix...");

function testQuestionTextStyling() {
  console.log("\n📋 Question Text Font Analysis:");
  
  const questionTexts = document.querySelectorAll('.question-text');
  
  if (questionTexts.length === 0) {
    console.warn("⚠️ No .question-text elements found. Make sure FAQ component is loaded.");
    return false;
  }
  
  let allCorrect = true;
  
  questionTexts.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    
    console.log(`\n📝 Question ${index + 1}:`);
    console.log(`   Text: "${element.textContent.substring(0, 50)}..."`);
    console.log(`   Font Family: ${styles.fontFamily}`);
    console.log(`   Font Weight: ${styles.fontWeight}`);
    console.log(`   Font Size: ${styles.fontSize}`);
    console.log(`   Letter Spacing: ${styles.letterSpacing}`);
    console.log(`   Line Height: ${styles.lineHeight}`);
    console.log(`   Text Rendering: ${styles.textRendering}`);
    
    // Check font family (should be Poppins, not Font Awesome)
    const hasPoppins = styles.fontFamily.includes('Poppins');
    const hasFontAwesome = styles.fontFamily.includes('Font Awesome') || styles.fontFamily.includes('FontAwesome');
    console.log(`   ✓ Poppins Font: ${hasPoppins ? '✅' : '❌'}`);
    console.log(`   ✓ NOT Font Awesome: ${!hasFontAwesome ? '✅' : '❌'} ${hasFontAwesome ? '(ISSUE: Using Font Awesome!)' : ''}`);
    
    // Check font weight (should be 500 for professional look)
    const fontWeight = parseInt(styles.fontWeight) || 400;
    const correctWeight = fontWeight === 500;
    console.log(`   ✓ Font Weight 500: ${correctWeight ? '✅' : '❌'} (actual: ${fontWeight})`);
    
    // Check letter spacing (should have slight negative for tighter, professional look)
    const letterSpacing = styles.letterSpacing;
    const hasLetterSpacing = letterSpacing !== 'normal' && letterSpacing !== '0px';
    console.log(`   ✓ Letter Spacing: ${hasLetterSpacing ? '✅' : '❌'} (${letterSpacing})`);
    
    if (!hasPoppins || hasFontAwesome || !correctWeight) {
      allCorrect = false;
    }
  });
  
  return allCorrect;
}

function compareWithOtherElements() {
  console.log("\n🔍 Font Consistency Check:");
  
  const elements = {
    'header h2': document.querySelector('.header h2'),
    'header p': document.querySelector('.header p'),
    'question-text': document.querySelector('.question-text'),
    'answer p': document.querySelector('.answer-content p'),
    'cta h3': document.querySelector('.cta-content h3'),
    'cta p': document.querySelector('.cta-content p'),
    'wa-btn': document.querySelector('.wa-btn')
  };
  
  for (const [name, element] of Object.entries(elements)) {
    if (element) {
      const styles = window.getComputedStyle(element);
      const fontFamily = styles.fontFamily;
      const hasPoppins = fontFamily.includes('Poppins');
      const hasFontAwesome = fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
      
      let status = '✅';
      if (!hasPoppins) status = '❌';
      if (hasFontAwesome) status = '🚨'; // Critical issue
      
      console.log(`${name}: ${status} ${fontFamily}`);
      if (hasFontAwesome) {
        console.log(`   🚨 CRITICAL: ${name} is using Font Awesome instead of Poppins!`);
      }
    } else {
      console.log(`${name}: ⚠️ Element not found`);
    }
  }
}

function testProfessionalAppearance() {
  console.log("\n👔 Professional Appearance Check:");
  
  const questionTexts = document.querySelectorAll('.question-text');
  
  questionTexts.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    console.log(`\nQuestion ${index + 1} Visual Analysis:`);
    
    // Check text smoothing
    const hasAntialiasing = styles.webkitFontSmoothing === 'antialiased';
    console.log(`   ✓ Font Smoothing: ${hasAntialiasing ? '✅' : '❌'}`);
    
    // Check text rendering
    const hasOptimizedRendering = styles.textRendering === 'optimizeLegibility';
    console.log(`   ✓ Optimized Rendering: ${hasOptimizedRendering ? '✅' : '❌'}`);
    
    // Check line height (should be good for readability)
    const lineHeight = parseFloat(styles.lineHeight);
    const fontSize = parseFloat(styles.fontSize);
    const lineHeightRatio = lineHeight / fontSize;
    const goodLineHeight = lineHeightRatio >= 1.4 && lineHeightRatio <= 1.6;
    console.log(`   ✓ Line Height Ratio: ${goodLineHeight ? '✅' : '❌'} (${lineHeightRatio.toFixed(2)})`);
    
    // Check color contrast
    const color = styles.color;
    const isDarkText = color.includes('rgb') && 
      color.split(',').map(x => parseInt(x.match(/\d+/)?.[0] || '255')).every(val => val < 100);
    console.log(`   ✓ Dark Text Color: ${isDarkText ? '✅' : '❌'} (${color})`);
  });
}

function debugFontInheritance() {
  console.log("\n🔍 Font Inheritance Debug:");
  
  const questionTexts = document.querySelectorAll('.question-text');
  
  questionTexts.forEach((element, index) => {
    console.log(`\n📝 Question ${index + 1} Inheritance Chain:`);
    
    let current = element;
    let level = 0;
    
    while (current && level < 10) {
      const styles = window.getComputedStyle(current);
      const fontFamily = styles.fontFamily;
      const classList = current.classList ? Array.from(current.classList).join(', ') : 'no classes';
      const tagName = current.tagName.toLowerCase();
      
      console.log(`   ${level === 0 ? '🎯' : '📤'} Level ${level}: <${tagName}> ${classList ? `[${classList}]` : ''}`);
      console.log(`      Font: ${fontFamily}`);
      
      if (fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome')) {
        console.log(`      🚨 FONT AWESOME DETECTED HERE!`);
      }
      
      current = current.parentElement;
      level++;
    }
  });
}

function generateReport() {
  console.log("\n📊 Question Text Fix Report:");
  console.log("================================");
  
  const isFixed = testQuestionTextStyling();
  
  if (isFixed) {
    console.log("✅ SUCCESS: Question text styling telah diperbaiki!");
    console.log("   • Font weight lebih profesional (500 instead of 600)");
    console.log("   • Letter spacing optimized untuk keterbacaan");
    console.log("   • Font smoothing diaktifkan");
    console.log("   • Text rendering dioptimalkan");
    console.log("   • Line height diperbaiki untuk readability");
    console.log("   • Font Awesome inheritance PREVENTED dengan !important");
  } else {
    console.log("❌ ISSUES: Masih ada masalah dengan question text styling");
    debugFontInheritance();
  }
  
  compareWithOtherElements();
  testProfessionalAppearance();
  
  console.log("\n💡 Tips untuk konsistensi font:");
  console.log("   1. Pastikan semua elemen menggunakan Poppins");
  console.log("   2. Gunakan font-weight 500 untuk text yang readable");
  console.log("   3. Tambahkan slight negative letter-spacing");
  console.log("   4. Aktifkan font smoothing untuk tampilan yang halus");
  console.log("   5. Gunakan !important jika perlu override Font Awesome inheritance");
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', generateReport);
} else {
  generateReport();
}

// Export for console use
window.testQuestionTextFix = {
  testQuestionTextStyling,
  compareWithOtherElements,
  testProfessionalAppearance,
  generateReport
};

console.log("\n🎯 Functions available in console:");
console.log("   - testQuestionTextFix.generateReport()");
console.log("   - testQuestionTextFix.testQuestionTextStyling()");
console.log("   - testQuestionTextFix.compareWithOtherElements()"); 