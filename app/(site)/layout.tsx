import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/** Main site chrome (header and footer). Proposal pages live outside this group and skip it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
