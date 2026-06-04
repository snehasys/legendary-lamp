import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-20 text-center">
        <h1 className="font-display font-bold text-6xl text-muted-foreground/30 mb-4">404</h1>
        <h2 className="font-display font-semibold text-xl mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          ← Back to Home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
