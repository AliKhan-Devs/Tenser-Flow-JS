// Manages traffic statistics
export class StatsManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.stats = {
      car: 0,
      truck: 0,
      motorcycle: 0
    };
  }

  updateFromPredictions(predictions) {
    this.reset();
    predictions.forEach(prediction => {
      if (this.stats.hasOwnProperty(prediction.class)) {
        this.stats[prediction.class]++;
      }
    });
  }

  updateDisplay() {
    const elements = {
      car: document.getElementById('carCount'),
      truck: document.getElementById('truckCount'),
      motorcycle: document.getElementById('motorcycleCount')
    };

    Object.entries(elements).forEach(([key, element]) => {
      if (element) {
        element.textContent = this.stats[key];
      }
    });
  }
}