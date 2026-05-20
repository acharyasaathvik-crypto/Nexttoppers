window.useTestAttempt = {
  submitTest: async (testId, attemptData) => {
    // 1. Save raw attempt locally first
    window.TestStorage.saveAttempt(testId, attemptData);
    
    try {
      const headers = {
        'app_id': '1770981347',
        'platform': '3',
        'user_id': '2850138',
        'version': '1',
        'Authorization': `Bearer ${window.API.token}`
      };

      // 2. Fetch Solution (only for correct answers and explanations)
      const url = `/course?endpoint=solution&target=nexttoppers-test&test_id=${testId}`;
      const response = await fetch(url, { method: 'GET', headers: headers });

      if (response.ok) {
        const solution = await response.json();
        window.TestStorage.saveSolution(testId, solution);
        
        // 3. GENERATE LOCAL RESULT (STRICTLY)
        const localResult = window.ResultEngine.calculateResult(attemptData, solution);
        window.TestStorage.saveLocalResult(testId, localResult);
        
        return true;
      }
    } catch(e) {
      console.error('Local Result Engine: API fetch failed', e);
    }
    
    // Placeholder if offline
    window.TestStorage.saveSolution(testId, { data: { sections: [] } });
    return false;
  },
  
  getTestStatus: (testId) => {
    if (window.TestStorage.isTestCompleted(testId)) {
       return { 
         status: 'COMPLETED', 
         attempt: window.TestStorage.getAttempt(testId), 
         solution: window.TestStorage.getSolution(testId),
         result: window.TestStorage.getLocalResult(testId)
       };
    }
    return { status: 'NOT_ATTEMPTED' };
  },
  
  resetTest: (testId) => {
    window.TestStorage.clearAttempt(testId);
  }
};