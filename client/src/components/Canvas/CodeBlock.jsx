import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiCopy, FiCheck, FiPlay, FiChevronDown } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-hot-toast';
import { handleError } from '../../utils/errorHandler';
import { usePerformanceMonitor } from '../../utils/performance';

// Supported languages with preview capability
const PREVIEW_LANGUAGES = {
    javascript: { label: 'JavaScript', canPreview: true },
    python: { label: 'Python', canPreview: true },
    html: { label: 'HTML', canPreview: true },
    css: { label: 'CSS', canPreview: true },
    typescript: { label: 'TypeScript', canPreview: false },
    java: { label: 'Java', canPreview: false },
    cpp: { label: 'C++', canPreview: false },
    csharp: { label: 'C#', canPreview: false },
    php: { label: 'PHP', canPreview: false },
    ruby: { label: 'Ruby', canPreview: false },
    swift: { label: 'Swift', canPreview: false },
    go: { label: 'Go', canPreview: false },
    rust: { label: 'Rust', canPreview: false },
    sql: { label: 'SQL', canPreview: false },
    markdown: { label: 'Markdown', canPreview: true },
    json: { label: 'JSON', canPreview: false },
    yaml: { label: 'YAML', canPreview: false },
    xml: { label: 'XML', canPreview: false },
    bash: { label: 'Bash', canPreview: false },
    powershell: { label: 'PowerShell', canPreview: false },
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
    html: {
        patterns: [
            { regex: /<!DOCTYPE html>|<html>|<head>|<body>/i, weight: 10 },
            { regex: /<\/?[a-z][\s\S]*>/i, weight: 8 },
            { regex: /<style>[\s\S]*<\/style>/i, weight: 7 },
            { regex: /<script>[\s\S]*<\/script>/i, weight: 7 }
        ],
        extensions: ['.html', '.htm']
    },
    css: {
        patterns: [
            { regex: /{[\s\S]*}/, weight: 5 },
            { regex: /@media|@keyframes|@import|@charset/, weight: 10 },
            { regex: /[.#][\w-]+\s*{/, weight: 8 },
            { regex: /:\s*[\w-]+;/, weight: 7 }
        ],
        extensions: ['.css']
    },
    javascript: {
        patterns: [
            { regex: /^import .* from ['"].*['"];?$/, weight: 10 },
            { regex: /const|let|var|function|=>|class .* extends|export|require\(/, weight: 8 },
            { regex: /\.[a-zA-Z]+\((.*)\)/, weight: 5 },
            { regex: /document\.|window\.|console\./, weight: 7 }
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    python: {
        patterns: [
            { regex: /^def \w+\(.*\):/, weight: 10 },
            { regex: /^class \w+(\(.*\))?:/, weight: 10 },
            { regex: /import \w+|from \w+ import/, weight: 8 },
            { regex: /print\(|if __name__ == ['"]__main__['"]/, weight: 7 }
        ],
        extensions: ['.py']
    },
    sql: {
        patterns: [
            { regex: /SELECT .* FROM|INSERT INTO .* VALUES|UPDATE .* SET|DELETE FROM/, weight: 10 },
            { regex: /CREATE TABLE|ALTER TABLE|DROP TABLE/, weight: 9 },
            { regex: /WHERE|GROUP BY|ORDER BY|HAVING/, weight: 8 }
        ],
        extensions: ['.sql']
    },
    java: {
        patterns: [
            { regex: /public class \w+|private class \w+/, weight: 10 },
            { regex: /public static void main\(String\[\] args\)/, weight: 10 },
            { regex: /import java\.|package \w+/, weight: 8 }
        ],
        extensions: ['.java']
    },
    cpp: {
        patterns: [
            { regex: /#include\s*<\w+>/, weight: 10 },
            { regex: /int main\(\)|void main\(\)/, weight: 10 },
            { regex: /std::|cout|cin|vector</, weight: 8 }
        ],
        extensions: ['.cpp', '.cc', '.cxx']
    },
    php: {
        patterns: [
            { regex: /<\?php|\?>/, weight: 10 },
            { regex: /\$\w+\s*=/, weight: 8 },
            { regex: /echo|print|require|include/, weight: 7 }
        ],
        extensions: ['.php']
    }
};

const detectLanguage = (code) => {
    let maxScore = 0;
    let detectedLang = 'javascript'; // default

    Object.entries(LANGUAGE_PATTERNS).forEach(([lang, config]) => {
        let score = 0;
        config.patterns.forEach(pattern => {
            if (pattern.regex.test(code)) {
                score += pattern.weight;
            }
        });
        if (score > maxScore) {
            maxScore = score;
            detectedLang = lang;
        }
    });

    // Special case for mixed HTML/CSS
    if (code.includes('<style>') || code.includes('<link')) {
        const cssScore = LANGUAGE_PATTERNS.css.patterns.reduce((score, pattern) => {
            return score + (pattern.regex.test(code) ? pattern.weight : 0);
        }, 0);
        const htmlScore = LANGUAGE_PATTERNS.html.patterns.reduce((score, pattern) => {
            return score + (pattern.regex.test(code) ? pattern.weight : 0);
        }, 0);
        detectedLang = cssScore > htmlScore ? 'css' : 'html';
    }

    return detectedLang;
};

const loadPyodideScript = () => {
    return new Promise((resolve, reject) => {
        if (window.loadPyodide) {
            resolve(window.loadPyodide);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        script.onload = () => resolve(window.loadPyodide);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const CodeBlock = ({ file, onUpdate, currentUser }) => {
    usePerformanceMonitor('CodeBlock');

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
        onUpdate({
            ...file,
            language: lang
        });
    }, [file, onUpdate]);

    const handlePreviewClick = useCallback(() => {
        try {
            setShowPreview(!showPreview);
            setConsoleOutput([]);

            if (detectedLanguage === 'javascript') {
                try {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    const messageHandler = (event) => {
                        const { type, content } = event.data;
                        if (type && content) {
                            setConsoleOutput(prev => [...prev, { type, content }]);
                        }
                    };

                    window.addEventListener('message', messageHandler);

                    const wrappedCode = `
                        try {
                            const console = {
                                log: function() {
                                    window.parent.postMessage({
                                        type: 'log',
                                        content: Array.from(arguments).map(arg => 
                                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                                        ).join(' ')
                                    }, '*');
                                },
                                error: function() {
                                    window.parent.postMessage({
                                        type: 'error',
                                        content: Array.from(arguments).map(arg => 
                                            arg instanceof Error ? arg.message : String(arg)
                                        ).join(' ')
                                    }, '*');
                                },
                                warn: function() {
                                    window.parent.postMessage({
                                        type: 'warn',
                                        content: Array.from(arguments).map(arg => String(arg)).join(' ')
                                    }, '*');
                                },
                                info: function() {
                                    window.parent.postMessage({
                                        type: 'info',
                                        content: Array.from(arguments).map(arg => String(arg)).join(' ')
                                    }, '*');
                                }
                            };
                            ${code}
                        } catch (error) {
                            window.parent.postMessage({
                                type: 'error',
                                content: error.toString()
                            }, '*');
                        }
                    `;

                    iframe.contentWindow.document.open();
                    iframe.contentWindow.document.write(`
                        <script>
                            ${wrappedCode}
                        </script>
                    `);
                    iframe.contentWindow.document.close();

                    setTimeout(() => {
                        window.removeEventListener('message', messageHandler);
                        document.body.removeChild(iframe);
                    }, 100);
                } catch (error) {
                    handleError(error, 'javascript_execution');
                    setConsoleOutput([{
                        type: 'error',
                        content: `Execution Error: ${error.message}`
                    }]);
                }
            } else if (detectedLanguage === 'python') {
                setConsoleOutput([{ type: 'info', content: 'Loading Python interpreter...' }]);

                loadPyodideScript()
                    .then(loadPyodide => loadPyodide({
                        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'
                    }))
                    .then(pyodide => {
                        try {
                            // Initialize Python environment with custom stdout/stderr
                            pyodide.runPython(`
                                import sys
                                from io import StringIO
                                
                                class CustomOutput:
                                    def __init__(self):
                                        self.output = StringIO()
                                    
                                    def write(self, text):
                                        self.output.write(text)
                                        return len(text)
                                        
                                    def flush(self):
                                        pass
                                        
                                    def getvalue(self):
                                        return self.output.getvalue()
                                
                                sys.stdout = CustomOutput()
                                sys.stderr = CustomOutput()
                            `);

                            // Run the actual code
                            pyodide.runPython(code);

                            // Get stdout content
                            const stdout = pyodide.runPython('sys.stdout.getvalue()');
                            if (stdout.trim()) {
                                stdout.trim().split('\n').forEach(line => {
                                    if (line) {
                                        setConsoleOutput(prev => [...prev, { type: 'log', content: line }]);
                                    }
                                });
                            }

                            // Get stderr content
                            const stderr = pyodide.runPython('sys.stderr.getvalue()');
                            if (stderr.trim()) {
                                stderr.trim().split('\n').forEach(line => {
                                    if (line) {
                                        setConsoleOutput(prev => [...prev, { type: 'error', content: line }]);
                                    }
                                });
                            }

                            // If no output, show a success message
                            if (!stdout.trim() && !stderr.trim()) {
                                setConsoleOutput([{ type: 'info', content: 'Code executed successfully with no output.' }]);
                            }
                        } catch (error) {
                            handleError(error, 'python_execution');
                            setConsoleOutput(prev => [...prev, {
                                type: 'error',
                                content: error.message.replace('Error: ', '')
                            }]);
                        }
                    })
                    .catch(error => {
                        handleError(error, 'python_load');
                        setConsoleOutput([{
                            type: 'error',
                            content: 'Failed to load Python interpreter. Please try again.'
                        }]);
                    });
            } else if (detectedLanguage === 'html') {
                try {
                    const previewWindow = window.open('', '_blank', 'width=800,height=600');
                    previewWindow.document.write(code);
                    previewWindow.document.close();
                } catch (error) {
                    handleError(error, 'html_preview');
                }
            }
        } catch (error) {
            handleError(error, 'preview_general');
        }
    }, [code, detectedLanguage, showPreview]);

    // Auto-detect language when content changes
    useEffect(() => {
        const detected = detectLanguage(code);
        if (detected !== file.language) {
            onUpdate({
                ...file,
                language: detected
            });
        }
    }, [code, file, onUpdate]);

    // Scroll console to bottom when new output is added
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    // Cleanup event listeners when component unmounts
    useEffect(() => {
        return () => {
            // Cleanup any remaining iframes
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            });
        };
    }, []);

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
                                    style={vscDarkPlus}
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