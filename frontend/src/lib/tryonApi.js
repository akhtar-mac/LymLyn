export const generateTryon = async (personImageBase64, garmentUrl, description) => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  
  // Convert base64 to Blob for FormData upload
  const resBase64 = await fetch(personImageBase64);
  const personBlob = await resBase64.blob();

  const formData = new FormData();
  formData.append('person_image', personBlob, 'person.jpg');
  formData.append('cloth_url', garmentUrl);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(`${backendUrl}/tryon/generate`, {
    method: 'POST',
    body: formData
    // Note: Do NOT set Content-Type header; fetch sets it automatically with the multipart boundary
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle specific errors with friendly messages as per STEP 4
    let err;
    if (data.error === 'model_loading') {
      err = new Error('AI is warming up. Please try again in 30 seconds.');
      err.code = 'model_loading';
    } else if (data.error === 'rate_limited') {
      err = new Error('Please wait 1 minute and try again.');
      err.code = 'rate_limited';
    } else if (data.error === 'timeout') {
      err = new Error('Photo too large for processing. Please use a smaller photo.');
      err.code = 'timeout';
    } else {
      err = new Error(data.message || data.error || 'Server error');
      err.code = data.error;
    }
    throw err;
  }

  return data;
};
