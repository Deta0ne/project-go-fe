export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative h-svh w-full overflow-hidden">{children}</div>
  )
}
