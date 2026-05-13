export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white px-4 py-8">
      {children}
    </div>
  );
}
