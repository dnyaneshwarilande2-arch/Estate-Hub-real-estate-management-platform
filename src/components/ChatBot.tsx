import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Building2, User, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export const ChatBot = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize/Update welcome message when language changes or on mount
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: '1',
                text: t('chatbot.welcome'),
                sender: 'bot',
                timestamp: new Date(),
            }]);
        }
    }, [i18n.language, t, messages.length]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            const botResponse = getBotResponse(inputValue);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const getBotResponse = (input: string) => {
        const text = input.toLowerCase();

        // Simple keyword matching that works across languages if user types in English 
        // OR basic native keywords
        const isPrice = text.includes('price') || text.includes('cost') || text.includes('किंमत') || text.includes('कीमत') || text.includes('விலை') || text.includes('ధర');
        const isContact = text.includes('contact') || text.includes('owner') || text.includes('admin') || text.includes('संपर्क');
        const isLocation = text.includes('location') || text.includes('city') || text.includes('where') || text.includes('शहर');
        const isHello = text.includes('hello') || text.includes('hi') || text.includes('नमस्ते') || text.includes('नमस्कार') || text.includes('வணக்கம்');

        if (isPrice) {
            return t('chatbot.responses.prices');
        }
        if (isContact) {
            return t('chatbot.responses.contact');
        }
        if (isLocation) {
            return t('chatbot.responses.location');
        }
        if (isHello) {
            return t('chatbot.responses.hello');
        }
        return t('chatbot.responses.fallback');
    };

    return (
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
            {/* Chat Window */}
            <div
                className={cn(
                    "mb-4 w-[380px] sm:w-[420px] transition-all duration-500 origin-bottom-left transform",
                    isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-20 pointer-events-none"
                )}
            >
                <Card className="rounded-[2.5rem] border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden bg-white/80 backdrop-blur-2xl border-2">
                    <CardHeader className="bg-primary p-6 flex flex-row items-center justify-between text-primary-foreground space-y-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
                        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />

                        <div className="relative flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group">
                                <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                                    EstateHub AI
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/70">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 border border-white/20 animate-pulse" />
                                    {t('chatbot.status')}
                                </div>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-white hover:bg-white/20 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div
                            className="h-[450px] overflow-y-auto p-6 scroll-smooth space-y-6 bg-gradient-to-b from-transparent to-primary/5"
                            ref={scrollRef}
                        >
                            <div className="space-y-6">
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex items-end gap-3 max-w-[90%]",
                                            m.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-9 w-9 rounded-xl shrink-0 flex items-center justify-center border-2 shadow-sm transition-transform hover:scale-110",
                                            m.sender === 'user' ? "bg-primary border-primary/20" : "bg-white border-primary/10"
                                        )}>
                                            {m.sender === 'user' ? <User className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 text-primary" />}
                                        </div>
                                        <div
                                            className={cn(
                                                "p-4 rounded-3xl text-sm leading-relaxed font-medium shadow-sm",
                                                m.sender === 'user'
                                                    ? "bg-primary text-white rounded-br-none"
                                                    : "bg-white text-slate-800 rounded-bl-none border border-primary/5"
                                            )}
                                        >
                                            {m.text}
                                            <div className={cn(
                                                "text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-40",
                                                m.sender === 'user' ? "text-right" : "text-left"
                                            )}>
                                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex items-end gap-3 mr-auto max-w-[90%]">
                                        <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center border-2 border-primary/10 bg-white shadow-sm">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="bg-white border border-primary/5 rounded-3xl rounded-bl-none p-4 shadow-sm">
                                            <div className="flex gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                                                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                                                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="p-6">
                        <div className="relative w-full flex items-center gap-3">
                            <Input
                                placeholder={t('chatbot.placeholder')}
                                className="h-14 rounded-2xl border-primary/20 pr-14 bg-primary/5 focus:bg-white focus:ring-primary/20 transition-all pl-6 font-medium placeholder:text-slate-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button
                                size="icon"
                                className="absolute right-1.5 h-11 w-11 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95"
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group relative flex items-center justify-center h-20 w-20 rounded-[2.5rem] bg-primary text-white shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-all duration-500 hover:scale-110 active:scale-95",
                    isOpen ? "rotate-90 bg-slate-900 shadow-slate-900/20" : "hover:rotate-12"
                )}
            >
                <div className="absolute inset-0 rounded-[2.5rem] bg-primary animate-ping opacity-20 group-hover:opacity-0" />
                {isOpen ? (
                    <X className="h-10 w-10" />
                ) : (
                    <MessageCircle className="h-10 w-10" />
                )}
            </button>
        </div>
    );
};
