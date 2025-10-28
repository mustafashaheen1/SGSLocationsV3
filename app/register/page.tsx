'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userType, setUserType] = useState('production');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      toast({
        title: 'Error',
        description: authError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        user_type: userType,
        company_name: formData.companyName,
      });

      if (profileError) {
        toast({
          title: 'Error',
          description: 'Failed to create profile',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
        router.push('/dashboard');
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-[110px]">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 mb-8">Join SGS Locations today</p>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <Label className="mb-3 block">I am a...</Label>
              <RadioGroup value={userType} onValueChange={setUserType}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="production" id="production" />
                  <Label htmlFor="production" className="cursor-pointer font-normal">
                    Production Professional
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="property_owner" id="property_owner" />
                  <Label htmlFor="property_owner" className="cursor-pointer font-normal">
                    Property Owner
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(214) 555-0123"
                className="mt-1"
              />
            </div>

            {userType === 'property_owner' && (
              <div>
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company LLC"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="mt-1"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="terms" required />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c]"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#dc2626] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
