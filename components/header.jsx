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
        linkText: 'CAINIAO個数データ',
        href: '/cainiaodate',
        description: '表1と表2から表3 Excel を生成',
        icon: 'CA',
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
