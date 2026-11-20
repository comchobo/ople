import type { ReactNode } from "react";

export function PolicyArticle({
  title,
  effective,
  sections,
  children,
}: {
  title: string;
  effective: string;
  sections: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <main className="flex-1">
      <div className="page-shell py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-[120px] border-t border-ink pt-4">
              <p className="folio mb-3">Contents</p>
              <nav aria-label="문서 목차">
                <ol className="space-y-1.5 text-[12px] leading-relaxed text-muted">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        className="flex min-h-11 items-center pl-0 hover:text-ink hover:underline hover:decoration-rule-strong hover:underline-offset-4"
                        href={`#${section.id}`}
                      >
                        {String(index + 1).padStart(2, "0")} {section.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>
          <article className="mx-auto w-full max-w-[760px] pb-10 font-serif text-ink-soft [&>section]:mt-10 [&>section]:border-t [&>section]:border-rule [&>section]:pt-6 [&_a]:text-ink [&_a]:underline [&_a]:decoration-rule-strong [&_a]:underline-offset-4 [&_a]:hover:decoration-ink [&_h1]:mb-2 [&_h1]:font-sans [&_h1]:text-[clamp(2rem,4vw,3rem)] [&_h1]:leading-[1.1] [&_h1]:font-extrabold [&_h1]:tracking-[-0.04em] [&_h1]:text-balance [&_h1]:text-ink [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-[22px] [&_h2]:leading-[1.35] [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_h2]:text-ink [&_li+li]:mt-2 [&_p+p]:mt-4 [&_p]:text-[16px] [&_p]:leading-[1.9] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-[1.9]">
            <h1>{title}</h1>
            <p className="text-[13px] text-muted">시행일: {effective}</p>
            {children}
          </article>
        </div>
      </div>
    </main>
  );
}
