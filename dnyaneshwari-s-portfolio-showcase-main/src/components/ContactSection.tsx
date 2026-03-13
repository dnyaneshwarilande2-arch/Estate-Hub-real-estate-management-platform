import { motion } from "framer-motion";
import { Mail, Github, Linkedin, Twitter, Send } from "lucide-react";

const socials = [
  { icon: Mail, label: "Email", href: "mailto:dnyaneshwarilande@gmail.com" },
  { icon: Github, label: "GitHub", href: "https://github.com/" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Contact</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            Get In <span className="gradient-text">Touch</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="glass rounded-3xl p-10 md:p-12 glow">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Send className="text-primary" size={28} />
            </div>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              I'm currently open to new opportunities and collaborations. 
              Feel free to reach out if you'd like to work together or just say hello!
            </p>

            <a
              href="mailto:dnyaneshwarilande@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:shadow-[0_0_24px_hsl(175_85%_50%/0.35)] transition-all duration-300 mb-10"
            >
              <Mail size={18} />
              Say Hello
            </a>

            <div className="divider-glow mb-8" />

            <div className="flex items-center justify-center gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-3.5 rounded-xl bg-secondary/40 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
