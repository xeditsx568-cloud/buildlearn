import Link from "next/link";

const appNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/project", label: "Project" },
  { href: "/build", label: "Build" },
] as const;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            BuildLearn
          </Link>
          <ul className="flex gap-4 text-sm">
            {appNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
