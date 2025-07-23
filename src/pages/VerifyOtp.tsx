import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = () => {
    const storedOtp = sessionStorage.getItem('mock_otp');
    const phone = sessionStorage.getItem('otp_phone');

    if (!storedOtp || !phone) {
      toast({ title: 'Session expired', description: 'Please login again.', variant: 'destructive' });
      navigate('/login');
      return;
    }

    if (otp === storedOtp) {
      toast({ title: 'Verified!', description: 'Redirecting to dashboard...' });
      localStorage.setItem('auth_token', `auth_${phone}_${Date.now()}`);
      localStorage.setItem('loggedIn', 'true');
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      toast({ title: 'Invalid OTP', description: 'Try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6e1bd4] via-[#6214a8] to-[#4c0e7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl backdrop-blur-md p-8 space-y-6">
        <div className="flex items-center justify-center mb-4">
          <Shield className="text-purple-600 w-10 h-10" />
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800">Enter the OTP</h2>
        <p className="text-sm text-center text-gray-500">Check your WhatsApp for the 6-digit code.</p>

        <Input
          type="text"
          maxLength={6}
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="text-black"
        />

        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          Verify OTP
        </Button>

        <p className="text-xs text-center text-gray-500">
          Didn’t receive it?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-blue-600 underline cursor-pointer font-medium"
          >
            Login again to resend OTP
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
