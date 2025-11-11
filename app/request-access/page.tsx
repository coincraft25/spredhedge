'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

export default function RequestAccess() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    investor_type: '',
    investment_amount: '',
    message: '',
    is_accredited: false,
    consent_given: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.is_accredited) {
      toast({
        title: 'Qualified Participant Confirmation Required',
        description: 'You must confirm that you are a qualified participant.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.consent_given) {
      toast({
        title: 'Consent Required',
        description: 'You must agree to the terms before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('access_requests').insert([
        {
          full_name: formData.name,
          email: formData.email,
          country: formData.country,
          investor_type: formData.investor_type,
          investment_amount: formData.investment_amount,
          message: formData.message || null,
          is_accredited: formData.is_accredited,
          consent_given: formData.consent_given,
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Request submitted',
        description: 'We will review your application and be in touch shortly.',
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-50 py-24">
          <div className="container mx-auto px-6 max-w-2xl">
            <Card>
              <CardContent className="p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Thank You for Your Interest in SPREDHEDGE
                </h1>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    Our team will review your information and reach out privately within 48 hours.
                  </p>
                  <p className="text-sm">
                    Your access request has been received.<br />
                    This is a private review process; please allow 1–2 business days.
                  </p>
                  <p className="text-sm text-slate-500">
                    A confirmation has been sent to <span className="font-semibold">{formData.email}</span>
                  </p>
                </div>
                <Button onClick={() => router.push('/')} className="mt-6">
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="text-4xl font-bold text-slate-900">
                Request Private Access
              </CardTitle>
              <div className="space-y-3 text-slate-600">
                <p className="text-lg leading-relaxed">
                  SPREDHEDGE operates under a private digital capital framework.
                  Access is limited to qualified participants by invitation only.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
                  <p className="text-sm text-amber-900 font-semibold">
                    IMPORTANT: This inquiry does not constitute an offer or solicitation. Access is by private invitation only.
                  </p>
                </div>
                <p className="font-medium">
                  Complete the form below to request private access to SPREDHEDGE.
                  Applications are reviewed within 48 hours.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investor_type">
                    Participant Type <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.investor_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, investor_type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select participant type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Family Office">Family Office</SelectItem>
                      <SelectItem value="Fund">Fund</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment_amount">
                    Anticipated Allocation Range <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.investment_amount}
                    onValueChange={(value) =>
                      setFormData({ ...formData, investment_amount: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select amount range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5000-10000">$5,000 – $10,000</SelectItem>
                      <SelectItem value="10000-25000">$10,000 – $25,000</SelectItem>
                      <SelectItem value="25000-50000">$25,000 – $50,000</SelectItem>
                      <SelectItem value="50000+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    Country of Residence <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="e.g., United States"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message or Notes <span className="text-slate-500 font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Tell us briefly about your capital management objectives..."
                    rows={4}
                  />
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-5">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="accredited"
                      checked={formData.is_accredited}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_accredited: checked as boolean })
                      }
                      required
                    />
                    <label
                      htmlFor="accredited"
                      className="text-sm leading-relaxed text-slate-700 cursor-pointer"
                    >
                      I confirm that I am a qualified participant according to my jurisdiction's regulations. <span className="text-red-600">*</span>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consent"
                      checked={formData.consent_given}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, consent_given: checked as boolean })
                      }
                      required
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm leading-relaxed text-slate-700 cursor-pointer"
                    >
                      I understand that this inquiry is for informational purposes only and does not constitute an offer or solicitation. SPREDHEDGE will contact me privately if appropriate. <span className="text-red-600">*</span>
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Private Access Request'}
                </Button>

                <p className="text-xs text-slate-500 text-center leading-relaxed pt-2">
                  By submitting this form, you agree to our Privacy Policy and Legal Disclaimer.<br />
                  This inquiry does not constitute an offer or solicitation.<br />
                  Access is by private invitation only to qualified participants.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
