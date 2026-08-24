import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
