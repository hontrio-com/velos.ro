export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F7F8FA] px-4 py-8">
      {children}
    </div>
  );
}
