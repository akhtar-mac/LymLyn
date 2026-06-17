/**
 * Loads an image from a URL and returns a Promise that resolves to an HTMLImageElement.
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas tainting
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Composites the avatar, skin tint, face, and garment on the canvas.
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} config 
 */
export async function renderAvatar(canvas, config) {
  const {
    avatarSvgUrl,
    avatarAnchors,
    faceCropUrl,
    skinToneHex,
    garmentUrl
  } = config;

  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1. Load resources concurrently
  const [avatarImg, faceImg, garmentImg] = await Promise.all([
    loadImage(avatarSvgUrl),
    faceCropUrl ? loadImage(faceCropUrl) : Promise.resolve(null),
    garmentUrl ? loadImage(garmentUrl) : Promise.resolve(null)
  ]);

  // Dimensions
  const w = canvas.width;
  const h = canvas.height;

  // 2. Draw Avatar Base (We use a trick to tint the SVG with the skin tone)
  // Draw base silhouette
  ctx.save();
  ctx.drawImage(avatarImg, 0, 0, w, h);
  
  // Tint silhouette with skin tone
  if (skinToneHex) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = skinToneHex;
    ctx.fillRect(0, 0, w, h);
    
    // Add some shading/multiply to make it less flat
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(avatarImg, 0, 0, w, h); // Draw it again to re-apply the original SVG shading
  }
  ctx.restore();

  // 3. Draw Face Crop
  if (faceImg && avatarAnchors) {
    const neck = avatarAnchors.neck;
    
    // Assuming avatar design places the neck at some specific (x,y)
    // The face crop should be scaled and centered over the neck anchor
    const faceWidth = w * 0.3; // Scale face relative to canvas width (e.g., 30%)
    const faceHeight = faceImg.height * (faceWidth / faceImg.width);
    
    // We want the bottom center of the face crop to sit just below the neck anchor
    const faceX = neck.x - (faceWidth / 2);
    const faceY = neck.y - faceHeight + (faceHeight * 0.15); // Sink it slightly into the neck
    
    ctx.save();
    // Optional: Add a small drop shadow to the head for depth
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    ctx.drawImage(faceImg, faceX, faceY, faceWidth, faceHeight);
    ctx.restore();
  }

  // 4. Draw Garment Cutout
  if (garmentImg && avatarAnchors) {
    const leftShoulder = avatarAnchors.leftShoulder;
    const rightShoulder = avatarAnchors.rightShoulder;
    
    // Calculate shoulder width of the avatar
    const avatarShoulderWidth = rightShoulder.x - leftShoulder.x;
    
    // Scale the garment so its shoulders match the avatar's shoulders
    // We assume the garment image has transparent padding, so we might need a scaling factor.
    // Let's assume the garment shoulder width is ~60% of the image width (typical for flat lays).
    // This value would ideally come from the product metadata, but we'll use a heuristic.
    
    const assumedGarmentShoulderRatio = 0.6;
    const garmentRenderWidth = avatarShoulderWidth / assumedGarmentShoulderRatio;
    const garmentRenderHeight = garmentImg.height * (garmentRenderWidth / garmentImg.width);
    
    // Position garment centered horizontally between shoulders, aligned to shoulders vertically
    const centerX = leftShoulder.x + (avatarShoulderWidth / 2);
    const garmentX = centerX - (garmentRenderWidth / 2);
    
    // Align the top of the garment slightly above the shoulders (neckline)
    const garmentY = leftShoulder.y - (garmentRenderHeight * 0.15);
    
    ctx.save();
    ctx.drawImage(garmentImg, garmentX, garmentY, garmentRenderWidth, garmentRenderHeight);
    ctx.restore();
  }
}
