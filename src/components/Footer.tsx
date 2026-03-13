import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-white/10 bg-slate-950 text-slate-300 py-16">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-16">
                    <div className="space-y-4">
                        <Logo isDark />
                        <p className="text-sm text-slate-400 leading-relaxed mt-4">
                            We provide the most comprehensive platform for property matching and management. Your journey to the perfect home starts here.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Facebook className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Instagram className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                <Linkedin className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-display text-lg font-bold mb-6 text-white">Quick Links</h3>
                        <ul className="space-y-4">
                            {['Home', 'Properties', 'Sell', 'Dashboard', 'About Us'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center group"
                                    >
                                        <span className="h-1 w-1 rounded-full bg-primary/40 mr-2 group-hover:bg-primary group-hover:w-2 transition-all" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-display text-lg font-bold mb-6 text-white">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-slate-400">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <span>123 Real Estate Ave, Building 456, Beverly Hills, CA 90210</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-400">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-400">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>contact@estatehub.com</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="font-display text-lg font-bold mb-6 text-white">Newsletter</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Subscribe to get latest property updates and market insights.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            />
                            <Button size="sm" className="rounded-xl px-4">Join</Button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>© {currentYear} EstateHub. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="#" className="hover:text-white transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
