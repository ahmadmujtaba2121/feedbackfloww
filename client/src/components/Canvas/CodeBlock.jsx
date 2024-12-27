import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiCopy, FiCheck, FiPlay, FiChevronDown } from 'react-icons/fi';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python';
import html from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml';
import css from 'react-syntax-highlighter/dist/cjs/languages/hljs/css';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { toast } from 'react-hot-toast';

// Register languages
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('css', css);

// Simplified language list to reduce bundle size
const PREVIEW_LANGUAGES = {
    javascript: { label: 'JavaScript', canPreview: true },
    python: { label: 'Python', canPreview: true },
    html: { label: 'HTML', canPreview: true },
    css: { label: 'CSS', canPreview: true }
};

const CodeBlock = ({ file, onUpdate }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [code, setCode] = useState(file.content);
    const [showLanguages, setShowLanguages] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState(file.language || 'javascript');
    const [consoleOutput, setConsoleOutput] = useState([]);
    const outputRef = useRef(null);

    // Memoize handlers to prevent unnecessary re-renders
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        toast.success('Code copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
    }, [code]);

    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        onUpdate({
            ...file,
            content: code
        });
    }, [code, file, onUpdate]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + '    ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        }
    }, [code]);

    const handleLanguageChange = useCallback((lang) => {
        setShowLanguages(false);
        setDetectedLanguage(lang);
        toast.success(`Changed to ${PREVIEW_LANGUAGES[lang].label}`);
        onUpdate({
            ...file,
            language: lang
        });
    }, [file, onUpdate]);

    const handlePreviewClick = useCallback(() => {
        setShowPreview(!showPreview);
        setConsoleOutput([]);

        if (detectedLanguage === 'javascript') {
            try {
                const output = [];
                const mockConsole = {
                    log: (...args) => {
                        output.push({
                            type: 'log', content: args.map(arg =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ')
                        });
                    },
                    error: (...args) => {
                        output.push({ type: 'error', content: args.join(' ') });
                    },
                    warn: (...args) => {
                        output.push({ type: 'warn', content: args.join(' ') });
                    },
                    info: (...args) => {
                        output.push({ type: 'info', content: args.join(' ') });
                    }
                };

                // Execute code with mocked console
                new Function('console', code)(mockConsole);
                setConsoleOutput(output);
            } catch (error) {
                setConsoleOutput([{ type: 'error', content: error.message }]);
            }
        } else if (detectedLanguage === 'html') {
            const previewWindow = window.open('', '_blank', 'width=800,height=600');
            previewWindow.document.write(code);
            previewWindow.document.close();
        } else if (detectedLanguage === 'css') {
            const previewWindow = window.open('', '_blank', 'width=800,height=600');
            const demoHtml = `
                <div class="demo-element">
                    <h1>CSS Preview</h1>
                    <p>This is a demo element to preview your CSS</p>
                    <button>Demo Button</button>
                </div>
            `;
            previewWindow.document.write(`
                <style>${code}</style>
                ${demoHtml}
            `);
            previewWindow.document.close();
        }
    }, [code, detectedLanguage, showPreview]);

    // Scroll console to bottom when new output is added
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    // Memoize values
    const currentLanguage = useMemo(() => PREVIEW_LANGUAGES[detectedLanguage] || PREVIEW_LANGUAGES.javascript, [detectedLanguage]);
    const canPreview = currentLanguage.canPreview;

    // Memoize language selector to prevent re-renders
    const renderLanguageSelector = useCallback(() => (
        <div className="relative">
            <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-2 px-2 py-1 text-sm text-slate-300 hover:text-white"
            >
                {currentLanguage.label}
                <FiChevronDown className="w-4 h-4" />
            </button>

            {showLanguages && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-xl overflow-hidden z-20">
                    <div className="max-h-60 overflow-y-auto">
                        {Object.entries(PREVIEW_LANGUAGES).map(([lang, { label }]) => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    ), [currentLanguage, showLanguages, handleLanguageChange]);

    return (
        <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
            <div className="relative h-full">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800 flex items-center justify-between px-2 z-10">
                    {renderLanguageSelector()}
                    <div className="flex items-center gap-2">
                        {/* Preview Button */}
                        {canPreview && (
                            <button
                                onClick={handlePreviewClick}
                                className="p-2 text-slate-400 hover:text-white rounded"
                                title="Preview code"
                            >
                                <FiPlay className="w-4 h-4" />
                            </button>
                        )}

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className="p-2 text-slate-400 hover:text-white rounded"
                            title={isCopied ? "Copied!" : "Copy code"}
                        >
                            {isCopied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Code Content */}
                <div className="pt-10 h-full flex flex-col">
                    {/* Code Editor */}
                    <div className={`flex-1 ${showPreview ? 'h-1/2' : 'h-full'}`}>
                        {isEditing ? (
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="w-full h-full bg-transparent text-slate-300 font-mono p-4 focus:outline-none resize-none"
                                spellCheck="false"
                                autoFocus
                            />
                        ) : (
                            <div
                                onDoubleClick={handleDoubleClick}
                                className="w-full h-full cursor-text"
                            >
                                <SyntaxHighlighter
                                    language={detectedLanguage}
                                    style={atomOneDark}
                                    customStyle={{
                                        margin: 0,
                                        padding: '1rem',
                                        height: '100%',
                                        background: 'transparent',
                                        cursor: 'text'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {code}
                                </SyntaxHighlighter>
                            </div>
                        )}
                    </div>

                    {/* Console Output */}
                    {showPreview && (
                        <div className="h-1/2 border-t border-slate-700">
                            <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
                                <span className="text-slate-300 text-sm">Console Output</span>
                                <button
                                    onClick={() => setConsoleOutput([])}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    Clear
                                </button>
                            </div>
                            <div
                                ref={outputRef}
                                className="h-[calc(100%-2.5rem)] overflow-auto bg-slate-900 font-mono text-sm p-4"
                            >
                                {consoleOutput.map((output, index) => (
                                    <div
                                        key={index}
                                        className={`mb-1 ${output.type === 'error' ? 'text-red-400' :
                                            output.type === 'warn' ? 'text-yellow-400' :
                                                output.type === 'info' ? 'text-blue-400' :
                                                    'text-slate-300'
                                            }`}
                                    >
                                        {output.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodeBlock; 