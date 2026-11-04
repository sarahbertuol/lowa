import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site">
      <Link className="logo" href="/">
        LoWa <em>Studio</em>
      </Link>
      <span>US agencies · AI-built websites · Fixed price</span>
      <span>* Free hosting terms to be confirmed</span>
    </footer>
  );
}
