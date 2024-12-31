export function createImagePreview(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up the object URL
      resolve(img);
    };
  });
}

export async function classifyImage(model, imgElement) {
  try {
    return await model.classify(imgElement, 5);
  } catch (error) {
    console.error('Error classifying image:', error);
    throw error;
  }
}