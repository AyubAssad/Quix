import AppShell from "@/components/AppShell";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <AppShell>
      <AuthForm mode="signup" />
    </AppShell>
  );
}
