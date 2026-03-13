import { motion } from "framer-motion";
import { ArrowDown, FileDown, User, MapPin, Briefcase } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
            className="flex-shrink-0"
          >
            <div className="relative">
              <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border-2 border-primary/30 overflow-hidden bg-secondary/50 flex items-center justify-center glow">
                <User className="text-muted-foreground/60" size={90} />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border border-primary/10 animate-[spin_20s_linear_infinite]" />
              <div className="absolute -inset-6 rounded-full border border-primary/5" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="text-center md:text-left max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs tracking-widest uppercase mb-5"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Available for hire
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 gradient-text glow-text leading-tight"
            >
              Dnyaneshwari
              <br />
              Lande
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-primary" />
                Frontend Developer
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                India
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="text-muted-foreground mb-8 text-base md:text-lg leading-relaxed"
            >
              I craft clean, responsive, and user-friendly web experiences using modern technologies like React, JavaScript, and Supabase.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row items-center md:items-start gap-4"
            >
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:shadow-[0_0_24px_hsl(175_85%_50%/0.35)] transition-all duration-300"
              >
                View My Work
                <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl glass text-foreground font-semibold hover:bg-primary/10 transition-all duration-300"
              >
                <FileDown size={18} />
                Download Resume
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="p-2 rounded-full border border-primary/20">
          <ArrowDown className="text-primary/60" size={20} />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
