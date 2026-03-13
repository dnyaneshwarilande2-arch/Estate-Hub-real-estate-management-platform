import { motion } from "framer-motion";
import { ExternalLink, Github, Folder } from "lucide-react";

const projects = [
  {
    title: "E-Commerce Website",
    description:
      "A full-featured e-commerce platform with category filtering, product search, user authentication, and a responsive shopping experience powered by Supabase.",
    techStack: ["React", "JavaScript", "Supabase", "CSS"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "Portfolio Website",
    description:
      "A sleek, responsive portfolio website showcasing projects and skills with smooth animations, dark theme, and modern glassmorphism design.",
    techStack: ["React", "Tailwind CSS", "Framer Motion"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "Task Manager App",
    description:
      "A clean task management application with CRUD operations, status tracking, and a minimal UI for organizing daily tasks efficiently.",
    techStack: ["React", "JavaScript", "CSS"],
    liveUrl: "#",
    githubUrl: "#",
  },
];

const ProjectsSection = () => {
  return (
    <section id="projects" className="py-28 relative section-alt">
      <div className="divider-glow absolute top-0 left-0 right-0" />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-3">Portfolio</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            My <span className="gradient-text">Projects</span>
          </h2>
          <div className="w-12 h-1 bg-primary/60 mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="glass rounded-2xl flex flex-col group hover:glow-sm transition-all duration-300 card-shine overflow-hidden"
            >
              {/* Header accent */}
              <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
              
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Folder className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-[11px] font-mono rounded-lg bg-primary/8 text-primary/80 border border-primary/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-5 pt-4 border-t border-border/50">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    <ExternalLink size={15} />
                    Live Demo
                  </a>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github size={15} />
                    Source
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
