'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquareText } from 'lucide-react';

export function Navigation() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Campaigns', href: '/', icon: LayoutDashboard },
        { name: 'Templates', href: '/templates', icon: MessageSquareText },
    ];

    return (
        <nav className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <span className="text-emerald-500 font-mono font-bold text-xl tracking-widest">&gt;_clicker12</span>
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-4">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`
                        flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive
                                                    ? 'bg-slate-800 text-white'
                                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                      `}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
