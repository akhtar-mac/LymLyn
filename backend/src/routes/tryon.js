const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const multer = require('multer');

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

router.post('/generate', upload.fields([
  { name: 'person_image', maxCount: 1 },
  { name: 'cloth_image', maxCount: 1 }
]), async (req, res) => {
  let tempPersonPath = null;
  
  try {
    // --- Validate inputs ---
    if (!req.files || !req.files.person_image) {
      return res.status(400).json({ error: 'Person photo is required' });
    }
    
    // Fallback if cloth_image wasn't uploaded via form but passed as URL
    if (!req.files.cloth_image && !req.body.cloth_url && !req.body.garmentUrl) {
      return res.status(400).json({ error: 'Clothing image is required' });
    }

    // Write person image to temp file for Python script
    const personBuffer = req.files.person_image[0].buffer;
    const tempDir = os.tmpdir();
    tempPersonPath = path.join(tempDir, `tryon_person_${crypto.randomBytes(8).toString('hex')}.jpg`);
    fs.writeFileSync(tempPersonPath, personBuffer);

    // Resolve garment image path
    let finalGarmentPath;
    if (req.files.cloth_image) {
      // If garment uploaded directly, write to temp file too
      // (For this implementation, frontend currently passes cloth_url)
      finalGarmentPath = path.join(tempDir, `tryon_cloth_${crypto.randomBytes(8).toString('hex')}.jpg`);
      fs.writeFileSync(finalGarmentPath, req.files.cloth_image[0].buffer);
    } else {
      let garmentUrl = req.body.garmentUrl || req.body.cloth_url;
      finalGarmentPath = garmentUrl;
      if (garmentUrl.startsWith('/')) {
        finalGarmentPath = path.join(__dirname, '../../../frontend/public', garmentUrl);
        if (!fs.existsSync(finalGarmentPath)) {
          throw new Error('Garment image not found on server');
        }
      } else if (!garmentUrl.startsWith('http')) {
        throw new Error('Invalid garment image URL');
      }
    }

    const description = req.body.description || 'clothing item';

    // --- Call Python IDM-VTON Gradio Client ---
    const pythonScript = path.join(__dirname, '../services/idm_vton_client.py');
    const pythonExecutable = path.join(__dirname, '../../.venv/bin/python3');
    
    const command = `${pythonExecutable} ${pythonScript} "${tempPersonPath}" "${finalGarmentPath}" "${description}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 10, timeout: 120000 }, (error, stdout, stderr) => {
      // Clean up temp file
      if (tempPersonPath && fs.existsSync(tempPersonPath)) {
        fs.unlinkSync(tempPersonPath);
      }

      if (error) {
        if (error.killed) {
          return res.status(504).json({ error: 'timeout', message: 'Try-on took too long. Please try with a smaller photo.' });
        }
        console.error('Python Script Execution Error:', error.message);
      }

      try {
        const lines = stdout.trim().split('\n');
        const jsonResponse = JSON.parse(lines[lines.length - 1]);

        if (jsonResponse.success) {
          return res.json({ 
            success: true,
            image: jsonResponse.image,
            result_image: jsonResponse.image
          });
        } else {
          const errStr = jsonResponse.error || '';
          if (errStr.includes('loading') || errStr.includes('starting')) {
            return res.status(503).json({ error: 'model_loading', message: 'AI model is warming up. Please try again in 30 seconds.' });
          }
          if (errStr.includes('Rate limit')) {
            return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Please wait 1 minute and try again.' });
          }
          return res.status(500).json({ error: errStr });
        }
      } catch (parseError) {
        console.error('Failed to parse Python output:', parseError);
        console.error('Raw Output:', stdout);
        return res.status(500).json({ error: 'server_error', message: 'Invalid response from AI service.' });
      }
    });

  } catch (err) {
    if (tempPersonPath && fs.existsSync(tempPersonPath)) {
      fs.unlinkSync(tempPersonPath);
    }
    console.error('Try-on error:', err.message);
    res.status(500).json({ error: 'server_error', message: err.message || 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
