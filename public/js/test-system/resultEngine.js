window.ResultEngine = {
  /**
   * Core Local Result Engine
   * Strictly ignores API summary stats (correct_answers, score, etc.)
   * Only uses question.correct_answer and locally saved user answers.
   */
  calculateResult: (attempt, solutionData) => {
    const data = solutionData?.data || {};
    const sections = data.sections || [];
    const userAnswers = attempt.answers || {}; // Keyed by question_group_id or index
    
    let totalQuestions = 0;
    let attemptedCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let marksObtained = 0;
    let totalMaxMarks = 0;
    
    const questionResults = [];

    sections.forEach((section) => {
      if (!section.questions) return;
      
      section.questions.forEach((q) => {
        // Use group ID as key, fallback to index
        const qId = q.question_group_id || q.id;
        const userAnswer = userAnswers[qId];
        
        // Strictly use question.correct_answer array
        const correctAns = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
        
        const isAttempted = !!userAnswer;
        let isCorrect = false;
        
        totalQuestions++;
        const qMarks = parseInt(q.mark_per_question || section.marks_per_question || 4);
        const qNegMarks = parseInt(q.negative_marks || section.negative_marks || 0);
        totalMaxMarks += qMarks;

        if (isAttempted) {
          attemptedCount++;
          if (userAnswer === correctAns) {
            isCorrect = true;
            correctCount++;
            marksObtained += qMarks;
          } else {
            wrongCount++;
            marksObtained -= qNegMarks;
          }
        }
        
        questionResults.push({
          qId,
          question: q,
          userAnswer,
          correctAns,
          isAttempted,
          isCorrect,
          marksAwarded: isCorrect ? qMarks : (isAttempted ? -qNegMarks : 0)
        });
      });
    });

    const unattemptedCount = totalQuestions - attemptedCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;
    const percentage = totalMaxMarks > 0 ? Math.round((marksObtained / totalMaxMarks) * 1000) / 10 : 0;
    
    return {
      testName: data.test_name || "Local Test Result",
      totalQuestions,
      attemptedCount,
      correctCount,
      wrongCount,
      unattemptedCount,
      score: marksObtained,
      totalMaxMarks,
      accuracy,
      percentage,
      timeSpent: attempt.timeSpent || 0,
      submittedAt: attempt.submittedAt || new Date().toISOString(),
      questionResults
    };
  }
};