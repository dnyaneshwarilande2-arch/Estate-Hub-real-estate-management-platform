import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-10">
      <div className="divider-glow absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-6 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          © {new Date().getFullYear()}{" "}
          <span className="gradient-text font-semibold">Dnyaneshwari Lande</span>
          · Made with <Heart size={13} className="text-primary" /> using React
        </p>
      </div>
    </footer>
  );
};

export default Footer;
