import { loadModel } from './src/utils/modelLoader';
import { createImagePreview, classifyImage } from './src/utils/imageProcessor';
import { displayResults } from './src/utils/displayResults';

let model;
let isVideoProcessing = false;

// Handle image upload
function setupImageUpload() {
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const resultsDiv = document.getElementById('imageResults');
  
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Clear previous results
      imagePreview.innerHTML = '';
      resultsDiv.innerHTML = '<div class="prediction">Processing...</div>';
      
      // Create and display image preview
      const img = await createImagePreview(file);
      imagePreview.appendChild(img);
      
      // Ensure model is loaded
      if (!model) {
        resultsDiv.innerHTML = '<div class="prediction">Loading model...</div>';
        model = await loadModel();
      }
      
      // Classify image
      const predictions = await classifyImage(model, img);
      displayResults(predictions, 'imageResults');
      
    } catch (error) {
      console.error('Error processing image:', error);
      resultsDiv.innerHTML = '<div class="prediction">Error processing image</div>';
    }
  });
}

// Process video frame
async function processVideo(videoElement) {
  if (!isVideoProcessing || !model) return;
  
  try {
    const predictions = await model.classify(videoElement, 5);
    displayResults(predictions, 'videoResults');
  } catch (error) {
    console.error('Error processing video frame:', error);
  }
  
  requestAnimationFrame(() => processVideo(videoElement));
}

// Handle video stream
async function setupVideo() {
  const video = document.getElementById('video');
  const startButton = document.getElementById('startVideo');
  const videoResults = document.getElementById('videoResults');
  
  startButton.addEventListener('click', async () => {
    try {
      // Ensure model is loaded
      if (!model) {
        videoResults.innerHTML = '<div class="prediction">Loading model...</div>';
        model = await loadModel();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      video.srcObject = stream;
      video.play();
      isVideoProcessing = true;
      processVideo(video);
      startButton.disabled = true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      videoResults.innerHTML = '<div class="prediction">Error accessing camera</div>';
    }
  });
}

// Initialize the application
async function init() {
  try {
    model = await loadModel();
    setupImageUpload();
    setupVideo();
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

init();