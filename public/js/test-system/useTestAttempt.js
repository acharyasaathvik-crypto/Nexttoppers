window.useTestAttempt = {
  submitTest: async (testId, attemptData, testData) => {
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

      // 1.5. SUBMIT TO SERVER FIRST (Regardless of response, to unlock solution)
      if (testData && testData.sections) {
        const payloadAnswers = [];
        testData.sections.forEach(section => {
          if (section.questions) {
            section.questions.forEach(q => {
              const qId = q.question_group_id || q.id;
              const userAnswer = attemptData.answers[qId];
              const qTime = attemptData.questionTimes ? (attemptData.questionTimes[qId] || 0) : 0;
              
              payloadAnswers.push({
                question_id: String(qId),
                selected_answers: userAnswer ? [userAnswer] : [],
                time_spent: String(qTime),
                status: (userAnswer || qTime > 0) ? "1" : "0"
              });
            });
          }
        });

        const submissionPayload = {
          test_id: String(testId),
          answers: payloadAnswers
        };

        try {
          console.log('[useTestAttempt] Sending submission to server...', submissionPayload);
          // Using window.API.post directly which handles the proxy details
          await window.API.post('submit', submissionPayload, 'nexttoppers-test');
        } catch (subErr) {
          console.warn('[useTestAttempt] Server submission warning (ignoring):', subErr.message);
        }
      }

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
      } else {
          console.error('Local Result Engine: Solution fetch failed with status', response.status);
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