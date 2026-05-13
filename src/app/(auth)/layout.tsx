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
          src="/logo441x245.png"
          alt="Velos"
          width={220}
          height={122}
          className="h-14 w-auto object-contain"
          priority
        />
      </div>
      {children}
    </div>
  );
}
