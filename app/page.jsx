import Link from 'next/link';

const tools = [
    {
        href: '/adress',
        title: '邮编上传转换工具',
        label: '工具',
        description: '按邮编和仕分けコード生成配送公司关系表。',
        accent: 'bg-emerald-600',
        character: '娜美导航',
        characterClass: 'border-orange-200 bg-orange-50 text-orange-700 group-hover:border-orange-300 group-hover:bg-orange-100'
    },
    {
        href: '/cainiaodate',
        title: 'CAINIAO 个数数据',
        label: '生成',
        description: '导入表1和表2，自动生成表3 Excel。',
        accent: 'bg-teal-600',
        character: '路飞开航',
        characterClass: 'border-red-200 bg-red-50 text-red-700 group-hover:border-red-300 group-hover:bg-red-100'
    },
    {
        href: '/wakei',
        title: 'Excel 整理',
        label: '处理',
        description: '整理上传表格里的地址和机构数据。',
        accent: 'bg-indigo-500',
        character: '罗宾整理',
        characterClass: 'border-violet-200 bg-violet-50 text-violet-700 group-hover:border-violet-300 group-hover:bg-violet-100'
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
                            <div
                                className={`mt-5 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-bold transition ${tool.characterClass}`}
                            >
                                {tool.character}
                            </div>
                        </Link>
                    ))}
                </section>


            </div>
        </main>
    );
}
