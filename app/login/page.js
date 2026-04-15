import AppShell from "@/components/AppShell";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <AppShell>
      <AuthForm mode="login" />
    </AppShell>
  );
}
