"use client";

import { useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import Loading from "@/components/loader";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loading />
        </div>
      )}

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            PixureByte
            </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm loading={loading} setLoading={setLoading} />
          </div>
        </div>
      </div>

      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/splash.jpg"
          alt="Login background"
          fill
          priority
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
