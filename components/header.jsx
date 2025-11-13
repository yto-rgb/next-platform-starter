import Image from 'next/image';
import Link from 'next/link';
import netlifyLogo from 'public/netlify-logo.svg';

const navItems = [
    {
        linkText: 'Home',
        href: '/',
        description: 'ホームページに戻る',
        icon: '🏠',
    },
    {
        linkText: '業者地域分け',
        href: '/wakei',
        description: '地域別業者情報',
        icon: (
            <svg fill="#000000" height="64px" width="64px" viewBox="0 0 32 32">
                <path d="M25,3H11C9.9,3,9,3.9,9,5v10.6c1.2-0.4,2.5-0.6,3.9-0.6H19c1.6,0,3,1.3,3,2.9l0,0.2c0,0.1,0,0.1,0,0.2
                c1.3-1.6,3.1-2.7,5-3.1V5C27,3.9,26.1,3,25,3z M23.7,9.8c-0.2,0.2-0.4,0.3-0.7,0.3c-0.3,0-0.5-0.1-0.7-0.3L22,9.5V12
                c0,0.6-0.4,1-1,1s-1-0.4-1-1V9.5l-0.3,0.3c-0.4,0.4-1,0.4-1.4,0c-0.4-0.4-0.4-1,0-1.4l2-2.1c0.4-0.4,1.1-0.4,1.5,0l2,2.1
                C24.1,8.8,24.1,9.5,23.7,9.8z"></path>
                <path d="M29.9,17.5C29.7,17.2,29.4,17,29,17c-2.2,0-4.3,1-5.6,2.8L22.5,21c-1.1,1.3-2.8,2-4.5,2h-3c-0.6,0-1-0.4-1-1
                s0.4-1,1-1h1.9c1.6,0,3.1-1.3,3.1-2.9c0,0,0-0.1,0-0.1c0-0.5-0.5-1-1-1l-6.1,0c-3.6,0-6.5,1.6-8.1,4.2l-2.7,4.2
                c-0.2,0.3-0.2,0.7,0,1l3,5c0.1,0.2,0.4,0.4,0.6,0.5c0.1,0,0.1,0,0.2,0c0.2,0,0.4-0.1,0.6-0.2c3.8-2.5,8.2-3.8,12.7-3.8
                c3.3,0,6.3-1.8,7.9-4.7l2.7-4.8C30,18.2,30,17.8,29.9,17.5z"></path>
            </svg>
        ),
    },
    {
        linkText: '賠償',
        href: '/baichang',
        description: '賠償関連情報',
        icon: (
            <svg viewBox="0 0 1024 1024" fill="#000000" width="64" height="64">
                <path d="M865.01 599.07c-30.39-16.39-67.2-14.82-96.07 4.18l-194.73 128h-38.49c8.11-16.83 13.04-35.45 13.04-55.34v-54.59H292.57v-72.93H109.72v402.47h182.86v-36.57h339.9l238.79-153.77c26.95-17.36 43.04-46.84 43.04-78.88a93.778 93.778 0 0 0-49.3-82.57zM219.43 877.71h-36.57V621.53h36.57v256.18z m612.22-178.67l-220.68 142.1h-318.4V694.46h179.85c-7.64 21.39-28.12 36.75-52.11 36.75h-54.2v0.04h-0.71v73.14h230.7l213.02-140.04c9.34-6.11 17.89-2.64 21.18-0.91 3.27 1.77 10.86 7.07 10.86 18.2a20.652 20.652 0 0 1-9.51 17.4zM378.87 502.62c-20.45-35.7-31.25-76.48-31.25-117.91 0-131.07 106.6-237.71 237.66-237.71 131.04 0 237.64 106.64 237.64 237.71 0 41.46-10.8 82.25-31.27 117.95l63.46 36.36c26.79-46.75 40.95-100.11 40.95-154.3 0-171.41-139.41-310.86-310.79-310.86s-310.8 139.45-310.8 310.86c0 54.16 14.14 107.5 40.93 154.27l63.47-36.37z" fill="#0F1F3C"></path>
                <path d="M668.79 244.79l-83.51 83.53-83.54-83.53-38.79 38.78 64.67 64.66h-54.67v54.86h84.9v35.45h-82.38v54.85h82.38v79.59h54.85v-79.59h82.36v-54.85H612.7v-35.45h84.88v-54.86h-54.65l64.65-64.66z" fill="#0F1F3C"></path>
            </svg>
        ),
    },
    {
        linkText: '不在票',
        href: '/buzaipiao',
        description: '不在票記録表',
        icon: '💰',
    },
    {
        linkText: 'ヤマトデータ',
        href: '/yamatodate',
        description: 'ヤマトデータ予定確定データ',
        icon: '💰',
    },
];

export function Header() {
    return (
        <div className="pt-6 pb-12 sm:pt-12 md:pb-24">
            {/* Logo Section */}
            <div className="mb-8">
                <Link href="/">
                    <Image src={netlifyLogo} alt="Netlify logo" />
                </Link>
            </div>

            {/* Card Grid */}
            {!!navItems?.length && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {navItems.map((item, index) => (
                        <Link key={index} href={item.href} className="group block">
                            <div className="h-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 hover:-translate-y-1">
                                {/* Icon */}
                                <div className="text-xs mb-3">{item.icon}</div>

                                {/* Title */}
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {item.linkText}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-600">{item.description}</p>

                                {/* Arrow indicator */}
                                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>詳しく見る</span>
                                    <svg
                                        className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
