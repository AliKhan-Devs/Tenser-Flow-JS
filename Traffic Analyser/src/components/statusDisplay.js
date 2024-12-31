export function createStatusDisplay() {
  const statusElement = document.createElement('div');
  statusElement.className = 'status-display';
  document.querySelector('.container').insertBefore(
    statusElement,
    document.querySelector('.video-container')
  );

  return {
    updateStatus: (message) => {
      statusElement.textContent = message;
      statusElement.className = `status-display ${message.includes('Error') ? 'error' : ''}`;
    }
  };
}