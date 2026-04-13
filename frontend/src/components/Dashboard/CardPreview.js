import React from 'react';
import { Link } from 'react-router-dom';
import TerminalCard from '../Common/TerminalCard';

const CardPreview = ({ card, viewMode, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const previewFields = card.fields?.slice(0, 3) || [];
  const hasEncrypted = card.fields?.some((f) => f.encrypted);

  const visibilityBadge = (
    <span className={`text-xs font-mono ${card.visibility === 'public' ? 'text-primary' : 'text-accent'}`}>
      {card.visibility === 'public' ? '[pub]' : '[prv]'}
    </span>
  );

  if (viewMode === 'list') {
    return (
      <div className="card-hover flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Badge */}
          <span className={`text-xs font-mono font-bold ${card.visibility === 'public' ? 'text-primary' : 'text-accent'}`}>
            {card.visibility === 'public' ? '[pub]' : '[prv]'}
          </span>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-term-bright">{card.title}</h3>
            <p className="text-xs text-term-muted font-mono">
              {card.fields?.length || 0} fields
              {hasEncrypted && (
                <span className="text-warn ml-1">
                  ({card.fields?.filter(f => f.encrypted).length} encrypted)
                </span>
              )}
              {' · '}{formatDate(card.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Link
            to={`/cards/${card._id}`}
            className="text-xs font-mono text-term-muted hover:text-accent transition-colors"
          >
            [view]
          </Link>
          <Link
            to={`/cards/${card._id}/edit`}
            className="text-xs font-mono text-term-muted hover:text-primary transition-colors"
          >
            [edit]
          </Link>
          <button
            onClick={onDelete}
            className="text-xs font-mono text-term-muted hover:text-danger transition-colors"
          >
            [del]
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <TerminalCard title={card.title} tag={visibilityBadge} className="flex flex-col h-full">
      {/* Encrypted badge */}
      {hasEncrypted && (
        <div className="mb-3">
          <span className="badge-yellow text-xs">encrypted fields</span>
        </div>
      )}

      {/* Description */}
      {card.description && (
        <p className="text-xs text-term-muted mb-4 line-clamp-2">{card.description}</p>
      )}

      {/* Preview fields */}
      <div className="flex-1 mb-4">
        {previewFields.map((field, index) => (
          <div key={index} className="kv-row">
            <span className="kv-key truncate">{field.label}</span>
            <span className="kv-value truncate">
              {field.encrypted ? (
                <span className="text-warn">░░░░░░░░</span>
              ) : (
                field.value || <span className="text-term-muted">—</span>
              )}
            </span>
          </div>
        ))}
        {card.fields?.length > 3 && (
          <p className="text-xs text-term-muted font-mono mt-1">
            +{card.fields.length - 3} more fields
          </p>
        )}
      </div>

      {/* Tags */}
      {card.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {card.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 bg-term-base border border-term-border text-term-subtle text-xs font-mono"
              style={{ borderRadius: '2px' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-term-border flex items-center justify-between">
        <span className="text-xs text-term-muted font-mono">{formatDate(card.createdAt)}</span>
        <div className="flex items-center space-x-3">
          <Link
            to={`/cards/${card._id}`}
            className="text-xs font-mono text-term-muted hover:text-accent transition-colors"
          >
            [view]
          </Link>
          <Link
            to={`/cards/${card._id}/edit`}
            className="text-xs font-mono text-term-muted hover:text-primary transition-colors"
          >
            [edit]
          </Link>
          <button
            onClick={onDelete}
            className="text-xs font-mono text-term-muted hover:text-danger transition-colors"
          >
            [del]
          </button>
        </div>
      </div>
    </TerminalCard>
  );
};

export default CardPreview;
