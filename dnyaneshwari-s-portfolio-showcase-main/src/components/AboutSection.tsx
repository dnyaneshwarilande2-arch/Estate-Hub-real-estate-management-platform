import { motion } from "framer-motion";
import { Code2, Sparkles, Zap, Heart } from "lucide-react";

const highlights = [
  { icon: Code2, label: "Clean Code" },
  { icon: Zap, label: "Fast Delivery" },
  { icon: Heart, label: "Pixel Perfect" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-28 relative section-alt">
      <div className="divider-glow absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Introduction</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            About <span className="gradient-text">Me</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-3xl p-8 md:p-12 glow card-shine"
          >
            <p className="text-secondary-foreground leading-relaxed mb-5 text-base md:text-lg">
              I'm a passionate Frontend Developer with a strong foundation in building modern, 
              responsive web applications. I specialize in creating intuitive user interfaces 
              using <span className="text-primary font-semibold">React</span>, 
              <span className="text-primary font-semibold"> JavaScript</span>, and 
              <span className="text-primary font-semibold"> CSS</span>, while leveraging 
              <span className="text-primary font-semibold"> Supabase</span> for backend services.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-8">
              I focus on writing clean, maintainable code and delivering polished user experiences. 
              I'm always learning new technologies and staying up-to-date with the latest trends in 
              frontend development. My goal is to build products that are both beautiful and functional.
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap gap-3 mb-6">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm"
                >
                  <h.icon size={16} className="text-primary" />
                  <span className="text-secondary-foreground font-medium">{h.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-primary text-sm font-mono">
              <Sparkles size={16} />
              <span>Open to opportunities & collaborations</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
