import Link from 'next/link';

const tools = [
    {
        href: '/adress',
        title: '邮编上传转换工具',
        label: '工具',
        description: '按邮编和仕分けコード生成配送公司关系表。',
        accent: 'bg-emerald-600'
    },
    {
        href: '/baichang',
        title: '费用记录',
        label: '记录',
        description: '录入日常费用和付款信息。',
        accent: 'bg-orange-500'
    },
    {
        href: '/wakei',
        title: 'Excel 整理',
        label: '处理',
        description: '整理上传表格里的地址和机构数据。',
        accent: 'bg-indigo-500'
    }
];

export default function Home() {
    return (
        <main className="bg-slate-50 px-4 py-8 text-slate-950 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-8">
                <section className="grid gap-4 md:grid-cols-3">
                    {tools.map((tool) => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="nav-link group rounded-lg border border-slate-200 bg-white p-5 text-slate-950 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className={`h-9 w-1.5 rounded-full ${tool.accent}`} />
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                    {tool.label}
                                </span>
                            </div>
                            <h2 className="mt-5 text-xl font-bold text-slate-950">{tool.title}</h2>
                            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{tool.description}</p>
                            <div className="mt-5 text-sm font-semibold text-emerald-700 transition group-hover:text-emerald-800">
                            
                            </div>
                        </Link>
                    ))}
                </section>


            </div>
        </main>
    );
}
