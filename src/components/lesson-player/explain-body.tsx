function formatLine(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

type ExplainBodyProps = {
  body: string;
};

/** Minimal formatting for lesson explain blocks (paragraphs + bold). */
export function ExplainBody({ body }: ExplainBodyProps) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");
        return (
          <p
            key={index}
            className="text-foreground"
            dangerouslySetInnerHTML={{
              __html: lines.map((line) => formatLine(line)).join("<br />"),
            }}
          />
        );
      })}
    </div>
  );
}
