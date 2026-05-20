export function CodeBlock({ code, lang, lineNumbers, title }) {
    const lines = String(code ?? '').replace(/\n$/, '').split('\n');

    return (
        <figure className="overflow-hidden rounded-md border border-neutral-700 bg-neutral-950 text-neutral-100">
            {title && (
                <figcaption className="border-b border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300">
                    {title}
                </figcaption>
            )}
            <pre className="overflow-x-auto p-4 text-sm leading-6">
                <code className={lang ? `language-${lang}` : undefined}>
                    {lineNumbers
                        ? lines.map((line, index) => (
                              <span key={index} className="block">
                                  <span className="mr-4 inline-block w-6 select-none text-right text-neutral-500">
                                      {index + 1}
                                  </span>
                                  {line}
                              </span>
                          ))
                        : code}
                </code>
            </pre>
        </figure>
    );
}
