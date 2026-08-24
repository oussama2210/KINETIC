import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
