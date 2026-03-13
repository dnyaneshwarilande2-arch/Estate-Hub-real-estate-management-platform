import { motion } from "framer-motion";
import { Calendar, Users, Globe, ChevronRight } from "lucide-react";

const participations = [
  {
    icon: Globe,
    title: "Web Development Workshop",
    description: "Participated in an intensive workshop on modern web technologies including React, REST APIs, and responsive design.",
    tag: "Workshop",
  },
  {
    icon: Users,
    title: "College Tech Fest",
    description: "Represented the department in the annual tech fest, building and presenting a live web application project.",
    tag: "Event",
  },
  {
    icon: Calendar,
    title: "Online Coding Challenges",
    description: "Actively participated in coding challenges on platforms like HackerRank and LeetCode to sharpen problem-solving skills.",
    tag: "Competitive",
  },
];

const ParticipationSection = () => {
  return (
    <section id="participation" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Experience</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            My <span className="gradient-text">Participation</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-5">
          {participations.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              whileHover={{ x: 6 }}
              className="glass rounded-2xl p-6 md:p-7 flex items-start gap-5 group hover:glow-sm transition-all duration-300 card-shine"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <item.icon className="text-primary" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[11px] font-mono tracking-wide">
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors flex-shrink-0 mt-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ParticipationSection;
