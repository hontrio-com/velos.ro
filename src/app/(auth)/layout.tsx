import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-4 py-8">
      <div className="mb-8">
        <Image
          src="/logo.png"
          alt="Velos"
          width={160}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
      {children}
    </div>
  );
}
