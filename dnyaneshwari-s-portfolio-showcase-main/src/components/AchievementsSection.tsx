import { motion } from "framer-motion";
import { Trophy, Award, Star, Medal } from "lucide-react";

const achievements = [
  {
    icon: Trophy,
    title: "NSS VOLUNTEER",
    description: "Won 1st place in a college-level web development hackathon for building a responsive e-commerce prototype.",
    color: "from-amber-400/20 to-amber-600/5",
  },
  {
    icon: Award,
    title: "Top Performer",
    description: "Recognized as a top-performing student in frontend development coursework and projects.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: Star,
    title: "Open Source Contributor",
    description: "Contributed to open-source projects on GitHub, improving documentation and fixing UI bugs.",
    color: "from-violet-400/20 to-violet-600/5",
  },
];

const AchievementsSection = () => {
  return (
    <section id="achievements" className="py-28 relative section-alt">
      <div className="divider-glow absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Recognition</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            My <span className="gradient-text">Achievements</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {achievements.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="glass rounded-2xl p-8 text-center group hover:glow-sm transition-all duration-300 card-shine relative overflow-hidden"
            >
              {/* Gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <item.icon className="text-primary" size={28} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
