import Link from 'next/link';

const tools = [
    {
        href: '/adress',
        title: '邮编配送关系表',
        label: 'Excel 转换',
        description: '按邮编和仕分けコード生成配送公司、代理店关系表。',
        accent: 'bg-emerald-500',
        surface: 'bg-emerald-50 text-emerald-800',
        detail: '邮编 / 仕分け / 关系表'
    },
    {
        href: '/cainiaodate',
        title: 'CAINIAO 个数数据',
        label: '月度生成',
        description: '导入明细与月别汇总，自动生成按月份拆分的 Excel。',
        accent: 'bg-teal-500',
        surface: 'bg-teal-50 text-teal-800',
        detail: '表1 / 表2 / 表3'
    },
    {
        href: '/wakei',
        title: 'Excel 数据整理',
        label: '数据处理',
        description: '整理上传表格里的地址、机构与统计数据。',
        accent: 'bg-indigo-500',
        surface: 'bg-indigo-50 text-indigo-800',
        detail: '清洗 / 汇总 / 导出'
    },
    {
        href: '/area',
        title: '关东关西分表',
        label: '地址分类',
        description: '按 C 列地址把原表拆分到关东、关西和未分类 sheet。',
        accent: 'bg-rose-500',
        surface: 'bg-rose-50 text-rose-800',
        detail: 'C 列地址 / 分 sheet'
    }
];

const overview = [
    { label: '可用工具', value: tools.length },
    { label: '主要场景', value: 'Excel' },
    { label: '处理方式', value: '本地浏览器' }
];

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Work Tools
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">内部工具台</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                集中放置日常 Excel 处理工具。选择需要的流程，上传文件后在浏览器内完成转换与导出。
                            </p>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
                            {overview.map((item) => (
                                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="text-xs font-semibold uppercase text-slate-500">{item.label}</div>
                                    <div className="mt-1 text-xl font-bold text-slate-950">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {tools.map((tool) => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="nav-link group flex min-h-64 flex-col rounded-lg border border-slate-200 bg-white p-5 text-slate-950 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className={`h-10 w-1.5 rounded-full ${tool.accent}`} />
                                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tool.surface}`}>{tool.label}</span>
                            </div>

                            <div className="mt-6 flex-1">
                                <h2 className="text-xl font-bold text-slate-950">{tool.title}</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{tool.description}</p>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4">
                                <div className="text-xs font-semibold text-slate-500">{tool.detail}</div>
                                <div className="mt-3 inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition group-hover:border-slate-300 group-hover:bg-slate-50">
                                    打开工具
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            </div>
        </main>
    );
}
