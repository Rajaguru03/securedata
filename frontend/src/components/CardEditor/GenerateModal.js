import React, { useState, useEffect, useRef } from 'react';
import { useCards } from '../../context/CardContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import TerminalCard from '../Common/TerminalCard';
import { llmAPI } from '../../services/api';
import { HiX, HiUpload, HiDocument, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const GenerateModal = ({ onClose, onGenerate }) => {
  const { generateWithLLM, getTemplates, loading } = useCards();
  const [prompt, setPrompt] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [showReferenceInput, setShowReferenceInput] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);       // { name, charCount, truncated }
  const [extracting, setExtracting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState(null);
  const [ragUsed, setRagUsed] = useState(false);
  const [completenessScore, setCompletenessScore] = useState(null);
  const [faithfulnessScore, setFaithfulnessScore] = useState(null);
  const [section, setSection] = useState('full');
  const fileInputRef = useRef(null);

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

    const result = await generateWithLLM(prompt, referenceText, section);

    if (result.success) {
      setPreview(result.data);
      setRagUsed(result.ragUsed || false);
      setCompletenessScore(result.completenessScore ?? null);
      setFaithfulnessScore(result.faithfulnessScore ?? null);
      toast.success(result.ragUsed ? 'rag-grounded content generated!' : 'content generated! review below.');
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side guard before hitting the server
    if (file.size > 5 * 1024 * 1024) {
      toast.error('file too large — maximum 5 MB');
      return;
    }

    setExtracting(true);
    setUploadedFile(null);
    setReferenceText('');

    try {
      const res = await llmAPI.extractDocument(file);
      const { text, charCount, truncated, filename } = res.data.data;
      setReferenceText(text);
      setUploadedFile({ name: filename, charCount, truncated });
      toast.success(`document scanned — ${charCount.toLocaleString()} characters extracted`);
    } catch (err) {
      const msg = err.response?.data?.error || 'failed to read document';
      toast.error(msg);
    } finally {
      setExtracting(false);
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearDocument = () => {
    setReferenceText('');
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

                {/* Section Focus (GAP 2 — role-based prompting) */}
                <div className="mt-4">
                  <p className="text-xs text-term-muted font-mono uppercase tracking-widest mb-2">section focus</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'full', label: 'full card' },
                      { value: 'contact', label: 'contact' },
                      { value: 'professional', label: 'professional' },
                      { value: 'academic', label: 'academic' },
                      { value: 'social', label: 'social' },
                      { value: 'overview', label: 'overview' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSection(opt.value)}
                        className={`py-1.5 px-2 text-xs font-mono border transition-colors ${
                          section === opt.value
                            ? 'border-primary text-primary bg-primary-muted'
                            : 'border-term-border text-term-muted hover:border-term-subtle hover:text-term-default'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {section !== 'full' && (
                    <p className="mt-1.5 text-xs font-mono text-term-muted">
                      ↳ LLM will focus only on <span className="text-accent">{section}</span> fields
                    </p>
                  )}
                </div>

                {/* RAG Reference Document (optional) */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReferenceInput(v => !v);
                      if (showReferenceInput) handleClearDocument();
                    }}
                    className="flex items-center gap-2 text-xs font-mono text-term-muted hover:text-term-default transition-colors"
                  >
                    <span className="text-term-border">{showReferenceInput ? '▼' : '▶'}</span>
                    <span>{showReferenceInput ? 'hide' : '+ attach'} reference document</span>
                    <span className="px-1.5 py-0.5 bg-ai-muted text-ai border border-ai text-xs font-mono" style={{ borderRadius: '2px' }}>rag</span>
                  </button>

                  {showReferenceInput && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-term-muted font-mono">
                        upload a PDF or .txt file — the ai will ground field values in the document content.
                      </p>

                      {/* File picker */}
                      {!uploadedFile && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileChange}
                            className="hidden"
                            id="rag-file-input"
                          />
                          <label
                            htmlFor="rag-file-input"
                            className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-term-border hover:border-term-subtle cursor-pointer transition-colors font-mono text-xs text-term-muted hover:text-term-default ${extracting ? 'opacity-50 pointer-events-none' : ''}`}
                            style={{ borderRadius: '2px' }}
                          >
                            {extracting ? (
                              <LoadingSpinner size="sm" text="scanning document..." />
                            ) : (
                              <>
                                <HiUpload className="w-4 h-4" />
                                <span>click to upload PDF or .txt (max 5 MB)</span>
                              </>
                            )}
                          </label>
                        </div>
                      )}

                      {/* Uploaded file confirmation */}
                      {uploadedFile && (
                        <div className="p-3 bg-ai-muted border border-ai font-mono text-xs" style={{ borderRadius: '2px' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <HiDocument className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-ai font-semibold">{uploadedFile.name}</p>
                                <p className="text-term-muted mt-0.5">
                                  {uploadedFile.charCount.toLocaleString()} characters extracted
                                  {uploadedFile.truncated && (
                                    <span className="text-warn ml-1">(truncated to 10,000)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleClearDocument}
                              className="text-term-muted hover:text-danger transition-colors flex-shrink-0 mt-0.5"
                              title="remove document"
                            >
                              <HiTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Paste fallback */}
                      {!uploadedFile && !extracting && (
                        <div>
                          <p className="text-xs text-term-muted font-mono mb-1">or paste text directly:</p>
                          <textarea
                            value={referenceText}
                            onChange={(e) => setReferenceText(e.target.value)}
                            className="input"
                            rows={4}
                            placeholder="paste a CV, bio, or any reference text here..."
                            maxLength={10000}
                          />
                          <p className="mt-1 text-xs text-term-muted font-mono">
                            {referenceText.length}/10,000 characters
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || prompt.trim().length < 10}
                  className="w-full btn-primary mt-4 flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text={referenceText.trim() ? 'retrieving & generating...' : 'generating...'} />
                  ) : (
                    referenceText.trim() ? '✦ generate with rag' : '✦ generate content'
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
                  {section && section !== 'full' && (
                    <span className="ml-2 text-accent">[section: {section}]</span>
                  )}
                </div>

                {ragUsed && (
                  <div className="flex items-center gap-2 p-2 bg-ai-muted border border-ai font-mono text-xs text-ai" style={{ borderRadius: '2px' }}>
                    <span>◈</span>
                    <span>rag-grounded — field values sourced from your reference document</span>
                  </div>
                )}

                {/* Gap 3: Completeness Score */}
                {completenessScore !== null && (
                  <div className="p-3 border border-term-border font-mono text-xs space-y-1.5" style={{ borderRadius: '2px' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-term-muted uppercase tracking-widest text-xs">completeness score</span>
                      <span className={`font-bold text-sm ${completenessScore >= 75 ? 'text-primary' : completenessScore >= 50 ? 'text-warn' : 'text-danger'}`}>
                        {completenessScore}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-term-border" style={{ borderRadius: '1px' }}>
                      <div
                        className={`h-full transition-all ${completenessScore >= 75 ? 'bg-primary' : completenessScore >= 50 ? 'bg-warn' : 'bg-danger'}`}
                        style={{ width: `${completenessScore}%`, borderRadius: '1px' }}
                      />
                    </div>
                    <p className="text-term-muted text-xs">
                      {completenessScore >= 75 ? 'well-structured card with all key fields populated'
                        : completenessScore >= 50 ? 'card is usable but missing some fields'
                        : 'card is incomplete — consider adding more detail to your prompt'}
                    </p>
                  </div>
                )}

                {/* Gap 5: Faithfulness Score (RAG only) */}
                {ragUsed && faithfulnessScore !== null && (
                  <div className="p-3 border border-term-border font-mono text-xs space-y-1.5" style={{ borderRadius: '2px' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-term-muted uppercase tracking-widest text-xs">faithfulness score</span>
                      <span className={`font-bold text-sm ${faithfulnessScore >= 75 ? 'text-primary' : faithfulnessScore >= 50 ? 'text-warn' : 'text-danger'}`}>
                        {faithfulnessScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-term-border" style={{ borderRadius: '1px' }}>
                      <div
                        className={`h-full transition-all ${faithfulnessScore >= 75 ? 'bg-primary' : faithfulnessScore >= 50 ? 'bg-warn' : 'bg-danger'}`}
                        style={{ width: `${faithfulnessScore}%`, borderRadius: '1px' }}
                      />
                    </div>
                    <p className="text-term-muted text-xs">
                      {faithfulnessScore}% of fields were found in your document —{' '}
                      {100 - faithfulnessScore}% could not be located and are marked below
                    </p>
                  </div>
                )}

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
                    {preview.fields?.map((field, index) => {
                      const isMissing = field.value === '[More Information Needed]';
                      return (
                        <div key={index} className={`kv-row ${isMissing ? 'opacity-60' : ''}`}>
                          <span className="kv-key">{field.label}</span>
                          <span className="kv-value flex items-center gap-2 flex-wrap">
                            <span className={isMissing ? 'text-warn italic' : ''}>{field.value || '—'}</span>
                            <span className="text-term-muted text-xs">[{field.type}]</span>
                            {field.encrypted && (
                              <span className="badge-yellow text-xs">encrypted</span>
                            )}
                            {ragUsed && !isMissing && (
                              <span className="px-1 py-0.5 text-xs font-mono text-primary border border-primary border-opacity-40 bg-primary-muted" style={{ borderRadius: '2px' }}>
                                sourced
                              </span>
                            )}
                            {ragUsed && isMissing && (
                              <span className="px-1 py-0.5 text-xs font-mono text-warn border border-warn border-opacity-40" style={{ borderRadius: '2px' }}>
                                not in doc
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
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
                    onClick={() => { setPreview(null); setRagUsed(false); setCompletenessScore(null); setFaithfulnessScore(null); setSection('full'); }}
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
