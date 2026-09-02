import { CitizenHeader, Footer } from "@/components/layout";

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <CitizenHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
