"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await signOut();
        router.replace("/login/");
      }}
    >
      Sign out
    </Button>
  );
}
