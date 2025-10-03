import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Rate limiting configuration
const RATE_LIMIT_KEY = 'admin_login_attempts';
const LOCKOUT_KEY = 'admin_login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

interface LoginAttempt {
  timestamp: number;
  count: number;
}

const AdminLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  
  const { signIn, user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Check for existing lockout on mount and set up timer
  useEffect(() => {
    checkLockoutStatus();
    
    // Auto-focus email field on mount if not locked out
    if (!isLockedOut) {
      const emailInput = document.getElementById('email');
      emailInput?.focus();
    }
  }, []);

  // Update lockout timer every second
  useEffect(() => {
    if (isLockedOut && lockoutTimeRemaining > 0) {
      const timer = setInterval(() => {
        checkLockoutStatus();
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isLockedOut, lockoutTimeRemaining]);

  useEffect(() => {
    // Redirect only when admin profile is confirmed
    if (!loading && profile?.role === 'admin') {
      // Clear rate limiting on successful login
      localStorage.removeItem(RATE_LIMIT_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      navigate('/admin');
    }
  }, [loading, profile, navigate]);

  const checkLockoutStatus = () => {
    const lockoutData = localStorage.getItem(LOCKOUT_KEY);
    
    if (lockoutData) {
      const lockoutUntil = parseInt(lockoutData, 10);
      const now = Date.now();
      
      if (now < lockoutUntil) {
        setIsLockedOut(true);
        setLockoutTimeRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(RATE_LIMIT_KEY);
        setIsLockedOut(false);
        setLockoutTimeRemaining(0);
      }
    } else {
      setIsLockedOut(false);
      setLockoutTimeRemaining(0);
    }
  };

  const getLoginAttempts = (): LoginAttempt => {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    if (!data) {
      return { timestamp: Date.now(), count: 0 };
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return { timestamp: Date.now(), count: 0 };
    }
  };

  const recordFailedAttempt = () => {
    const attempts = getLoginAttempts();
    const now = Date.now();
    
    // Reset counter if last attempt was more than 1 hour ago
    if (now - attempts.timestamp > 60 * 60 * 1000) {
      attempts.count = 1;
      attempts.timestamp = now;
    } else {
      attempts.count += 1;
    }
    
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(attempts));
    
    // Check if we should lock out
    if (attempts.count >= MAX_ATTEMPTS) {
      const lockoutUntil = now + LOCKOUT_DURATION;
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      setIsLockedOut(true);
      setLockoutTimeRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
      
      setError(`Too many failed login attempts. Account locked for 15 minutes.`);
    } else {
      const remainingAttempts = MAX_ATTEMPTS - attempts.count;
      setError(`Invalid email or password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`);
    }
  };

  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lockout status before attempting login
    checkLockoutStatus();
    
    if (isLockedOut) {
      setError(`Account is locked. Try again in ${formatLockoutTime(lockoutTimeRemaining)}.`);
      return;
    }
    
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        recordFailedAttempt();
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else if (error.message.includes('Email rate limit exceeded')) {
        setError('Too many requests. Please try again later.');
      } else {
        setError(error.message);
      }
    } else {
      // Clear rate limiting on successful login
      localStorage.removeItem(RATE_LIMIT_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
    }
    // Success handled by auth state listener; redirect occurs when admin profile is loaded
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Admin Access
          </CardTitle>
          <CardDescription>
            Sign in to manage the Greek Beaches Directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                aria-describedby={error ? "error-message" : undefined}
                className="focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  aria-describedby={error ? "error-message" : undefined}
                  className="pr-10 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {isLockedOut && (
              <div 
                role="alert"
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-start gap-2"
              >
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Account Temporarily Locked</div>
                  <div className="mt-1">
                    Too many failed login attempts. Please try again in {formatLockoutTime(lockoutTimeRemaining)}.
                  </div>
                </div>
              </div>
            )}

            {error && !isLockedOut && (
              <div 
                id="error-message"
                role="alert"
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password || isLockedOut}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing in...
                </>
              ) : isLockedOut ? (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Locked ({formatLockoutTime(lockoutTimeRemaining)})
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginForm;