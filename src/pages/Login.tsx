
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ submit: 'Invalid email or password' });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        toast({
          title: "Login Successful!",
          description: "Welcome back to Uplaud.",
        });
        navigate('/dashboard');
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
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-600">
              Login to your Uplaud account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
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
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
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
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-[#6214a8] hover:text-[#4c0e7a] font-medium"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
