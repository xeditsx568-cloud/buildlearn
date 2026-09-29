"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[300px] items-center justify-center rounded-md border border-input bg-muted/30 text-sm text-muted-foreground"
      role="status"
    >
      Loading editor…
    </div>
  ),
});

type MonacoHtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export function MonacoHtmlEditor({
  value,
  onChange,
  ariaLabel,
}: MonacoHtmlEditorProps) {
  return (
    <div className="overflow-hidden rounded-md border border-input">
      <MonacoEditor
        height="300px"
        language="html"
        theme="vs-light"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          ariaLabel,
        }}
      />
    </div>
  );
}
