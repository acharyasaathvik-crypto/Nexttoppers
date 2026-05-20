window.SolutionScreen = {
  render: (containerId, resultData, onBackClick) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `
      <div style="max-width: 800px; margin: 0 auto; padding-bottom: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 0 16px;">
          <h2 style="font-family: 'Teko', sans-serif; font-size: 2rem; color: var(--accent); text-transform: uppercase; margin:0;">Detailed Solutions</h2>
          <button id="btnBackToResult" class="btn btn-ghost">← Back to Result</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 24px; padding: 0 16px;">
    `;
    
    resultData.questionResults.forEach((res, i) => {
      const q = res.question;
      const lang = Object.keys(q.languages)[0] || 'english';
      const content = q.languages[lang];
      
      let badgeHtml = '';
      if (!res.isAttempted) {
        badgeHtml = `<span style="background: rgba(255,255,255,0.1); color: var(--text-secondary); padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Skipped</span>`;
      } else if (res.isCorrect) {
        badgeHtml = `<span style="background: rgba(0,255,136,0.15); color: #00ff88; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Correct</span>`;
      } else {
        badgeHtml = `<span style="background: rgba(255,77,77,0.15); color: #ff4d4d; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Wrong</span>`;
      }
      
      let optionsHtml = '';
      ['option_a', 'option_b', 'option_c', 'option_d'].forEach((key, idx) => {
        if (content[key]) {
          const char = String.fromCharCode(65 + idx);
          const isSelected = res.userAnswer === key;
          const isCorrect = res.correctAns === key;
          
          let optStyle = `background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border);`;
          let icon = '';
          
          if (isCorrect) {
            optStyle = `background: rgba(0,255,136,0.1); border: 1px solid #00ff88;`;
            icon = `<span style="color:#00ff88; font-weight:bold; margin-left:auto; font-size: 0.8rem;">✓ CORRECT</span>`;
          } else if (isSelected && !isCorrect) {
            optStyle = `background: rgba(255,77,77,0.1); border: 1px solid #ff4d4d;`;
            icon = `<span style="color:#ff4d4d; font-weight:bold; margin-left:auto; font-size: 0.8rem;">✗ YOURS</span>`;
          }
          
          optionsHtml += `
            <div style="border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 8px; ${optStyle}">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-secondary); border: 1px solid var(--border); flex-shrink: 0;">${char}</div>
              <div style="flex: 1; font-size: 0.95rem; color: var(--text-primary); line-height: 1.4;">${content[key]}</div>
              ${icon}
            </div>
          `;
        }
      });
      
      html += `
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center;">
            <span style="font-family: 'Teko', sans-serif; font-size: 1.2rem; color: var(--accent); text-transform: uppercase; letter-spacing: 1px;">Question ${String(i+1).padStart(2, '0')}</span>
            ${badgeHtml}
          </div>
          <div style="font-size: 1.1rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 24px; font-weight: 500;">
            ${content.question_text}
          </div>
          <div>${optionsHtml}</div>
          
          ${content.explanation ? `
            <div style="margin-top: 24px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border-left: 4px solid var(--accent);">
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Explanation</div>
              <div style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); opacity: 0.9;">${content.explanation}</div>
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
    
    document.getElementById('btnBackToResult').onclick = onBackClick;
    window.scrollTo(0, 0);
  }
};