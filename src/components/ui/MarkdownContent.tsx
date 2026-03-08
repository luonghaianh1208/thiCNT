/**
 * MarkdownContent — shared component for all markdown + KaTeX + table rendering.
 *
 * Fixes:
 *  1. Tables (remark-gfm) — renders markdown pipes as proper HTML tables
 *  2. KaTeX reaction arrows — \rightarrow, \xrightarrow, \ce{} via custom CSS
 *  3. Vietnamese font — forces a Unicode-aware font so diacritics render cleanly
 */
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

interface Props {
  content: string;
  /** If true, wraps in <span> (inline), otherwise uses <div> */
  inline?: boolean;
  /** Extra className for the wrapper */
  className?: string;
}

// Custom table components for styled output
const tableComponents: Components = {
  // Wrap table in a scrollable div
  table: ({ node, ...props }) => (
    <div className="md-table-wrapper overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-indigo-50 text-indigo-900 font-semibold" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="divide-y divide-slate-100" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-slate-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-2.5 text-left font-semibold border-b border-indigo-100 whitespace-nowrap" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-2.5 text-slate-700 border-b border-slate-100" {...props} />
  ),
  // inline code
  code: ({ node, className, children, ...props }) => (
    <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-[0.88em] font-mono" {...props}>
      {children}
    </code>
  ),
  // paragraphs keep natural flow
  p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
};

// Same but p → span (for inline usage like practice questions)
const inlineComponents: Components = {
  ...tableComponents,
  p: ({ node, ...props }) => <span className="leading-relaxed" {...props} />,
};

const REMARK_PLUGINS = [remarkMath, remarkGfm] as any;
const REHYPE_PLUGINS = [[rehypeKatex, {
  // KaTeX options: trust mode allows \htmlClass etc.
  trust: true,
  strict: false,
  // Define common chemistry/physics macros
  macros: {
    "\\ra":   "\\rightarrow",
    "\\la":   "\\leftarrow",
    "\\lra":  "\\leftrightarrow",
    "\\xra":  "\\xrightarrow",
    "\\degC": "^{\\circ}\\text{C}",
    "\\kJ":   "\\text{kJ}",
    "\\mol":  "\\text{mol}",
  },
}]] as any;

export function MarkdownContent({ content, inline = false, className = "" }: Props) {
  return (
    <div
      className={`md-content font-vietnamese ${className}`}
      style={{ fontFamily: "'Be Vietnam Pro', 'Inter', 'Segoe UI', sans-serif" }}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={inline ? inlineComponents : tableComponents}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

/** Inline variant — renders as span, no paragraph breaks */
export function InlineMath({ content }: { content: string }) {
  return <MarkdownContent content={content} inline className="inline" />;
}
