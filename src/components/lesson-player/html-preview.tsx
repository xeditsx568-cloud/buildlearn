"use client";

type HtmlPreviewProps = {
  html: string;
  title?: string;
};

export function HtmlPreview({
  html,
  title = "Code output",
}: HtmlPreviewProps) {
  return (
    <iframe
      title={title}
      sandbox="allow-scripts"
      srcDoc={html}
      className="min-h-[220px] w-full rounded-md border border-input bg-white"
    />
  );
}
