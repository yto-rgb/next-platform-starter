import Link from 'next/link';
import '../styles/globals.css';

export const metadata = {
    title: {
        template: '%s | Work Tools',
        default: 'Work Tools'
    },
    description: 'Internal Excel and operations tools.'
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
                <div className="flex min-h-screen flex-col">
                    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
                        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                            <Link href="/" className="nav-link flex items-center gap-3 no-underline">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white shadow-sm">
                                    WT
                                </span>
                                <span>
                                    <span className="block text-base font-bold leading-5 text-slate-950">Work Tools</span>
                                    <span className="block text-xs font-medium text-slate-500">Excel operations workspace</span>
                                </span>
                            </Link>

                            <div className="hidden items-center gap-2 sm:flex">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    Internal
                                </span>
                                <Link
                                    href="/"
                                    className="nav-link rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white no-underline transition hover:bg-slate-800"
                                >
                                    工具总览
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
