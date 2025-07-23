// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory OTP store (just for testing)
const otpStore = new Map();

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ Uplaud OTP Backend is Running');
});

// ✅ Send OTP (Mock)
app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, otp);

  console.log(`🔐 OTP for ${phone} is ${otp}`); // For dev only

  return res.json({
    success: true,
    otp, // For mock mode only — DO NOT send this in production
    message: 'OTP generated successfully.',
  });
});

// ✅ Verify OTP (Mock)
app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  const storedOtp = otpStore.get(phone);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ success: false, error: 'Invalid OTP' });
  }

  // Clear OTP after verification
  otpStore.delete(phone);

  return res.json({
    success: true,
    user: {
      phone,
      userName: 'John Doe', // Mock user info
      joinDate: new Date().toISOString(),
    },
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Mock OTP Server running at http://localhost:${PORT}`);
});
