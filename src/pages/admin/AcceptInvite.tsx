import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';

const AcceptInvite: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'enter' | 'verify' | 'accepting' | 'done'>('enter');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invite token.');
    }
  }, [token]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Create account if it doesn't exist; Supabase will error if it exists
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/admin/accept-invite?token=' + token }
      });
      if (signUpError && !signUpError.message.includes('already registered')) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      
      // Try to accept invite immediately (bypass email verification)
      setStep('accepting');
      const { error: acceptError } = await supabase.rpc('accept_admin_invite_no_verification' as any, { invite_token: token });
      if (acceptError) {
        // If bypass fails, fall back to email verification flow
        setStep('verify');
      } else {
        // Success! User is now admin
        setStep('done');
        setTimeout(() => navigate('/admin'), 1000);
      }
    } catch (err) {
      setError(String(err));
      setStep('verify'); // Fall back to verification flow
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      setStep('accepting');
      
      // Try bypass function first (no email verification required)
      const { error: acceptError } = await supabase.rpc('accept_admin_invite_no_verification' as any, { invite_token: token });
      if (acceptError) {
        // Fall back to regular accept function
        const { error: fallbackError } = await supabase.rpc('accept_admin_invite' as any, { invite_token: token });
        if (fallbackError) {
          setError(fallbackError.message);
          setStep('enter');
          setIsLoading(false);
          return;
        }
      }
      
      setStep('done');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      setError(String(err));
      setStep('enter');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Accept Admin Invite</CardTitle>
          <CardDescription>
            Use the email address that received the invite to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token && (
            <Alert variant="destructive"><AlertDescription>Missing or invalid token.</AlertDescription></Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}

          {step === 'enter' && (
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Continue'}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  If you received a verification email, please check it and click the link. If you didn't receive an email, you can still proceed by clicking the button below to sign in and accept the invite.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Continue to Accept Invite'}
              </Button>
            </div>
          )}

          {step === 'accepting' && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Granting admin access...
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="font-medium">Invite accepted. You now have admin access.</div>
              <div className="text-sm text-muted-foreground">Redirecting to admin...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;


