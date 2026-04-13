import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCards } from '../../context/CardContext';
import { useAuth } from '../../context/AuthContext';
import CardPreview from './CardPreview';
import LoadingSpinner from '../Common/LoadingSpinner';
import { HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Divider = ({ label }) => (
  <div className="flex items-center gap-2 my-6">
    <span className="text-term-border font-mono text-xs">──</span>
    <span className="text-term-muted font-mono text-xs">{label}</span>
    <span className="flex-1 overflow-hidden text-term-border font-mono text-xs">{'─'.repeat(80)}</span>
  </div>
);

const ProgressBar = ({ value, max, width = 20 }) => {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  return (
    <span className="font-mono text-xs text-primary">
      {'█'.repeat(filled)}{'░'.repeat(width - filled)}
      <span className="ml-2 text-term-muted">{max > 0 ? Math.round((value / max) * 100) : 0}%</span>
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { cards, loading, error, pagination, fetchCards, deleteCard } = useCards();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDelete = async (id) => {
    if (window.confirm('delete this card?')) {
      const result = await deleteCard(id);
      if (result.success) {
        toast.success('card deleted');
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleRefresh = () => {
    fetchCards();
    toast.success('cards refreshed');
  };

  const filteredCards = cards.filter(
    (card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const privateCount = cards.filter((c) => c.visibility === 'private').length;
  const publicCount = cards.filter((c) => c.visibility === 'public').length;
  const total = pagination.total || cards.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-term-muted font-mono text-xs mb-1">
          ~/securecard/{user?.name?.split(' ')[0].toLowerCase()}
        </p>
        <h1 className="text-2xl font-bold text-term-bright font-mono cursor-blink">
          $ datacard dashboard
        </h1>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-term-muted font-mono text-sm">/</span>
          <input
            type="text"
            placeholder="search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-8"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="flex items-center border border-term-border" style={{ borderRadius: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-mono transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-muted text-primary'
                  : 'text-term-muted hover:text-term-subtle'
              }`}
            >
              [grid]
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-mono transition-colors border-l border-term-border ${
                viewMode === 'list'
                  ? 'bg-primary-muted text-primary'
                  : 'text-term-muted hover:text-term-subtle'
              }`}
            >
              [list]
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-1 text-xs"
          >
            <HiRefresh className="w-4 h-4" />
            <span className="hidden sm:inline">refresh</span>
          </button>

          {/* Create new */}
          <Link to="/cards/new" className="btn-primary text-xs flex items-center space-x-1">
            <span>+ new card</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="kv-row">
            <span className="kv-key">total</span>
            <span className="kv-value text-term-bright font-bold">{total}</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={total} max={Math.max(total, 1)} width={16} />
          </div>
        </div>
        <div className="card">
          <div className="kv-row">
            <span className="kv-key">private</span>
            <span className="kv-value text-term-bright font-bold">{privateCount}</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={privateCount} max={Math.max(total, 1)} width={16} />
          </div>
        </div>
        <div className="card">
          <div className="kv-row">
            <span className="kv-key">public</span>
            <span className="kv-value text-term-bright font-bold">{publicCount}</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={publicCount} max={Math.max(total, 1)} width={16} />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-danger-muted border border-danger-dim text-danger font-mono text-sm" style={{ borderRadius: '2px' }}>
          error: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="loading cards..." />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredCards.length === 0 && (
        <div className="text-center py-12 font-mono">
          <div className="text-4xl text-term-border mb-4">[ ]</div>
          <h3 className="text-sm text-term-subtle mb-2">
            {searchTerm ? 'no cards found' : 'no datacards yet'}
          </h3>
          <p className="text-term-muted text-xs mb-6">
            {searchTerm
              ? 'try a different search term'
              : 'create your first secure datacard to get started'}
          </p>
          {!searchTerm && (
            <Link to="/cards/new" className="btn-primary text-xs inline-flex items-center">
              + create your first card
            </Link>
          )}
        </div>
      )}

      {/* Cards grid/list */}
      {!loading && filteredCards.length > 0 && (
        <>
          <Divider label="datacards" />
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                : 'space-y-3'
            }
          >
            {filteredCards.map((card) => (
              <CardPreview
                key={card._id}
                card={card}
                viewMode={viewMode}
                onDelete={() => handleDelete(card._id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchCards(page)}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                pagination.current === page
                  ? 'border-primary text-primary bg-primary-muted'
                  : 'border-term-border text-term-muted hover:border-term-subtle hover:text-term-subtle'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
