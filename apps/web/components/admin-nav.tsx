import Link from "next/link";
export function AdminNav(){return <nav className="border-b border-line bg-surface"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><span className="font-semibold">Administration</span><div className="flex gap-5 text-sm"><Link href="/admin">Dashboard</Link><Link href="/admin/users">Users</Link></div></div></nav>}
