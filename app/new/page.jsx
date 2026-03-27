export default function FukukoCorporateHomepage() {
  const companyInfo = [
    ["会社名", "福高国際貿易株式会社"],
    ["代表者", "代表取締役社長　陳 良鈿"],
    ["所在地", "千葉県船橋市湊町2丁目15-21 谷ビル2階"],
    ["資本金", "500万円"],
    ["事業内容", "中華料理店の経営"],
  ];

  const strengths = [
    {
      title: "事業基盤",
      text: "福高国際貿易株式会社は、地域に根ざした事業運営を目指し、飲食事業を通じて安定したサービス提供と持続的な成長を追求しています。",
    },
    {
      title: "店舗運営",
      text: "現在、当社は中華料理店『麻辣家族』を展開し、本格的な味わいと日常利用のしやすさを両立した店舗づくりに取り組んでいます。",
    },
    {
      title: "将来展望",
      text: "まずは既存店舗の安定運営とブランド基盤の確立を進め、今後の発展に向けて着実な事業成長を図ってまいります。",
    },
  ];

  const presidentProfile = [
    ["氏名", "陳 良鈿（CHEN LIANGXI）"],
    ["国籍", "中国"],
    ["生年月日", "1973年4月27日"],
    ["経営経験", "飲食・小売・現場管理を中心に約15年4カ月"],
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-red-50" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div>
              
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                地域に根ざし、
                <br className="hidden md:block" />
                食を通じて価値を創る。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
                福高国際貿易株式会社は、飲食事業を中心に、誠実な経営と着実な事業運営を大切にする企業です。
                現在は中華料理店「麻辣家族」を展開し、地域の皆さまに親しまれる店舗づくりを進めています。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#company" className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                  会社概要を見る
                </a>
                <a href="#president" className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100">
                  代表取締役社長紹介へ
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-neutral-900 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">企業理念</p>
              <p className="mt-4 text-2xl font-bold leading-10">
                信頼を礎に、
                持続的な成長を実現する。
              </p>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                地域社会とのつながりを大切にしながら、安定した経営基盤の構築と、継続的な事業価値の向上を目指します。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="company" className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">会社情報</p>
            <h2 className="mt-3 text-3xl font-bold">会社概要</h2>
            <p className="mt-5 text-sm leading-8 text-neutral-600 md:text-base">
              福高国際貿易株式会社は、飲食事業を主軸として、地域社会に根ざした価値の創出を目指す企業です。
              現在は千葉県船橋市を拠点に、中華料理店「麻辣家族」を運営し、安定した店舗経営と中長期的な事業基盤の構築を進めています。
            </p>
          </div>

          <div className="rounded-3xl bg-red-50 p-8 ring-1 ring-red-100">
            <dl className="space-y-4">
              {companyInfo.map(([label, value]) => (
                <div key={label} className="border-b border-red-100 pb-4 last:border-none">
                  <dt className="text-sm font-medium text-neutral-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold leading-7 text-neutral-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 md:px-10 md:py-4">
          <div className="grid gap-6 md:grid-cols-3">
            {strengths.map((item) => (
              <div key={item.title} className="rounded-3xl bg-neutral-50 p-7 shadow-sm ring-1 ring-neutral-200">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="president" className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">代表取締役社長</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">代表取締役社長紹介</h2>
              <p className="mt-5 text-sm leading-8 text-neutral-300 md:text-base">
                代表取締役社長・陳 良鈿は、中国および日本において、投資顧問、貿易、飲食店運営、現場管理など多岐にわたる実務経験を積み、約15年4カ月にわたる管理業務経験を有しています。
                現場理解に基づく実践的な経営視点を強みとし、安定した店舗運営と着実な事業成長を推進しています。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <dl className="space-y-4">
                {presidentProfile.map(([label, value]) => (
                  <div key={label} className="border-b border-white/10 pb-4 last:border-none">
                    <dt className="text-sm font-medium text-neutral-400">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold leading-7 text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">事業内容</p>
            <h2 className="mt-3 text-3xl font-bold">事業紹介</h2>
            <p className="mt-5 text-sm leading-8 text-neutral-600 md:text-base">
              当社の主たる事業は、中華料理店の経営です。現在展開する「麻辣家族」では、本格的な中華料理の魅力と日常利用のしやすさを両立させ、地域のお客様に親しまれる店舗づくりを進めています。
            </p>
            <p className="mt-4 text-sm leading-8 text-neutral-600 md:text-base">
              営業はランチ・ディナーの二部制を基本とし、幅広い来店ニーズに対応できる体制を整備しています。今後も、品質・接客・運営体制の向上に継続して取り組み、企業価値の向上を図ってまいります。
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-8 ring-1 ring-neutral-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">店舗ブランド</p>
            <h2 className="mt-3 text-2xl font-bold">麻辣家族</h2>
            <p className="mt-5 text-sm leading-8 text-neutral-600">
              福高国際貿易株式会社が展開する中華料理店ブランドです。本格的な中華の魅力と、日常使いしやすい親しみやすさを両立し、地域に愛される店舗運営を目指しています。
            </p>
            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <p className="text-sm font-medium text-neutral-500">店舗所在地</p>
              <p className="mt-1 text-sm font-semibold leading-7 text-neutral-900">千葉県船橋市湊町2丁目15-21 谷ビル2階</p>
              <p className="mt-4 text-sm font-medium text-neutral-500">営業時間</p>
              <p className="mt-1 text-sm font-semibold leading-7 text-neutral-900">11:00–15:00 / 17:00–21:00</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center md:px-10">
          <p className="text-lg font-semibold">福高国際貿易株式会社</p>
          <p className="mt-2 text-sm text-neutral-500">誠実な経営を礎に、地域とともに持続的な成長を目指します。</p>
        </div>
      </section>
    </div>
  );
}
