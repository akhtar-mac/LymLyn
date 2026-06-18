const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../services/supabaseAdminClient');

router.post('/dummy-register', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    if (otp !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const email = `${cleanPhone}@lymlyn.com`;
    const password = `lymlyn-dummy-123456`;

    // 1. Try to create the user with auto-confirm
    let { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone }
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('already registered')) {
        // User already exists, find them and ensure email_confirm is true
        // (Just in case they were created by the old frontend code)
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        if (existingUser && !existingUser.email_confirmed_at) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email_confirm: true, password });
        }
        return res.json({ success: true, message: 'User exists and confirmed' });
      }
      throw error;
    }

    // 2. Create default profile for the dummy user
    if (data?.user) {
      const isAdmin = cleanPhone.includes('123456');
      
      // Check if profile exists just in case
      const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('id', data.user.id).single();
      
      if (!existingProfile) {
        await supabaseAdmin.from('profiles').insert({
          id: data.user.id,
          full_name: isAdmin ? 'Admin User' : 'Guest User',
          phone: phone,
          admin_role: isAdmin ? 'super_admin' : 'customer'
        });
      }
    }

    res.json({ success: true, user: data?.user });
  } catch (err) {
    next(err);
  }
});

// Endpoint to handle user photo uploads during onboarding
router.post('/upload-photo', async (req, res, next) => {
  try {
    const { user_id, image_data, file_name } = req.body;
    
    if (!user_id || !image_data || !file_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const contentType = image_data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    
    const storagePath = `users/${user_id}/${file_name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('user-profiles')
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      // If bucket doesn't exist, try to use 'product-images' temporarily
      if (uploadError.message.includes('Bucket not found')) {
        const fallbackPath = `temp-users/${user_id}/${file_name}`;
        const { error: fallbackError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(fallbackPath, buffer, { contentType, upsert: true });
          
        if (fallbackError) throw fallbackError;
        
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(fallbackPath);
          
        return res.json({ photo_url: publicUrl });
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-profiles')
      .getPublicUrl(storagePath);

    res.json({ photo_url: publicUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
