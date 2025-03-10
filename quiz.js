/* Unchanged from your original */
function addDetailedResult(question, userAnswer, correctAnswer, isCorrect) {
    const detailedResults = document.getElementById('detailedResults');
    const resultP = document.createElement('p');
    resultP.className = isCorrect ? 'correct' : 'incorrect';
    resultP.innerHTML = `<strong>${question}</strong><br>Your answer: ${userAnswer}<br>Correct answer: ${correctAnswer}`;
    detailedResults.appendChild(resultP);
}

function checkAnswer(answer) {
    const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();
    const resultMessage = isCorrect ? 'Correct!' : 'Incorrect.';
    addDetailedResult(
        `What is the capital of ${countryName}?`,
        answer,
        correctAnswer,
        isCorrect
    );
    // ... rest ...
}


