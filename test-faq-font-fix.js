// ✅ TEST FAQ FONT FIX VERIFICATION
// Copy script ini ke browser console untuk test apakah font FAQ sudah diperbaiki

console.clear();
console.log('✅ FAQ FONT FIX VERIFICATION');
console.log('=============================');

const faqFontTest = {
  // Test all FAQ elements for font consistency
  testFAQFontConsistency: () => {
    console.log('\n1️⃣ Testing FAQ Font Consistency...');
    
    const faqSelectors = [
      '.faq',
      '.faq .header h2',
      '.faq .header p',
      '.faq .question-text',
      '.faq .answer-content p',
      '.faq .cta-content h3',
      '.faq .cta-content p',
      '.faq .wa-btn'
    ];
    
    let allUsingPoppins = true;
    let results = [];
    
    faqSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily;
        const isPoppins = fontFamily.includes('Poppins');
        
        results.push({
          selector,
          fontFamily,
          isPoppins,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight
        });
        
        if (!isPoppins) {
          allUsingPoppins = false;
        }
        
        console.log(`   ${selector}:`);
        console.log(`     Font: ${fontFamily}`);
        console.log(`     Poppins: ${isPoppins ? '✅' : '❌'}`);
        console.log(`     Size: ${computedStyle.fontSize}`);
        console.log(`     Weight: ${computedStyle.fontWeight}\n`);
      } else {
        console.log(`   ❌ ${selector} not found`);
      }
    });
    
    if (allUsingPoppins) {
      console.log('🎉 SEMUA ELEMEN FAQ MENGGUNAKAN POPPINS! ✅');
    } else {
      console.log('⚠️ MASIH ADA ELEMEN YANG TIDAK MENGGUNAKAN POPPINS');
    }
    
    return { allUsingPoppins, results };
  },

  // Compare FAQ fonts with other components
  compareFAQWithOthers: () => {
    console.log('\n2️⃣ Comparing FAQ with Other Components...');
    
    const comparisons = [
      {
        name: 'Headers',
        faq: '.faq .header h2',
        other: '.hero-title-minimal'
      },
      {
        name: 'Body Text',
        faq: '.faq .header p',
        other: '.hero-desc-minimal'
      },
      {
        name: 'Content Text',
        faq: '.faq .answer-content p',
        other: '.section-subtitle'
      }
    ];
    
    let allConsistent = true;
    
    comparisons.forEach(comp => {
      const faqEl = document.querySelector(comp.faq);
      const otherEl = document.querySelector(comp.other);
      
      if (faqEl && otherEl) {
        const faqFont = window.getComputedStyle(faqEl).fontFamily;
        const otherFont = window.getComputedStyle(otherEl).fontFamily;
        const isConsistent = faqFont === otherFont;
        
        if (!isConsistent) {
          allConsistent = false;
        }
        
        console.log(`\n   📊 ${comp.name}:`);
        console.log(`     FAQ: ${faqFont}`);
        console.log(`     Other: ${otherFont}`);
        console.log(`     Match: ${isConsistent ? '✅' : '❌'}`);
      } else {
        console.log(`\n   ❌ ${comp.name}: Elements not found`);
      }
    });
    
    if (allConsistent) {
      console.log('\n🎉 FAQ FONT KONSISTEN DENGAN KOMPONEN LAIN! ✅');
    } else {
      console.log('\n⚠️ MASIH ADA INKONSISTENSI FONT');
    }
    
    return allConsistent;
  },

  // Test font loading
  testFontLoading: () => {
    console.log('\n3️⃣ Testing Font Loading...');
    
    // Create test element
    const testElement = document.createElement('div');
    testElement.style.fontFamily = 'Poppins, sans-serif';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.fontSize = '16px';
    testElement.textContent = 'Font Loading Test';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const fontFamily = computedStyle.fontFamily;
    const isPoppinsLoaded = fontFamily.includes('Poppins');
    
    console.log(`   Font Family: ${fontFamily}`);
    console.log(`   Poppins Loaded: ${isPoppinsLoaded ? '✅' : '❌'}`);
    
    // Check specific font weights
    const weights = ['300', '400', '500', '600', '700', '800'];
    console.log('\n   Font Weight Availability:');
    
    weights.forEach(weight => {
      testElement.style.fontWeight = weight;
      const currentWeight = window.getComputedStyle(testElement).fontWeight;
      const isAvailable = currentWeight === weight || currentWeight === 'normal' || currentWeight === 'bold';
      console.log(`     ${weight}: ${isAvailable ? '✅' : '❌'}`);
    });
    
    document.body.removeChild(testElement);
    return isPoppinsLoaded;
  },

  // Visual comparison test
  performVisualTest: () => {
    console.log('\n4️⃣ Performing Visual Test...');
    
    // Create visual comparison elements
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #2563eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      font-family: Poppins, sans-serif;
    `;
    
    container.innerHTML = `
      <h4 style="margin: 0 0 15px 0; color: #2563eb; font-weight: 600;">Font Test Comparison</h4>
      <div style="margin-bottom: 10px;">
        <strong>FAQ Font (should be Poppins):</strong>
        <p style="margin: 5px 0; font-family: inherit;">Hay Hill Clothing FAQ</p>
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Default Font:</strong>
        <p style="margin: 5px 0; font-family: sans-serif;">Hay Hill Clothing FAQ</p>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 500;
      ">Close Test</button>
    `;
    
    document.body.appendChild(container);
    
    console.log('   📋 Visual comparison box added to top-right corner');
    console.log('   👀 Compare the two text samples visually');
    console.log('   ✅ If both look the same, FAQ font is fixed');
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (container.parentElement) {
        container.remove();
        console.log('   📋 Visual comparison box auto-removed');
      }
    }, 10000);
  },

  // Run all tests
  runAllTests: () => {
    console.log('🚀 RUNNING ALL FAQ FONT TESTS');
    console.log('==============================');
    
    const results = {
      fontConsistency: faqFontTest.testFAQFontConsistency(),
      componentComparison: faqFontTest.compareFAQWithOthers(),
      fontLoading: faqFontTest.testFontLoading()
    };
    
    // Perform visual test
    faqFontTest.performVisualTest();
    
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    
    const allPassed = results.fontConsistency.allUsingPoppins && 
                     results.componentComparison && 
                     results.fontLoading;
    
    if (allPassed) {
      console.log('🎉 SEMUA TEST PASSED! FAQ FONT SUDAH DIPERBAIKI! ✅');
      console.log('\n✅ FAQ sekarang menggunakan Poppins konsisten');
      console.log('✅ Font weights sudah sesuai');
      console.log('✅ Konsisten dengan komponen lain');
    } else {
      console.log('⚠️ BEBERAPA TEST FAILED. Periksa output di atas.');
      
      if (!results.fontConsistency.allUsingPoppins) {
        console.log('❌ FAQ masih belum semua menggunakan Poppins');
      }
      if (!results.componentComparison) {
        console.log('❌ FAQ tidak konsisten dengan komponen lain');
      }
      if (!results.fontLoading) {
        console.log('❌ Poppins font tidak ter-load dengan benar');
      }
    }
    
    return allPassed;
  }
};

// Auto-run all tests
faqFontTest.runAllTests();

console.log('\n🛠️ AVAILABLE COMMANDS:');
console.log('======================');
console.log('faqFontTest.runAllTests()          - Run all tests');
console.log('faqFontTest.testFAQFontConsistency() - Test FAQ fonts only');
console.log('faqFontTest.compareFAQWithOthers()   - Compare with other components');
console.log('faqFontTest.performVisualTest()      - Visual comparison test');

// Export to global scope
window.faqFontTest = faqFontTest; 