import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export async function loadModel() {
  try {
    const model = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    console.log('Model loaded successfully');
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
}