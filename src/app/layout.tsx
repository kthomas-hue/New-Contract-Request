import { Bricolage_Grotesque, Onest } from "next/font/google";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { readStore } from "@/lib/db";
import { unreadCount } from "@/lib/workflow";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});

const body = Onest({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relay — Client contract workflows",
  description:
    "Design per-client request forms and approval workflows, from offer to signed contract.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await readStore();
  const currentUser =
    store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
  const unread = unreadCount(store, currentUser.id);

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <AppShell
          users={store.users}
          currentUser={currentUser}
          unread={unread}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
