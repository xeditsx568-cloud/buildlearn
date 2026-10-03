"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { editor } from "monaco-editor";

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
  revealLine?: number | null;
};

export function MonacoHtmlEditor({
  value,
  onChange,
  ariaLabel,
  revealLine,
}: MonacoHtmlEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (revealLine && editorRef.current) {
      editorRef.current.revealLineInCenter(revealLine);
      editorRef.current.setPosition({ lineNumber: revealLine, column: 1 });
      editorRef.current.focus();
    }
  }, [revealLine]);

  return (
    <div className="overflow-hidden rounded-md border border-input">
      <MonacoEditor
        height="300px"
        language="html"
        theme="vs-light"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        onMount={(instance) => {
          editorRef.current = instance;
        }}
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
