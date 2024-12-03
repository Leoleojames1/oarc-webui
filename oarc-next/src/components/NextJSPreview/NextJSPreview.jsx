import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";

const NextJSPreview = ({ code, onLoadStart, onLoadEnd }) => {
  const [error, setError] = useState(null);
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    onLoadStart?.();
    try {
      // Extract just the component's return JSX
      const returnStatementMatch = code.match(/return\s*\(([\s\S]*?)\);/);
      const jsxContent = returnStatementMatch ? returnStatementMatch[1] : '';
      
      const wrappedCode = `
        const Preview = () => {
          return (${jsxContent});
        };
        return Preview;
      `;

      const constructorFunction = new Function(
        'React',
        'Link',
        'Head',
        wrappedCode
      );

      const ComponentFromCode = constructorFunction(
        React,
        ({ children, href }) => <a href={href}>{children}</a>,
        () => null
      );

      setComponent(() => ComponentFromCode);
      setError(null);
      onLoadEnd?.();
    } catch (err) {
      setError(err.message);
      onLoadEnd?.();
    }
  }, [code]);

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="preview bg-white p-4 rounded-lg text-black">
      {Component && <Component />}
    </div>
  );
};

export default NextJSPreview;