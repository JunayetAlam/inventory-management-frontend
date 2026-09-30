'use client'

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon, LockPasswordIcon, Mail01Icon, Call02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button"
import CustomForm from "../Forms/CustomForm"
import CustomInput from "../Forms/CustomInput"
import Container from "../Global/Container"
import Title from "../Global/Title"
import Subtitle from "../Global/Subtitle"
import { FieldValues } from "react-hook-form"
import Link from "next/link"
import { toast } from "sonner"
import { useSignUpMutation } from "@/redux/api/userApi"
import { useRouter } from "next/navigation"

const defaultValues = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
}

export default function SignUp() {
    const [signUp, { isLoading }] = useSignUpMutation()
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [agreeToTerms] = useState(true)

    const handleSubmit = async (data: FieldValues) => {
        if (data.password !== data.confirmPassword) {
            toast.error('Password not matched')
            return
        }

        if (!agreeToTerms) {
            toast.error('Please agree to the Terms of Service and Privacy Policy')
            return
        }

        const formData = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: data.password,
            phoneNumber: data.phoneNumber,
            isAgreeWithTerms: agreeToTerms,
        }

        const toastId = toast.loading('Creating your account...')
        try {
            const result = await signUp(formData).unwrap()
            toast.success(result?.message, { id: toastId })
           router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error?.data?.message || 'Sign up failed', { id: toastId })
        }
    }

    return (
        <Container className="max-w-3xl">
            <div className="text-center mb-10">
                <Title>Create your account</Title>
                <Subtitle>Create an account to manage products, customers, and invoices.</Subtitle>
            </div>

            <CustomForm onSubmit={handleSubmit} defaultValues={defaultValues} className="rounded-lg border border-border p-6 space-y-6">
                <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomInput
                            required
                            name="firstName"
                            type="text"
                            label="First Name"
                            placeholder="John"
                            Icon={<HugeiconsIcon icon={UserIcon} strokeWidth={2} size={16} />}
                            disabled={isLoading}
                        />
                        <CustomInput
                            required
                            name="lastName"
                            type="text"
                            label="Last Name"
                            placeholder="Doe"
                            Icon={<HugeiconsIcon icon={UserIcon} strokeWidth={2} size={16} />}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 gap-4">
                        <CustomInput
                            required
                            name="email"
                            type="email"
                            label="Email Address"
                            placeholder="your.email@example.com"
                            Icon={<HugeiconsIcon icon={Mail01Icon} strokeWidth={2} size={16} />}
                            disabled={isLoading}
                        />
                        <CustomInput
                            required
                            name="phoneNumber"
                            type="tel"
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            Icon={<HugeiconsIcon icon={Call02Icon} strokeWidth={2} size={16} />}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password and Confirm Password */}
                    <div className="grid grid-cols-1 gap-4">
                        <CustomInput
                            required
                            name="password"
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            placeholder="Enter password"
                            Icon={<HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} size={16} />}
                            RightIcon={showPassword ? <HugeiconsIcon icon={ViewIcon} strokeWidth={2} size={16} /> : <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} size={16} />}
                            onRightIconClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        />
                        <CustomInput
                            required
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            label="Confirm Password"
                            placeholder="Confirm password"
                            Icon={<HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} size={16} />}
                            RightIcon={showConfirmPassword ? <HugeiconsIcon icon={ViewIcon} strokeWidth={2} size={16} /> : <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} size={16} />}
                            onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Terms Checkbox */}
                {/* <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 text-blue-600 mt-1"
                        disabled={isLoading}
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
                        I agree to the{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                    </label>
                </div> */}

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>

                {/* Already have account */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
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