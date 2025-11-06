import Image from 'next/image';
import Link from 'next/link';
import netlifyLogo from 'public/netlify-logo.svg';
import githubLogo from 'public/images/github-mark-white.svg';

const navItems = [
    { 
        linkText: 'Home', 
        href: '/',
        description: 'ホームページに戻る',
        icon: '🏠'
    },
    { 
        linkText: '業者地域分け', 
        href: '/wakei',
        description: '地域別業者情報',
        icon: '📍'
    },
    { 
        linkText: '賠償', 
        href: '/baichang',
        description: '賠償関連情報',
        icon: '💰'
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
                        <Link 
                            key={index}
                            href={item.href}
                            className="group block"
                        >
                            <div className="h-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 hover:-translate-y-1">
                                {/* Icon */}
                                <div className="text-4xl mb-3">
                                    {item.icon}
                                </div>
                                
                                {/* Title */}
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {item.linkText}
                                </h3>
                                
                                {/* Description */}
                                <p className="text-sm text-gray-600">
                                    {item.description}
                                </p>

                                {/* Arrow indicator */}
                                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>詳しく見る</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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