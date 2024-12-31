import * as cocoSsd from '@tensorflow-models/coco-ssd';

export async function loadModel(onStatusChange) {
  try {
    onStatusChange('Loading model...');
    const model = await cocoSsd.load({
      base: 'lite_mobilenet_v2'  // Using a lighter model for better performance
    });
    onStatusChange('Model loaded successfully');
    return model;
  } catch (error) {
    onStatusChange('Error loading model: ' + error.message);
    throw error;
  }
}