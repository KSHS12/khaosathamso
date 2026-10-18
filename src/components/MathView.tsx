import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ math, displayMode = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      // Strip outer $ or $$ if present
      let cleanMath = math.trim();
      if (cleanMath.startsWith('$$') && cleanMath.endsWith('$$')) {
        cleanMath = cleanMath.slice(2, -2).trim();
      } else if (cleanMath.startsWith('$') && cleanMath.endsWith('$')) {
        cleanMath = cleanMath.slice(1, -1).trim();
      }

      return katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      console.error('KaTeX error:', err);
      return `<span class="text-rose-400 font-mono text-xs">${math}</span>`;
    }
  }, [math, displayMode]);

  return (
    <span
      className={`inline-block align-middle font-serif ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Parses mixed text with inline $...$ or $$...$$ math and renders each segment correctly.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const elements = useMemo(() => {
    if (!text) return null;

    // Split on $$...$$ or $...$
    // Regex: (\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\n)
    const tokens = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\n)/g);

    return tokens.map((part, index) => {
      if (!part) return null;

      if (part === '\n') {
        return <br key={`br-${index}`} />;
      }

      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        return (
          <div key={`dmath-${index}`} className="my-2 overflow-x-auto text-center py-1">
            <MathView math={formula} displayMode />
          </div>
        );
      }

      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1).trim();
        return <MathView key={`imath-${index}`} math={formula} className="mx-0.5" />;
      }

      return <span key={`txt-${index}`}>{part}</span>;
    });
  }, [text]);

  return <div className={`leading-relaxed ${className}`}>{elements}</div>;
};
