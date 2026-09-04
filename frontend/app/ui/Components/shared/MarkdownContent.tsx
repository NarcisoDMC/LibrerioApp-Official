import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renderiza sinopsis markdown de Open Library con la paleta del proyecto;
// el HTML del contenido viaja como texto plano (nunca se inyecta como HTML)
export default function MarkdownContent({ content }: { content: string }) {
    return (
        <div className="text-sm leading-relaxed text-gray-700">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="mt-4 text-xl font-bold text-[#4a348c]">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mt-4 text-lg font-bold text-[#4a348c]">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mt-3 text-base font-semibold text-[#4a348c]">{children}</h3>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-[#4a348c]">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8553d1] underline decoration-[#8553d1]/40 underline-offset-2 hover:text-[#c765dc]"
                        >
                            {children}
                        </a>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc space-y-1 pl-5 marker:text-[#8553d1]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal space-y-1 pl-5 marker:text-[#8553d1]">{children}</ol>
                    ),
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[#8553d1] pl-4 text-gray-500 italic">
                            {children}
                        </blockquote>
                    ),
                    code: ({ children }) => (
                        <code className="rounded bg-[#f1e6f9] px-1.5 py-0.5 font-mono text-sm text-[#8553d1]">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="overflow-x-auto rounded-lg bg-[#f1e6f9]/60 p-3 text-sm">{children}</pre>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-[#8553d1]/30 bg-[#f1e6f9]/60 px-3 py-1.5 text-left font-bold text-[#4a348c]">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-[#8553d1]/30 px-3 py-1.5 text-gray-700">{children}</td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
