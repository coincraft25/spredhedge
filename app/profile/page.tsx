'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUser, getUserRole } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { User, Mail, Phone, Building, MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvestorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

export default function Profile() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'investor'>('investor');
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const role = await getUserRole(user.id);
    setUserRole(role as 'admin' | 'investor');

    if (role === 'investor') {
      await loadProfile(user.id);
    }

    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('investors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        address: data.address || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!profile) return;

    const { error } = await supabase
      .from('investors')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        company: formData.company,
        address: formData.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    toast({
      title: 'Success',
      description: 'Profile updated successfully',
    });

    await loadProfile(profile.user_id);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar userRole={userRole} />
        <div className="flex">
          <Sidebar role={userRole} />
          <main className="flex-1 p-8 bg-white">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                    Profile Not Found
                  </h2>
                  <p className="text-slate-600">
                    Unable to load your profile information. Please contact your administrator.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="flex">
        <Sidebar role={userRole} />
        <main className="flex-1 p-8 bg-white">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Profile Settings</h1>
              <p className="text-slate-600">Manage your account information and preferences</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details. Email address cannot be changed for security
                  reasons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="mt-2 bg-slate-50"
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        Email address cannot be changed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company
                      </Label>
                      <Input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your company name"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Your address"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Password</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      To change your password, please contact your administrator.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Add an extra layer of security to your account by enabling two-factor
                      authentication.
                    </p>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <footer className="text-center text-sm text-slate-500 pt-8 border-t">
              Confidential. For qualified partners only.
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
