import Image from "next/image";

export default function Home() {
  return (
    <div className="relative font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 overflow-hidden">
      {/* Checkered background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Logo */}
        <div className="relative w-[300px] h-[80px] sm:w-[350px] sm:h-[90px]">
          <Image
            className="block dark:hidden"
            src="/pixurebyte-full-light.png"
            alt="Pixurebyte logo (light)"
            fill
            priority
            style={{ objectFit: "contain" }}
          />
          <Image
            className="hidden dark:block"
            src="/pixurebyte-full-dark.png"
            alt="Pixurebyte logo (dark)"
            fill
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Welcome to Pixurebyte
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground max-w-xl text-center sm:text-left">
          Pixurebyte makes the web searchable, scannable, and shareable — instantly.
        </p>

        {/* Actions */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-transparent transition-colors flex items-center justify-center bg-foreground text-background font-medium text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 sm:w-auto"
            href="/login"
          >
            Login
          </a>
          <a
            className="rounded-full border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto md:w-[158px]"
            href="/sign-up"
          >
            Sign up
          </a>
        </div>
      </main>
    </div>
  );
}
