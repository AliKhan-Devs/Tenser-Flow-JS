import '@tensorflow/tfjs';
import { loadModel } from './src/utils/modelLoader';
import { setupVideo } from './src/utils/videoHandler';
import { createStatusDisplay } from './src/components/statusDisplay';
import { ObjectDetector } from './src/utils/objectDetector';
import { StatsManager } from './src/utils/statsManager';

let model;
let video;
let canvas;
let streaming = false;
let objectDetector;
let statsManager;

// Initialize the application
async function init() {
  try {
    // Load DOM elements
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    
    if (!video || !canvas) {
      throw new Error('Required video or canvas elements not found');
    }

    const statusDisplay = createStatusDisplay();
    
    // Load COCO-SSD model
    model = await loadModel(statusDisplay.updateStatus);
    
    // Initialize managers
    objectDetector = new ObjectDetector(model, canvas, video);
    statsManager = new StatsManager();
    
    const videoHandler = setupVideo(video, () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    // Setup event listeners
    const cameraBtn = document.getElementById('cameraBtn');
    const videoUpload = document.getElementById('videoUpload');

    if (!cameraBtn || !videoUpload) {
      throw new Error('Required button elements not found');
    }

    cameraBtn.addEventListener('click', async () => {
      statusDisplay.updateStatus('Starting camera...');
      streaming = await videoHandler.startVideoStream();
      if (streaming) {
        statusDisplay.updateStatus('Camera active');
        detectFrame();
      } else {
        statusDisplay.updateStatus('Error accessing camera');
      }
    });

    videoUpload.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        statusDisplay.updateStatus('Loading video...');
        try {
          await videoHandler.loadVideoFile(file);
          streaming = true;
          statusDisplay.updateStatus('Video loaded');
          detectFrame();
        } catch (err) {
          statusDisplay.updateStatus('Error loading video: ' + err.message);
          console.error('Error loading video:', err);
        }
      }
    });

  } catch (err) {
    console.error('Initialization error:', err);
    const statusDisplay = createStatusDisplay();
    statusDisplay.updateStatus('Error initializing: ' + err.message);
  }
}

// Detect objects in video frames
async function detectFrame() {
  if (!streaming || !objectDetector) return;

  try {
    // Detect objects
    const predictions = await objectDetector.detect();
    
    // Draw predictions and update stats
    objectDetector.drawPredictions(predictions);
    statsManager.updateFromPredictions(predictions);
    statsManager.updateDisplay();

    // Request next frame
    requestAnimationFrame(detectFrame);
  } catch (err) {
    console.error('Detection error:', err);
    streaming = false;
    const statusDisplay = createStatusDisplay();
    statusDisplay.updateStatus('Detection error: ' + err.message);
  }
}

// Initialize when page loads
window.addEventListener('load', init);