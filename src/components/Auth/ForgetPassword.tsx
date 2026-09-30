'use client';

import React, { FormEvent } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Subtitle from '../Global/Subtitle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Title from '../Global/Title';
import { useForgetPasswordMutation } from '@/redux/api/userApi';
import { toast } from 'sonner';

export default function ForgetPassword() {
    const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);
        const email = formData.get('email') as string;

        if (!email) return;

        const toastId = toast.loading('Sending reset code...');
        
        try {
            const result = await forgetPassword({ email }).unwrap();
            
            form.reset();
            
            
            if (result?.success) {
                router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&purpose=reset`);
                toast.success('If an account exists, a verification code has been sent.', { id: toastId });
            } else {
                toast.error(result?.message || 'Failed to send reset code', { id: toastId });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to send reset link', { id: toastId });
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Page Subtitle */}
            <div className="text-center mb-10">
                <Title>Forgot password?</Title>
                <Subtitle>No worries, we&lsquo;ll send you reset instructions.</Subtitle>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                    <div className="relative">
                        <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="pl-10 md:h-11"
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? 'Sending code...' : 'Send reset code'}
                </Button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                    Go back to{' '}
                    <Link href="/auth/sign-in">
                        <Button variant="link" className="px-0 text-sm" disabled={isLoading}>
                            Sign In
                        </Button>
                    </Link>
                </p>
            </div>
        </div>
    );
}