export function setupVideo(video, onLoadedMetadata) {
  video.addEventListener('loadedmetadata', onLoadedMetadata);
  
  return {
    startVideoStream: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 800, height: 600 }
        });
        video.srcObject = stream;
        await video.play();
        return true;
      } catch (err) {
        console.error('Error accessing camera:', err);
        return false;
      }
    },

    loadVideoFile: (file) => {
      const url = URL.createObjectURL(file);
      video.src = url;
      return video.play();
    }
  };
}