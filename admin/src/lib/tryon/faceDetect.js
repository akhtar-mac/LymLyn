import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker = null;
let initializing = false;

/**
 * Initializes the MediaPipe Face Landmarker model.
 */
export async function initFaceLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  if (initializing) {
    // Wait until initialized if called concurrently
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (faceLandmarker) {
          clearInterval(check);
          resolve(faceLandmarker);
        }
      }, 100);
    });
  }

  initializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      // Fetch WASM from jsDelivr CDN
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'IMAGE',
      numFaces: 1
    });
    
    return faceLandmarker;
  } catch (error) {
    console.error('Failed to initialize FaceLandmarker:', error);
    throw error;
  } finally {
    initializing = false;
  }
}

/**
 * Detects a face in the given image element and returns the bounding box and landmarks.
 * @param {HTMLImageElement} imageElement 
 */
export async function detectFace(imageElement) {
  const landmarker = await initFaceLandmarker();
  
  // Wait for image to load if not already
  if (!imageElement.complete || imageElement.naturalHeight === 0) {
    await new Promise((resolve) => {
      imageElement.onload = resolve;
    });
  }

  const results = landmarker.detect(imageElement);
  
  if (!results || results.faceLandmarks.length === 0) {
    throw new Error("No face detected in the image.");
  }

  const landmarks = results.faceLandmarks[0];
  
  // Calculate bounding box from landmarks
  // Landmarks are normalized [0, 1]
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  
  for (const landmark of landmarks) {
    if (landmark.x < minX) minX = landmark.x;
    if (landmark.y < minY) minY = landmark.y;
    if (landmark.x > maxX) maxX = landmark.x;
    if (landmark.y > maxY) maxY = landmark.y;
  }
  
  // Add padding (10% of width/height)
  const padX = (maxX - minX) * 0.1;
  const padY = (maxY - minY) * 0.1;
  
  // Include some of the neck area by padding more at the bottom
  const padBottom = (maxY - minY) * 0.2;
  
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(1, maxX + padX);
  maxY = Math.min(1, maxY + padBottom);
  
  const width = imageElement.naturalWidth;
  const height = imageElement.naturalHeight;
  
  return {
    landmarks,
    boundingBox: {
      x: minX * width,
      y: minY * height,
      width: (maxX - minX) * width,
      height: (maxY - minY) * height
    }
  };
}
