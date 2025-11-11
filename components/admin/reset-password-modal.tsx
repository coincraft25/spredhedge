'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateSecurePassword, getPasswordStrength, copyToClipboard } from '@/lib/utils/password';
import { Copy, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
  };
  onSuccess: () => void;
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  investor,
  onSuccess,
}: ResetPasswordModalProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(16);
    setPassword(newPassword);
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(password);
    if (success) {
      setCopied(true);
      toast({
        title: 'Password copied',
        description: 'Password has been copied to clipboard',
      });
      setTimeout(() => setCopied(false), 3000);
    } else {
      toast({
        title: 'Copy failed',
        description: 'Please manually copy the password',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 8) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/reset-investor-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: investor.user_id,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'Password reset',
        description: `Password reset for ${investor.full_name}. Make sure to share the new password securely.`,
      });

      onSuccess();
      onOpenChange(false);
      setPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Investor Password</DialogTitle>
          <DialogDescription>
            Generate a new secure password for this investor account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={investor.full_name} disabled />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={investor.email} disabled />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">New Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="h-8"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Click Generate to create a password"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 p-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPassword}
                  disabled={!password}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {passwordStrength && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Strength:</span>
                <Badge
                  variant="outline"
                  className={
                    passwordStrength.strength === 'strong'
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : passwordStrength.strength === 'medium'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }
                >
                  {passwordStrength.strength}
                </Badge>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The investor's current password will be replaced. Securely share the new password
              with them.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              className="flex-1"
              disabled={!password || loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
