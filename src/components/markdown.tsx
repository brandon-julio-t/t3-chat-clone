"use client";

import "katex/dist/katex.min.css";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "~/lib/utils";
import { CodeHighlight } from "./code-highlighter";
import { Button } from "./ui/button";

import Link from "next/link";
import { Table, TableCell, TableHead, TableRow } from "./ui/table";

interface MarkdownProps {
  content: string;
}

const Markdown = React.memo<MarkdownProps>(({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        h1: ({ className, ...props }) => (
          <h1 className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        h2: ({ className, ...props }) => (
          <h2 className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        h3: ({ className, ...props }) => (
          <h3 className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        h4: ({ className, ...props }) => (
          <h4 className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        p: ({ className, ...props }) => (
          <p className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        a: ({ className, href, ...props }) => (
          <Button
            variant="link"
            asChild
            className={cn("h-auto p-0 whitespace-pre-wrap", className)}
            size="sm"
          >
            <Link href={href ?? "#"} {...props} />
          </Button>
        ),
        ul: ({ className, ...props }) => (
          <ul
            className={cn("ml-4.5 list-outside list-disc", className)}
            {...props}
          />
        ),
        ol: ({ className, ...props }) => (
          <ol
            className={cn("ml-4.5 list-outside list-decimal", className)}
            {...props}
          />
        ),
        li: ({ className, ...props }) => (
          <li
            className={cn("leading-(--text-base--line-height)", className)}
            {...props}
          />
        ),
        blockquote: ({ className, ...props }) => (
          <blockquote
            className={cn(
              "border-muted text-muted-foreground border-l-4 pl-4 whitespace-pre-wrap italic",
              className,
            )}
            {...props}
          />
        ),
        img: ({ className, ...props }) => (
          // Using regular img tag for markdown content as the src URLs come from user content
          // and may be external URLs that Next.js Image component doesn't support without configuration
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={cn("max-w-full rounded-md", className)}
            alt={props.alt ?? ""}
            {...props}
          />
        ),
        code: CodeHighlight,
        pre: "pre",
        hr: (props) => <hr className="border-muted" {...props} />,
        table: ({ className, ...props }) => (
          <Table className={cn("whitespace-pre-wrap", className)} {...props} />
        ),
        tr: ({ className, ...props }) => (
          <TableRow
            className={cn("whitespace-pre-wrap", className)}
            {...props}
          />
        ),
        th: ({ className, ...props }) => (
          <TableHead
            className={cn("whitespace-pre-wrap", className)}
            {...props}
          />
        ),
        td: ({ className, ...props }) => (
          <TableCell
            className={cn("whitespace-pre-wrap", className)}
            {...props}
          />
        ),
        strong: ({ className, ...props }) => (
          <strong
            className={cn("font-semibold whitespace-pre-wrap", className)}
            {...props}
          />
        ),
        em: ({ className, ...props }) => (
          <em
            className={cn("whitespace-pre-wrap italic", className)}
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

Markdown.displayName = "Markdown";

export { Markdown };
