import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-gradient-to-br from-[#6e1bd4] via-[#6214a8] to-[#4c0e7a] flex flex-col relative overflow-hidden">
      {/* Top left: transparent logo as homepage link */}
      <div className="absolute top-8 left-8 z-30">
        <Link to="/">
          <img
            alt="Uplaud Logo"
            className="h-12 w-auto mb-1 transition-opacity duration-200 hover:opacity-80"
            src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png"
            style={{ objectFit: 'contain', opacity: 0.8, cursor: 'pointer' }}
          />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center z-20">
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

      {/* Glow background effects */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
    </div>
  );
};

export default VerifyOtp;
