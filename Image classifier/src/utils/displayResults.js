export function displayResults(predictions, elementId) {
  const resultsDiv = document.getElementById(elementId);
  if (!resultsDiv) return;

  if (!predictions || predictions.length === 0) {
    resultsDiv.innerHTML = '<div class="prediction">No predictions available</div>';
    return;
  }

  resultsDiv.innerHTML = predictions
    .map(p => `
      <div class="prediction">
        <span>${p.className}</span>
        <span class="confidence">${(p.probability * 100).toFixed(2)}%</span>
      </div>
    `)
    .join('');
}