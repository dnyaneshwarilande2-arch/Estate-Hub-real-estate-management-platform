import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    isDark?: boolean;
}

export function Logo({ className, isDark = false }: LogoProps) {
    return (
        <Link to="/" className={cn("flex items-center gap-4 group py-2", className)}>
            <div className="relative h-14 w-14 shrink-0 overflow-visible">
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">

                        {/* The Building Icon */}
                        <g transform="translate(22, 12)">
                            {/* Building 1 (Taller) */}
                            <path
                                d="M 5 60 L 5 10 L 15 2 L 25 10 L 25 60 Z"
                                fill={isDark ? "#ffffff" : "#1e40af"}
                            />
                            {/* Building 2 (Modern Wing) */}
                            <path
                                d="M 28 60 L 28 25 L 48 25 L 48 60 Z"
                                fill={isDark ? "#93c5fd" : "#3b82f6"}
                                opacity="0.9"
                            />

                            {/* Window Details for Building 1 */}
                            <g opacity="0.4">
                                <rect x="9" y="15" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="18" y="15" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="9" y="25" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="18" y="25" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="9" y="35" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="18" y="35" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="9" y="45" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                                <rect x="18" y="45" width="3" height="3" fill={isDark ? "#1e40af" : "#ffffff"} />
                            </g>

                            {/* Accent Line for Building 2 */}
                            <rect x="32" y="30" width="12" height="2" fill={isDark ? "#1e40af" : "#ffffff"} opacity="0.5" />
                            <rect x="32" y="38" width="12" height="2" fill={isDark ? "#1e40af" : "#ffffff"} opacity="0.5" />
                            <rect x="32" y="46" width="12" height="2" fill={isDark ? "#1e40af" : "#ffffff"} opacity="0.5" />
                        </g>

                    </svg>
                </div>
            </div>
            <div className="flex flex-col -gap-1">
                <span className={cn(
                    "font-display text-3xl font-black tracking-tighter leading-none",
                    isDark ? "text-white" : "text-slate-900"
                )}>
                    ESTATE<span className="text-primary italic">HUB</span>
                </span>
                <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.4em] mt-1 pl-0.5",
                    isDark ? "text-slate-400" : "text-slate-400"
                )}>
                    Architecting Your Premier Lifestyle
                </span>
            </div>
        </Link>
    );
}

