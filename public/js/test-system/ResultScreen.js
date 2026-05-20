window.ResultScreen = {
  render: (containerId, resultData, onSolutionClick, onRetestClick) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const m = Math.floor(resultData.timeSpent / 60);
    const s = resultData.timeSpent % 60;
    const timeStr = `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    
    container.innerHTML = `
      <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 40px; text-align: center; max-width: 600px; margin: 0 auto; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
        <h2 style="font-family: 'Teko', sans-serif; font-size: 2.5rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">${resultData.testName}</h2>
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Local Analysis Engine</div>
        
        <div style="position: relative; width: 180px; height: 180px; margin: 0 auto 32px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,255,136,0.05); border: 4px solid #00ff88; box-shadow: 0 0 30px rgba(0,255,136,0.2);">
          <div style="font-size: 3.5rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #00ff88; line-height: 1;">${resultData.score}</div>
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Out of ${resultData.totalMaxMarks}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
          <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Accuracy</div>
            <div style="font-size: 1.8rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--text-primary);">${resultData.accuracy}%</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Percentage</div>
            <div style="font-size: 1.8rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--text-primary);">${resultData.percentage}%</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 40px;">
          <div style="background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.2); border-radius: 16px; padding: 16px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #00ff88; margin-bottom: 4px;">${resultData.correctCount}</div>
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Correct</div>
          </div>
          <div style="background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.2); border-radius: 16px; padding: 16px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #ff4d4d; margin-bottom: 4px;">${resultData.wrongCount}</div>
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Wrong</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 16px; padding: 16px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${resultData.unattemptedCount}</div>
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Skipped</div>
          </div>
        </div>

        <div style="margin-bottom: 32px; font-size: 0.9rem; color: var(--text-secondary);">
           Time Spent: <span style="color: var(--text-primary); font-weight: 600;">${timeStr}</span>
        </div>
        
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <button id="btnViewSolution" class="btn btn-ghost" style="flex: 1; min-width: 140px; padding: 16px; font-size: 1.1rem;">Solution Review</button>
          <button id="btnRetest" class="btn btn-accent" style="flex: 1; min-width: 140px; padding: 16px; font-size: 1.1rem;">Retest Test</button>
        </div>
        <div style="margin-top: 24px;">
          <button id="btnBackToCourse" class="btn btn-ghost" style="width: 100%; padding: 12px; font-size: 1rem; border-color: transparent; opacity: 0.7;">← Back to Course</button>
        </div>
      </div>
    `;
    
    document.getElementById('btnViewSolution').onclick = onSolutionClick;
    document.getElementById('btnRetest').onclick = onRetestClick;
    document.getElementById('btnBackToCourse').onclick = () => {
      window.location.href = `course_dynamic.html?course_id=${localStorage.getItem('lastCourseId') || '44743'}`;
    };
  }
};