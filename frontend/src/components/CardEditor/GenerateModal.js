import React, { useState, useEffect } from 'react';
import { useCards } from '../../context/CardContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import { HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

const GenerateModal = ({ onClose, onGenerate }) => {
  const { generateWithLLM, getTemplates, loading } = useCards();
  const [prompt, setPrompt] = useState('');
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const loadTemplates = async () => {
      const result = await getTemplates();
      if (result.success) {
        setTemplates(result.templates);
      }
    };
    loadTemplates();
  }, [getTemplates]);

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      toast.error('please provide a more detailed description (at least 10 characters)');
      return;
    }

    const result = await generateWithLLM(prompt);

    if (result.success) {
      setPreview(result.data);
      toast.success('content generated! review below.');
    } else {
      toast.error(result.error);
    }
  };

  const handleApply = () => {
    if (preview) {
      onGenerate(preview);
    }
  };

  const handleTemplateClick = (template) => {
    setPrompt(template.examplePrompt);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="term-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 relative z-50">
        <TerminalCard title="ai content generator" className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-term-muted hover:text-term-default transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {!preview ? (
              <>
                {/* Templates */}
                {templates.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs text-term-muted font-mono uppercase tracking-widest mb-3">
                      ✦ quick templates
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          className="text-left p-3 border border-term-border hover:border-term-subtle bg-term-base transition-colors"
                          style={{ borderRadius: '2px' }}
                        >
                          <p className="text-xs font-mono text-term-default font-semibold">{template.name}</p>
                          <p className="text-xs font-mono text-term-muted mt-0.5">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt input */}
                <div>
                  <label className="label">describe your datacard</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="e.g., create a professional business card for a software engineer with contact information, skills, and LinkedIn profile"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-term-muted font-mono">
                    {prompt.length}/500 characters (minimum 10)
                  </p>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || prompt.trim().length < 10}
                  className="w-full btn-primary mt-4 flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text="generating — this may take up to 30s..." />
                  ) : (
                    '✦ generate content'
                  )}
                </button>
              </>
            ) : (
              /* Preview */
              <div className="space-y-4">
                <div
                  className="p-3 bg-primary-muted border border-primary-dim font-mono text-xs text-primary"
                  style={{ borderRadius: '2px' }}
                >
                  + content generated! review below and click "apply" to use it.
                </div>

                {/* Title */}
                <div className="kv-row">
                  <span className="kv-key">title</span>
                  <span className="kv-value font-bold text-term-bright">{preview.title}</span>
                </div>

                {/* Description */}
                {preview.description && (
                  <div className="kv-row">
                    <span className="kv-key">description</span>
                    <span className="kv-value">{preview.description}</span>
                  </div>
                )}

                {/* Fields */}
                <div>
                  <p className="text-xs text-term-muted font-mono uppercase tracking-widest mb-2">
                    fields ({preview.fields?.length || 0})
                  </p>
                  <div className="space-y-0">
                    {preview.fields?.map((field, index) => (
                      <div key={index} className="kv-row">
                        <span className="kv-key">{field.label}</span>
                        <span className="kv-value flex items-center gap-2">
                          <span>{field.value || '—'}</span>
                          <span className="text-term-muted text-xs">[{field.type}]</span>
                          {field.encrypted && (
                            <span className="badge-yellow text-xs">encrypted</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {preview.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-term-muted font-mono uppercase tracking-widest mb-2">tags</p>
                    <div className="flex flex-wrap gap-2">
                      {preview.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-term-base border border-term-border text-term-subtle text-xs font-mono"
                          style={{ borderRadius: '2px' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex-1 btn-secondary text-xs"
                  >
                    regenerate
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 btn-primary text-xs"
                  >
                    apply content
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-term-border">
            <p className="text-xs text-term-muted font-mono text-center">
              powered by ai · generated content may need review and editing
            </p>
          </div>
        </TerminalCard>
      </div>
    </div>
  );
};

export default GenerateModal;
