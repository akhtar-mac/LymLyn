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

  // Scaling factors: SVGs are 200x500
  const scaleX = w / 200;
  const scaleY = h / 500;

  // 3. Draw Face Crop
  // (Disabled because user now uploads full body images, rendering it here would look like a shrunk body on a neck)
  /*
  if (faceImg && avatarAnchors) {
    const neck = avatarAnchors.neck;
    
    const faceWidth = w * 0.3; // Scale face relative to canvas width
    const faceHeight = faceImg.height * (faceWidth / faceImg.width);
    
    const neckScaledX = neck.x * scaleX;
    const neckScaledY = neck.y * scaleY;

    // We want the bottom center of the face crop to sit just below the neck anchor
    const faceX = neckScaledX - (faceWidth / 2);
    const faceY = neckScaledY - faceHeight + (faceHeight * 0.15); // Sink it slightly into the neck
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(faceImg, faceX, faceY, faceWidth, faceHeight);
    ctx.restore();
  }
  */

  // 4. Draw Garment Cutout
  if (garmentImg && avatarAnchors) {
    if (config.garmentType === 'lower') {
      const waist = avatarAnchors.waist || { y: 200 };
      const hips = avatarAnchors.hips || { y: 250 };
      
      const waistScaledY = waist.y * scaleY;
      
      // Calculate garment width to cover the hips
      // Let's assume hip width is about 40% of canvas width for average avatar
      const hipWidth = w * 0.5; 
      
      const garmentRenderWidth = hipWidth;
      const garmentRenderHeight = garmentImg.height * (garmentRenderWidth / garmentImg.width);
      
      const centerX = w / 2;
      const garmentX = centerX - (garmentRenderWidth / 2);
      
      // Align the top of the garment to the waist
      const garmentY = waistScaledY - (garmentRenderHeight * 0.05); // slight overlap
      
      ctx.save();
      ctx.drawImage(garmentImg, garmentX, garmentY, garmentRenderWidth, garmentRenderHeight);
      ctx.restore();
    } else {
      const leftShoulder = avatarAnchors.leftShoulder;
      const rightShoulder = avatarAnchors.rightShoulder;
      
      const leftScaledX = leftShoulder.x * scaleX;
      const leftScaledY = leftShoulder.y * scaleY;
      const rightScaledX = rightShoulder.x * scaleX;
      
      // Calculate shoulder width of the avatar
      const avatarShoulderWidth = rightScaledX - leftScaledX;
      
      const assumedGarmentShoulderRatio = 0.6;
      const garmentRenderWidth = avatarShoulderWidth / assumedGarmentShoulderRatio;
      const garmentRenderHeight = garmentImg.height * (garmentRenderWidth / garmentImg.width);
      
      const centerX = leftScaledX + (avatarShoulderWidth / 2);
      const garmentX = centerX - (garmentRenderWidth / 2);
      
      // Align the top of the garment slightly above the shoulders (neckline)
      const garmentY = leftScaledY - (garmentRenderHeight * 0.15);
      
      ctx.save();
      ctx.drawImage(garmentImg, garmentX, garmentY, garmentRenderWidth, garmentRenderHeight);
      ctx.restore();
    }
  }
}
