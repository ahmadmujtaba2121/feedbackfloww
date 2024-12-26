import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { toast } from "react-hot-toast";

// Register languages
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("python", python);

const CodeBlock = ({ file, onUpdate }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(file.content).then(() => {
            setCopied(true);
            toast.success("Code copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative group bg-[#282C34] rounded-lg overflow-hidden">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    title={copied ? "Copied!" : "Copy code"}
                >
                    {copied ? <FiCheck /> : <FiCopy />}
                </button>
            </div>
            <SyntaxHighlighter
                language={file.language || "javascript"}
                style={atomOneDark}
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    borderRadius: "0.5rem",
                }}
                wrapLines={true}
                showLineNumbers={true}
            >
                {file.content}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock; 