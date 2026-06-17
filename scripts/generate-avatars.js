const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../assets/avatars');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const GENDERS = ['male', 'female'];
const BODY_TYPES = ['slim', 'average', 'heavy'];

// We'll generate simple parameterized paths for a 2D silhouette.
// 200x500 canvas
const generateAvatarSVG = (gender, bodyType) => {
  let shoulderWidth = 80;
  let waistWidth = 60;
  let hipWidth = 70;
  
  if (gender === 'male') {
    if (bodyType === 'slim') { shoulderWidth = 75; waistWidth = 55; hipWidth = 60; }
    else if (bodyType === 'heavy') { shoulderWidth = 100; waistWidth = 90; hipWidth = 85; }
    else { shoulderWidth = 90; waistWidth = 70; hipWidth = 75; }
  } else {
    // Female
    if (bodyType === 'slim') { shoulderWidth = 65; waistWidth = 50; hipWidth = 75; }
    else if (bodyType === 'heavy') { shoulderWidth = 85; waistWidth = 80; hipWidth = 100; }
    else { shoulderWidth = 75; waistWidth = 60; hipWidth = 85; }
  }

  // Anchor points
  const anchors = {
    neck: { x: 100, y: 50 },
    leftShoulder: { x: 100 - shoulderWidth/2, y: 70 },
    rightShoulder: { x: 100 + shoulderWidth/2, y: 70 },
    waist: { y: 200 },
    hips: { y: 250 }
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500" width="200" height="500">
  <defs>
    <style>
      .silhouette { fill: #E5E5E5; }
    </style>
  </defs>
  <!-- Base Silhouette -->
  <!-- Neck/Head area (head will be overlaid by photo) -->
  <circle cx="100" cy="40" r="20" class="silhouette" />
  
  <!-- Torso -->
  <path d="M ${anchors.leftShoulder.x} ${anchors.leftShoulder.y} 
           Q 100 60 ${anchors.rightShoulder.x} ${anchors.rightShoulder.y} 
           C ${100 + waistWidth/2 + 10} 150 ${100 + waistWidth/2} ${anchors.waist.y} ${100 + hipWidth/2} ${anchors.hips.y} 
           L ${100 - hipWidth/2} ${anchors.hips.y} 
           C ${100 - waistWidth/2} ${anchors.waist.y} ${100 - waistWidth/2 - 10} 150 ${anchors.leftShoulder.x} ${anchors.leftShoulder.y} Z" 
        class="silhouette" />
        
  <!-- Arms -->
  <path d="M ${anchors.leftShoulder.x} ${anchors.leftShoulder.y} 
           Q ${anchors.leftShoulder.x - 20} 150 ${anchors.leftShoulder.x - 10} 250 
           L ${anchors.leftShoulder.x + 10} 250
           Q ${anchors.leftShoulder.x} 150 ${anchors.leftShoulder.x + 10} ${anchors.leftShoulder.y} Z" class="silhouette" />
  <path d="M ${anchors.rightShoulder.x} ${anchors.rightShoulder.y} 
           Q ${anchors.rightShoulder.x + 20} 150 ${anchors.rightShoulder.x + 10} 250 
           L ${anchors.rightShoulder.x - 10} 250
           Q ${anchors.rightShoulder.x} 150 ${anchors.rightShoulder.x - 10} ${anchors.rightShoulder.y} Z" class="silhouette" />
           
  <!-- Legs -->
  <path d="M ${100 - hipWidth/2} ${anchors.hips.y} 
           L 95 480 L 115 480 L ${100 - 10} ${anchors.hips.y} Z" class="silhouette" />
  <path d="M ${100 + hipWidth/2} ${anchors.hips.y} 
           L 105 480 L 85 480 L ${100 + 10} ${anchors.hips.y} Z" class="silhouette" transform="translate(10, 0) scale(-1, 1) translate(-190, 0)" />
</svg>`;

  return { svg, anchors };
};

console.log('Generating placeholder avatar SVGs...');

for (const gender of GENDERS) {
  for (const bodyType of BODY_TYPES) {
    const { svg, anchors } = generateAvatarSVG(gender, bodyType);
    const filenameBase = `${gender}-${bodyType}`;
    
    fs.writeFileSync(path.join(OUTPUT_DIR, `${filenameBase}.svg`), svg);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${filenameBase}.json`), JSON.stringify(anchors, null, 2));
    
    console.log(`Generated ${filenameBase}`);
  }
}

console.log('Done.');
