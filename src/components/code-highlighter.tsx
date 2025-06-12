import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import React from "react";
import { type Element, isInlineCode, useShikiHighlighter } from "react-shiki";

import { Button } from "./ui/button";
import { useTheme } from "next-themes";

interface CodeHighlightProps {
  className?: string | undefined;
  children?: ReactNode | undefined;
  node?: Element | undefined;
}

export const CodeHighlight = React.memo(
  ({ className, children, node, ...props }: CodeHighlightProps) => {
    const { resolvedTheme } = useTheme();

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const code = String(children).trim();
    const language = className?.match(/language-(\w+)/)?.[1];

    const isInline = node ? isInlineCode(node) : false;

    const highlightedCode = useShikiHighlighter(
      code,
      language,
      resolvedTheme === "dark" ? "vesper" : "vitesse-light",
    );

    const [state, setState] = React.useState<"idle" | "copy-success">("idle");
    const timeoutRef = React.useRef<number>(-1);

    return !isInline ? (
      <div className="overflow-hidden rounded-lg">
        <div className="bg-muted flex items-center justify-between p-1">
          {language && (
            <span className="mx-3 text-xs tracking-tighter">{language}</span>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              await navigator.clipboard.writeText(`${code}`).catch(() => {
                prompt(
                  "Failed to copy to clipboard, CTRL+C this manually:",
                  `${code}`,
                );
              });

              setState("copy-success");

              if (timeoutRef.current !== -1) {
                clearTimeout(timeoutRef.current);
              }

              timeoutRef.current = window.setTimeout(() => {
                setState("idle");
              }, 2000);
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {state === "idle" ? (
                <motion.div
                  key="idle"
                  variants={VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CopyIcon />
                </motion.div>
              ) : (
                <motion.div
                  key="copy-success"
                  variants={VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CheckIcon className="text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
        <div className="shiki not-prose text-sm [&_pre]:overflow-auto [&_pre]:px-6 [&_pre]:py-5">
          {highlightedCode}
        </div>
      </div>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
);
CodeHighlight.displayName = "CodeHighlight";

const VARIANTS = {
  initial: {
    opacity: 0,
    scale: 0.25,
    filter: "blur(2px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 0.25,
    filter: "blur(2px)",
  },
};
