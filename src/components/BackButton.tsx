// src/components/BackButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  variant = 'ghost',
  className = '',
}) => {
  const navigate = useNavigate();
  return (
    <Button
      variant={variant}
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
};
