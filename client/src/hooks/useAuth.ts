// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("http://localhost:7002/api/auth/user", {
        credentials: "include", // allow cookies to be sent
      });

      console.log(res)

      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
