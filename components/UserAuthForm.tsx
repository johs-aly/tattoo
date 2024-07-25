"use client";

import { signIn } from "next-auth/react";
import * as React from "react";

import { Icons } from "@/components/Icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserInfo } from "@/types/user";
import { useRouter } from "next/navigation";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: UserInfo;
}

export function UserAuthForm({ className, user, ...props }: UserAuthFormProps) {
  const [isGitHubLoading, setIsGitHubLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const router = useRouter();

  const login = async (platform: string) => {
    // user已登录，返回首页
    if (user && user.userId) {
      router.push("/");
      return;
    }
    if (platform === "github") {
      setIsGitHubLoading(true);
    }
    if (platform === "google") {
      setIsGoogleLoading(true);
    }
    signIn(platform, {
      callbackUrl: `${window.location.origin}/api/auth/callback/google`,
    });
  };

  return (
    <div className={cn("grid gap-4", className)} {...props}>
      <button
        type="button"
        className={cn(buttonVariants())}
        onClick={() => login("google")}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </button>
    </div>
  );
}
