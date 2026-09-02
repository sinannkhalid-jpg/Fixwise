import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Fixwise — AI-Powered Civic Complaint Management",
  description:
    "Report civic issues, track resolution, and help your municipality prioritize what matters. AI-powered citizen complaint management and civic intelligence platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
