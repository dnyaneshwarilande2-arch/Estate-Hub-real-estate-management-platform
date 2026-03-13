import { motion } from "framer-motion";
import { Code, Layout, Database, Globe, GitBranch, Palette, FileCode, Monitor } from "lucide-react";

const skills = [
  { name: "HTML5", icon: FileCode, level: 90 },
  { name: "CSS3", icon: Palette, level: 85 },
  { name: "JavaScript", icon: Code, level: 85 },
  { name: "React", icon: Monitor, level: 80 },
  { name: "Supabase", icon: Database, level: 70 },
  { name: "Tailwind CSS", icon: Layout, level: 80 },
  { name: "Git & GitHub", icon: GitBranch, level: 75 },
  { name: "Responsive Design", icon: Globe, level: 90 },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Expertise</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            My <span className="gradient-text">Skills</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              whileHover={{ y: -8 }}
              className="glass rounded-2xl p-6 text-center group hover:glow-sm transition-all duration-300 cursor-default card-shine gradient-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <skill.icon className="text-primary" size={22} />
              </div>
              <h3 className="text-foreground font-semibold text-sm mb-3 group-hover:text-primary transition-colors">
                {skill.name}
              </h3>
              <div className="w-full bg-secondary rounded-full h-1.5 mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${skill.level}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                />
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {skill.level}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
