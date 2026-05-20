import Link from 'next/link';
import '../styles/globals.css';

export const metadata = {
    title: {
        template: '%s | Work Tools',
        default: 'Work Tools'
    },
    description: 'Simple internal tools for daily work.'
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
                <div className="flex min-h-screen flex-col">
                    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <Link href="/" className="nav-link flex items-center gap-3 no-underline">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                                        WT
                                    </span>
                                    <span>
                                        <span className="block text-base font-bold leading-5">Work Tools</span>
                                        <span className="block text-xs text-slate-500">工具台</span>
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1">{children}</div>
                </div>
            </body>
        </html>
    );
}
