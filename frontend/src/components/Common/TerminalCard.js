import React from 'react';

const TerminalCard = ({ title, children, className = '', tag = null }) => (
  <div
    className={`relative border border-term-border bg-term-surface pt-7 pb-5 px-5 ${className}`}
    style={{ borderRadius: '2px' }}
  >
    {title && (
      <div className="absolute top-0 left-0 right-0 flex items-center -translate-y-1/2 px-3">
        <span className="text-term-border text-xs font-mono">─</span>
        <span className="bg-term-surface text-term-subtle text-xs font-mono px-2 whitespace-nowrap">
          {title.toLowerCase()}
        </span>
        <span className="flex-1 overflow-hidden text-term-border text-xs font-mono">
          {'─'.repeat(60)}
        </span>
        {tag && <span className="bg-term-surface px-2">{tag}</span>}
      </div>
    )}
    {children}
  </div>
);

export default TerminalCard;
