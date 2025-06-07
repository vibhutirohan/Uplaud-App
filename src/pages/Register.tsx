
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'WhatsApp phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phoneNumber);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors({ email: 'User with this email already exists' });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to confirm your account, then you can login.",
        });
        navigate('/login');
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6214a8] to-[#4c0e7a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png" 
                alt="Uplaud Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Join Uplaud
            </CardTitle>
            <CardDescription className="text-slate-600">
              Create your account to start collecting authentic reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`${errors.fullName ? 'border-red-500' : 'border-slate-300'} focus:border-[#6214a8]`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-slate-700 font-medium">
                  WhatsApp Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`${errors.phoneNumber ? 'border-red-500' : 'border-slate-300'} focus:border-[#6214a8]`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`${errors.email ? 'border-red-500' : 'border-slate-300'} focus:border-[#6214a8]`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`${errors.password ? 'border-red-500' : 'border-slate-300'} focus:border-[#6214a8]`}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {errors.submit && (
                <p className="text-red-500 text-sm">{errors.submit}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#6214a8] hover:bg-[#4c0e7a] text-white font-medium py-2.5 mt-6"
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-[#6214a8] hover:text-[#4c0e7a] font-medium"
                >
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
