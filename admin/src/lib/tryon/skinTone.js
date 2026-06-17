/**
 * Helper to extract skin tone from the face image.
 * 
 * We sample pixels from specific landmark regions (e.g. forehead, cheeks).
 * For simplicity, we can also sample a central region of the bounding box.
 */

export function extractSkinTone(imageElement, faceData) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  
  ctx.drawImage(imageElement, 0, 0);
  
  // MediaPipe landmarks indices (rough approximations)
  // Forehead: 151
  // Left Cheek: 234
  // Right Cheek: 454
  // Chin: 152
  
  const samplePoints = [
    faceData.landmarks[151], // Forehead
    faceData.landmarks[234], // Left Cheek
    faceData.landmarks[454]  // Right Cheek
  ];
  
  let r = 0, g = 0, b = 0;
  let count = 0;
  
  const w = canvas.width;
  const h = canvas.height;
  
  samplePoints.forEach(point => {
    // MediaPipe points are normalized
    const cx = Math.floor(point.x * w);
    const cy = Math.floor(point.y * h);
    
    // Sample a small 5x5 region around each point to get average color
    const size = 5;
    const startX = Math.max(0, cx - Math.floor(size/2));
    const startY = Math.max(0, cy - Math.floor(size/2));
    
    try {
      const imageData = ctx.getImageData(startX, startY, size, size);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Simple heuristic to ignore hair/eyes (very dark colors) or pure highlights
        if ((data[i] + data[i+1] + data[i+2]) / 3 > 30 && (data[i] + data[i+1] + data[i+2]) / 3 < 240) {
           r += data[i];
           g += data[i+1];
           b += data[i+2];
           count++;
        }
      }
    } catch (e) {
      console.warn("Could not sample skin tone at point", cx, cy);
    }
  });
  
  if (count === 0) {
    // Fallback to a default generic skin tone
    return '#E5C298';
  }
  
  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);
  
  // Convert to Hex
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

/**
 * Creates a cropped image from the face bounding box
 */
export async function createFaceCrop(imageElement, boundingBox) {
  const canvas = document.createElement('canvas');
  canvas.width = boundingBox.width;
  canvas.height = boundingBox.height;
  const ctx = canvas.getContext('2d');
  
  // Create an elliptical mask for the face to remove background
  ctx.beginPath();
  ctx.ellipse(
    canvas.width / 2, 
    canvas.height / 2, 
    canvas.width / 2.2, // slightly smaller width for cheekbones
    canvas.height / 2, 
    0, 0, 2 * Math.PI
  );
  ctx.clip();
  
  // Draw the cropped portion
  ctx.drawImage(
    imageElement,
    boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
    0, 0, canvas.width, canvas.height
  );
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}
