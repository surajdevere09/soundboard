/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/auth/login");
    }
  }, [user]);

  // You can show a loading state here if desired
  if (!user) return null;

  return <>{children}</>;
}
