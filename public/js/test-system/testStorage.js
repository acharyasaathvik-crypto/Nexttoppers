window.TestStorage = {
  // Save raw attempt (answers + metadata)
  saveAttempt: (testId, attemptData) => {
    localStorage.setItem(`test_attempt_${testId}`, JSON.stringify(attemptData));
    
    let completed = JSON.parse(localStorage.getItem('completed_tests') || '[]');
    if (!completed.includes(testId)) {
      completed.push(testId);
      localStorage.setItem('completed_tests', JSON.stringify(completed));
    }
  },
  
  getAttempt: (testId) => {
    const data = localStorage.getItem(`test_attempt_${testId}`);
    return data ? JSON.parse(data) : null;
  },

  // Save the locally calculated result
  saveLocalResult: (testId, resultData) => {
    localStorage.setItem(`test_local_result_${testId}`, JSON.stringify(resultData));
  },

  getLocalResult: (testId) => {
    const data = localStorage.getItem(`test_local_result_${testId}`);
    return data ? JSON.parse(data) : null;
  },

  saveSolution: (testId, solutionData) => {
    localStorage.setItem(`test_solution_${testId}`, JSON.stringify(solutionData));
  },
  
  getSolution: (testId) => {
    const data = localStorage.getItem(`test_solution_${testId}`);
    return data ? JSON.parse(data) : null;
  },

  clearAttempt: (testId) => {
    localStorage.removeItem(`test_attempt_${testId}`);
    localStorage.removeItem(`test_solution_${testId}`);
    localStorage.removeItem(`test_local_result_${testId}`);
    let completed = JSON.parse(localStorage.getItem('completed_tests') || '[]');
    completed = completed.filter(id => id != testId);
    localStorage.setItem('completed_tests', JSON.stringify(completed));
  },

  isTestCompleted: (testId) => {
    return !!localStorage.getItem(`test_attempt_${testId}`);
  }
};