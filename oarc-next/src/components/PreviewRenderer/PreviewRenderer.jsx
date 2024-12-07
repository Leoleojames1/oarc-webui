import React, { useEffect, useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Expand, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import mermaid from 'mermaid';
import { Switch } from "@/components/ui/switch";
import { SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/hljs";

// Add this before prepareContent
const detectContentType = (content) => {
  // Check for specific tags/patterns to determine content type
  if (content.includes('<lume-scene') || content.includes('<lume>')) {
    return 'lume';
  }
  if (content.includes('graph') || content.includes('flowchart') || content.includes('sequenceDiagram')) {
    return 'mermaid';
  }
  if (content.includes('<!DOCTYPE html') || content.includes('<html>')) {
    return 'html';
  }
  if (content.includes('import React') || content.includes('function') || content.startsWith('<')) {
    return 'react';
  }
  return null;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

const ErrorDisplay = React.memo(({ errorText, onShowCode }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(errorText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-2 p-4 bg-red-500/10 text-red-400 rounded relative">
      <p className="font-medium mb-2">Preview Error:</p>
      <pre className="whitespace-pre-wrap text-sm font-mono mb-8">
        {errorText}
      </pre>
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
          onClick={handleCopyError}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {onShowCode && (
        <Button 
          variant="ghost"
          className="mt-4 text-sm text-red-400 hover:text-red-300"
          onClick={onShowCode}
        >
          Show code instead
        </Button>
      )}
    </div>
  );
});

// First, let's declare our utility functions at the top level
const prepareContent = (rawContent, type, isDarkTheme) => {
  let cleanedContent = rawContent.replace(/^\`\`\`(\w+)?\n?/, '').replace(/\`\`\`$/, '').trim();
  
  const detectedType = detectContentType(cleanedContent);
  const contentType = detectedType || type;
  
  switch (contentType) {
    case 'html':
      return `
        <!DOCTYPE html>
        <html class="${isDarkTheme ? 'dark' : 'light'}">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                margin: 0; 
                padding: 1rem;
                font-family: system-ui, -apple-system, sans-serif;
                background-color: ${isDarkTheme ? '#1a1a1a' : '#ffffff'};
                color: ${isDarkTheme ? '#ffffff' : '#000000'};
              }
            </style>
          </head>
          <body>${cleanedContent}</body>
        </html>
      `;
    
    case 'lume':
      return `
        <!DOCTYPE html>
        <html class="${isDarkTheme ? 'dark' : 'light'}">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <base href="https://docs.lume.io/" />
            <script src="./importmap.js"></script>
            <script src="./modules/vue/dist/vue.js"></script>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background-color: ${isDarkTheme ? '#1a1a1a' : '#ffffff'};
                overflow: hidden;
              }
              lume-scene {
                width: 100%;
                height: 100%;
                background: ${isDarkTheme ? '#333' : '#f0f0f0'};
              }
            </style>
            <script type="module">
              import 'lume'
              window.addEventListener('load', () => {
                var template = document.querySelector('template') || document.body
                new Vue({
                  el: template,
                  template: template.innerHTML || template.outerHTML,
                  mounted() {
                    const rotator = this.$refs.rotator
                    if (rotator) {
                      rotator.rotation = (x, y, z) => [x, y, z - 9.8]
                    }
                  }
                })
              })
            </script>
          </head>
          <body>
            ${cleanedContent}
          </body>
        </html>
      `;

    case 'react': {
      // First, clean up the content
      const processedContent = cleanedContent
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        .replace(/import\s+{[^}]*}\s+from\s+['"].*?['"];?\n?/g, '')
        .replace(/export\s+default\s+/g, '')
        .trim();

      // Determine if we need to wrap the content
      let componentCode;
      if (processedContent.includes('function') || processedContent.includes('=>')) {
        // It's already a component definition
        componentCode = processedContent;
      } else if (processedContent.startsWith('<')) {
        // It's JSX that needs to be wrapped in a component
        componentCode = `() => ${processedContent}`;
      } else {
        // Assume it's a component definition
        componentCode = processedContent;
      }

      // Create the complete component definition with necessary context
      return `
        const {
          createElement: h,
          Fragment,
          useState,
          useEffect,
          useRef
        } = React;

        // Mock basic HTML elements
        const div = ({children, ...props}) => h('div', props, children);
        const span = ({children, ...props}) => h('span', props, children);
        const p = ({children, ...props}) => h('p', props, children);
        const h1 = ({children, ...props}) => h('h1', props, children);
        const h2 = ({children, ...props}) => h('h2', props, children);
        const h3 = ({children, ...props}) => h('h3', props, children);
        const button = ({children, ...props}) => h('button', props, children);

        // Mock shadcn components
        const Card = ({children, className = '', ...props}) => 
          h('div', { className: \`rounded-lg border bg-card text-card-foreground shadow \${className}\`, ...props }, children);
        
        const CardHeader = ({children, className = '', ...props}) => 
          h('div', { className: \`flex flex-col space-y-1.5 p-6 \${className}\`, ...props }, children);
        
        const CardTitle = ({children, className = '', ...props}) => 
          h('h3', { className: \`text-2xl font-semibold leading-none tracking-tight \${className}\`, ...props }, children);
        
        const CardContent = ({children, className = '', ...props}) => 
          h('div', { className: \`p-6 pt-0 \${className}\`, ...props }, children);

        const Button = ({children, className = '', variant = 'default', size = 'default', ...props}) => {
          const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1';
          const variants = {
            default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
            secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground'
          };
          const sizes = {
            default: 'h-9 px-4 py-2',
            sm: 'h-8 px-3 text-sm',
            lg: 'h-10 px-8',
          };
          return h('button', { 
            className: \`\${baseClass} \${variants[variant]} \${sizes[size]} \${className}\`, 
            ...props 
          }, children);
        };

        // Define the component
        const Component = ${componentCode};

        export default Component;
      `;
    }
  
  default:
    return cleanedContent;
}
};

// This is our single source of truth for React component creation
const createReactComponent = (content) => {
  try {
    // Create a new Function that takes React as an argument
    const factory = new Function('React', `
      with (React) {
        ${content}
        return Component;
      }
    `);

    // Return the component factory
    return factory;
  } catch (error) {
    throw new Error(`Component compilation failed: ${error.message}`);
  }
};

// Now let's create a simpler hook that only handles component creation
const usePreviewRenderer = ({ type, content, isDarkTheme, onError, onSuccess }) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (type !== 'react') return;

    try {
      // Prepare the content
      const preparedContent = prepareContent(content, type, isDarkTheme);
      
      // Create the component factory
      const componentFactory = createReactComponent(preparedContent);
      
      // Create the actual component with React in scope
      const component = componentFactory(React);
      
      // Update state
      setComponent(() => component);
      setError(null);
      onSuccess?.();
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message);
      onError?.(err);
    }
  }, [type, content, isDarkTheme, onError, onSuccess]);

  return { Component, error };
};

// Finally, let's simplify the PreviewRenderer component
const PreviewRenderer = ({ type, content, isLoading, onError, onSuccess, isDarkTheme }) => {
  // Existing state declarations
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  // Add these two refs for mermaid
  const mermaidRef = useRef(null);
  const mermaidContainerRef = useRef(null);
  
  // Get our React component from the hook if needed
  const { Component, error: hookError } = usePreviewRenderer({
    type,
    content,
    isDarkTheme,
    onError: (err) => {
      setError(err.message);
      onError?.(err);
    },
    onSuccess
  });

  // Event handlers for user interactions
  const handleButtonClick = (e) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleError = (err) => {
    const errorMessage = err.message || 'Failed to render content';
    setError(errorMessage);
    onError?.(err);
  };

  const handleCopy = async (textToCopy, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Renders error messages in a user-friendly format
  const renderError = (errorText) => {
    return <ErrorDisplay errorText={errorText} />;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e) => {
    if (e.button === 1) { // Middle mouse button
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // This effect handles mermaid diagram rendering and updates
  useEffect(() => {
    if (type === 'mermaid' && mermaidRef.current) {
      try {
        // Initialize mermaid with proper configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkTheme ? 'dark' : 'default',
          securityLevel: 'loose',
          flowchart: { 
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          darkMode: isDarkTheme
        });
        
        // Prepare and render the mermaid diagram
        const preparedContent = prepareContent(content, 'mermaid');
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        
        mermaid.render(id, preparedContent)
          .then(({ svg }) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
              const svgElement = mermaidRef.current.querySelector('svg');
              if (svgElement) {
                svgElement.style.maxWidth = '100%';
                svgElement.style.height = 'auto';
                
                // Handle resize events for responsive diagrams
                const handleResize = () => {
                  if (svgElement) {
                    svgElement.style.display = 'none';
                    requestAnimationFrame(() => {
                      if (svgElement) svgElement.style.display = 'block';
                    });
                  }
                };

                const resizeObserver = new ResizeObserver(handleResize);
                resizeObserver.observe(mermaidRef.current);

                return () => resizeObserver.disconnect();
              }
            }
            onSuccess(); // Call onSuccess when rendering is complete
          })
          .catch(error => {
            console.error('Mermaid error:', error);
            handleError(new Error('Failed to render diagram: ' + error.message));
          });
      } catch (error) {
        console.error('Mermaid initialization error:', error);
        handleError(error);
      }
    }
  }, [type, content, isDarkTheme, isExpanded, zoomLevel, onSuccess]);

  useEffect(() => {
    if (type !== 'react') return;
  
    try {
      // Clean the content
      const preparedContent = prepareContent(content, 'react')
        .replace(/^\s*import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        .replace(/^\s*export\s+default\s+/m, '')
        .trim();
  
      // Create the component code with proper scoping
      const processedCode = !preparedContent.includes('function') && !preparedContent.includes('=>') 
        ? `() => (${preparedContent})`
        : preparedContent;
  
      const finalCode = `
        const {createElement} = React;
        const div = (props) => createElement('div', props);
        const span = (props) => createElement('span', props);
        const p = (props) => createElement('p', props);
        const h1 = (props) => createElement('h1', props);
        const h2 = (props) => createElement('h2', props);
        const h3 = (props) => createElement('h3', props);
        const button = (props) => createElement('button', props);
  
        ${processedCode}
      `;
  
      // Create component in the existing React scope
      const createComponent = new Function('React', `
        with (React) {
          ${finalCode}
          return Component;
        }
      `);
  
      setComponent(() => createComponent(React));
    } catch (error) {
      console.error('React render error:', error);
      handleError(error);
    }
  }, [type, content]);
  
  const handleExpandChange = (newState) => {
    setIsExpanded(newState);
    // Reset pan position when closing dialog
    if (!newState) {
      setPanPosition({ x: 0, y: 0 });
      setZoomLevel(1);
    }
  };

  // Main render function that handles all content types
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent" />
        </div>
      );
    }

    if (error || hookError) {
      return <ErrorDisplay errorText={error || hookError} />;
    }

    const preparedContent = type === 'react' ? null : prepareContent(content, type, isDarkTheme);

    switch (type) {
      case 'lume':
        return (
          <iframe
            srcDoc={preparedContent}
            className={`w-full border-0 ${isExpanded ? 'h-[80vh]' : 'h-[500px]'}`}
            title="Lume Preview"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
            allow="accelerometer; camera; geolocation; microphone; web-share"
            style={{ 
              backgroundColor: isDarkTheme ? '#1a1a1a' : '#ffffff',
              minHeight: '500px'
            }}
            onLoad={(e) => {
              // Setup message passing for events
              const iframe = e.target;
              iframe.contentWindow.addEventListener('message', (event) => {
                if (event.data.type === 'lumeEvent') {
                  // Handle Lume events
                  console.log('Lume event:', event.data);
                }
              });
            }}
          />
        );
      case 'html':
        return (
          <iframe
            srcDoc={preparedContent}
            className={`w-full border-0 ${isExpanded ? 'h-[80vh]' : 'h-[300px]'}`}
            title="HTML Preview"
            sandbox="allow-scripts"
            style={{ backgroundColor: isDarkTheme ? '#1a1a1a' : '#ffffff' }}
          />
        );
      case 'react':
        if (!Component) return null;
        return (
          <ErrorBoundary
            fallback={(error) => renderError(error.message)}
          >
            <div className={`preview bg-gray-900 p-4 rounded-lg text-white ${isExpanded ? 'min-h-[80vh]' : ''}`}>
              <Component />
            </div>
          </ErrorBoundary>
        );
      case 'mermaid':
        return (
          <div className="relative w-full">
            <div 
              ref={mermaidContainerRef}
              className={`
                mermaid bg-gray-900 p-4 rounded-lg overflow-auto
                ${isExpanded ? 'h-[80vh]' : 'h-[300px]'}
              `}
              style={{
                cursor: isPanning ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={mermaidRef}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s ease-out',
                }}
              />
            </div>
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomIn}
                className="bg-gray-800/90 hover:bg-gray-700/90"
              >
                <ZoomIn className="h-4 w-4 text-green-400" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomOut}
                className="bg-gray-800/90 hover:bg-gray-700/90"
              >
                <ZoomOut className="h-4 w-4 text-green-400" />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Main component render
  return (
    <div className="non-draggable" onClick={e => e.stopPropagation()}>
      <div className="bg-gray-900 rounded-lg overflow-hidden relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-6 w-6 bg-gray-800/90 hover:bg-gray-700/90 z-10"
          onClick={() => handleExpandChange(true)} // Update this line too
        >
          <Expand className="h-3 w-3 text-green-400" />
        </Button>
        {renderContent()}
      </div>

      <Dialog 
        open={isExpanded} 
        onOpenChange={handleExpandChange}  // This line was causing the error
        className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
      >
        <DialogContent 
          className="max-w-[95vw] w-[95vw] h-[95vh] p-0 overflow-hidden border-0 non-draggable"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="h-full w-full overflow-auto p-6">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Enhanced code block component with better error handling
const CodeBlock = React.memo(({ language, children, isDarkTheme }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const content = React.useMemo(() => {
    return String(children || '').trim();
  }, [children]);

  // Determine if content can be previewed
  const canPreview = ['javascript', 'jsx', 'tsx', 'html', 'mermaid', 'lume'].includes(language?.toLowerCase());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    setError(null);
  }, [content, language]);

  return (
    <div className="relative group">
      {/* Copy button */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="sm"
          variant="ghost"
          className="bg-gray-800/90 hover:bg-gray-700/90 text-green-400"
          onClick={handleCopy}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
        </Button>
      </div>

      {/* Preview toggle for supported languages */}
      {canPreview && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-gray-800/90 rounded-full px-3 py-1">
          <span className="text-xs text-green-400">Render</span>
          <Switch
            checked={showPreview}
            onCheckedChange={(checked) => {
              setShowPreview(checked);
              setError(null);
              if (checked) setIsLoading(true);
            }}
            className="data-[state=checked]:bg-green-400"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="mt-8"> {/* Space for buttons */}
        {showPreview ? (
          <PreviewRenderer
            type={
              language === 'mermaid' ? 'mermaid' : 
              language === 'html' ? 'html' : 
              language === 'lume' ? 'lume' : 
              'react'
            }
            content={content}
            isLoading={isLoading}
            isDarkTheme={isDarkTheme}
            onError={(err) => {
              setError(err.message);
              setIsLoading(false);
            }}
            onSuccess={() => {
              setError(null);
              setIsLoading(false);
            }}
          />
        ) : (
          <SyntaxHighlighter
            style={dracula}
            language={language || 'plaintext'}
            className="rounded-lg !mt-0"
            customStyle={{
              padding: '1rem',
              margin: 0,
              backgroundColor: 'rgb(31, 41, 55)',
              fontSize: '0.875rem'
            }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>

      {/* Error display */}
      {error && (
        <ErrorDisplay 
          errorText={error}
          onShowCode={() => {
            setShowPreview(false);
            setError(null);
          }}
        />
      )}
    </div>
  );
});

export { ErrorBoundary, CodeBlock };
export default PreviewRenderer;