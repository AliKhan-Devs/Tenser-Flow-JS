// Handles object detection and drawing
export class ObjectDetector {
  constructor(model, canvas, video) {
    this.model = model;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.video = video;
  }

  async detect() {
    if (!this.model || !this.video) {
      throw new Error('Model or video not initialized');
    }
    return await this.model.detect(this.video);
  }

  drawPredictions(predictions) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    predictions.forEach(prediction => {
      if (['car', 'truck', 'motorcycle'].includes(prediction.class)) {
        // Draw bounding box
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          prediction.bbox[0],
          prediction.bbox[1],
          prediction.bbox[2],
          prediction.bbox[3]
        );

        // Draw label
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
          `${prediction.class} ${Math.round(prediction.score * 100)}%`,
          prediction.bbox[0],
          prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
        );
      }
    });
  }
}