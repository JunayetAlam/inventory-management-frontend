'use client'

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon, LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button"
import CustomForm from "../Forms/CustomForm"
import CustomInput from "../Forms/CustomInput"
import Container from "../Global/Container"
import Title from "../Global/Title"
import Subtitle from "../Global/Subtitle"
import { FieldValues } from "react-hook-form"
import Link from "next/link"
import { toast } from "sonner"
import { useResetPasswordMutation } from "@/redux/api/userApi"
import { useRouter, useSearchParams } from "next/navigation"

const defaultValues = {
    newPassword: "",
    confirmPassword: "",
}

export default function ResetPassword() {
    const [resetPassword, { isLoading }] = useResetPasswordMutation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (data: FieldValues) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!token || !email) {
            toast.error('Invalid reset link')
            return
        }

        const formData = {
            email,
            newPassword: data.newPassword,
            token: token,
        }

        const toastId = toast.loading('Resetting your password...')
        try {
            const result = await resetPassword(formData).unwrap()
            toast.success(result?.message || 'Password reset successfully', { id: toastId })
            router.push('/auth/sign-in')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error?.data?.message || 'Password reset failed', { id: toastId })
        }
    }

    return (
        <Container className="max-w-md">
            <div className="text-center mb-10 space-y-1">
                <Title>Set new password</Title>
                <Subtitle>Your new password must be different to previously used passwords.</Subtitle>
            </div>

            <CustomForm 
                onSubmit={handleSubmit} 
                defaultValues={defaultValues} 
                className="rounded-lg border border-border p-6 space-y-6"
            >
                <div className="space-y-4">
                    {/* New Password Field */}
                    <CustomInput
                        required
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        label="New Password"
                        placeholder="Enter new password"
                        Icon={<HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} size={16} />}
                        RightIcon={showPassword ? <HugeiconsIcon icon={ViewIcon} strokeWidth={2} size={16} /> : <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} size={16} />}
                        onRightIconClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                    />

                    {/* Confirm Password Field */}
                    <CustomInput
                        required
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        label="Confirm Password"
                        placeholder="Confirm new password"
                        Icon={<HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} size={16} />}
                        RightIcon={showConfirmPassword ? <HugeiconsIcon icon={ViewIcon} strokeWidth={2} size={16} /> : <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} size={16} />}
                        onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                    />
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                {/* Back to Sign In */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <Link href="/auth/sign-in">
                            <Button variant="link" className="px-0 text-sm text-primary" disabled={isLoading}>
                                Sign in
                            </Button>
                        </Link>
                    </p>
                </div>
            </CustomForm>
        </Container>
    )
}