import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCards } from '../../context/CardContext';
import FieldEditor from './FieldEditor';
import GenerateModal from './GenerateModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import {
  HiPlus,
  HiSave,
  HiX,
  HiSparkles,
  HiLockClosed,
  HiGlobe,
  HiArrowLeft,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const FIELD_TYPES = ['text', 'email', 'phone', 'date', 'url', 'textarea'];

const emptyField = {
  label: '',
  value: '',
  type: 'text',
  encrypted: false,
};

const CardEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCard, createCard, updateCard, loading } = useCards();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: [{ ...emptyField }],
    visibility: 'private',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing card if editing
  useEffect(() => {
    if (isEditing) {
      const loadCard = async () => {
        const card = await fetchCard(id);
        if (card) {
          setFormData({
            title: card.title || '',
            description: card.description || '',
            fields: card.fields?.length > 0 ? card.fields : [{ ...emptyField }],
            visibility: card.visibility || 'private',
            tags: card.tags || [],
          });
        } else {
          toast.error('Card not found');
          navigate('/dashboard');
        }
      };
      loadCard();
    }
  }, [id, isEditing, fetchCard, navigate]);

  // Handle field changes
  const handleFieldChange = (index, field) => {
    const newFields = [...formData.fields];
    newFields[index] = field;
    setFormData({ ...formData, fields: newFields });
  };

  // Add new field
  const handleAddField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { ...emptyField }],
    });
  };

  // Remove field
  const handleRemoveField = (index) => {
    if (formData.fields.length <= 1) {
      toast.error('Card must have at least one field');
      return;
    }
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  // Move field up/down
  const handleMoveField = (index, direction) => {
    const newFields = [...formData.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFormData({ ...formData, fields: newFields });
  };

  // Add tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  // Handle LLM generated content
  const handleGeneratedContent = (generated) => {
    setFormData({
      ...formData,
      title: generated.title || formData.title,
      description: generated.description || formData.description,
      fields: generated.fields?.length > 0 ? generated.fields : formData.fields,
      tags: generated.tags || formData.tags,
    });
    setShowGenerateModal(false);
    toast.success('Content generated! Review and save.');
  };

  // Save card
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.fields.some((f) => f.label.trim())) {
      toast.error('At least one field with a label is required');
      return;
    }

    // Filter out empty fields
    const cleanedFields = formData.fields.filter((f) => f.label.trim());

    setSaving(true);

    const cardData = {
      ...formData,
      fields: cleanedFields,
    };

    let result;
    if (isEditing) {
      result = await updateCard(id, cardData);
    } else {
      result = await createCard(cardData);
    }

    setSaving(false);

    if (result.success) {
      toast.success(isEditing ? 'Card updated!' : 'Card created!');
      navigate(`/cards/${result.card._id}`);
    } else {
      toast.error(result.error);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading card..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-term-muted hover:text-term-default transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-term-bright font-mono">
              {isEditing ? 'edit datacard' : 'create new datacard'}
            </h1>
            <p className="text-term-muted font-mono text-xs">
              {isEditing ? 'update your datacard' : 'fill in the details or use ai to generate'}
            </p>
          </div>
        </div>

        {/* AI Generate button */}
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-outline flex items-center space-x-2"
        >
          <HiSparkles className="w-5 h-5" />
          <span>AI Generate</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-sm font-semibold text-term-subtle uppercase tracking-widest mb-4 font-mono">basic information</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="e.g., Professional Profile"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="Brief description of this card"
                maxLength={500}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="label">Visibility</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'private' })}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 border transition-colors font-mono text-sm ${
                    formData.visibility === 'private'
                      ? 'border-accent bg-accent-muted text-accent'
                      : 'border-term-border text-term-muted hover:border-term-subtle'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <HiLockClosed className="w-4 h-4" />
                  <span>private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'public' })}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 border transition-colors font-mono text-sm ${
                    formData.visibility === 'public'
                      ? 'border-primary bg-primary-muted text-primary'
                      : 'border-term-border text-term-muted hover:border-term-subtle'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <HiGlobe className="w-4 h-4" />
                  <span>public</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 bg-term-base border border-term-border text-term-subtle font-mono text-xs"
                    style={{ borderRadius: '2px' }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-term-muted hover:text-danger transition-colors"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="input"
                placeholder="Type a tag and press Enter"
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-term-subtle uppercase tracking-widest font-mono">fields</h2>
            <button
              type="button"
              onClick={handleAddField}
              className="btn-secondary flex items-center space-x-1 text-sm"
            >
              <HiPlus className="w-4 h-4" />
              <span>Add Field</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.fields.map((field, index) => (
              <FieldEditor
                key={index}
                field={field}
                index={index}
                totalFields={formData.fields.length}
                fieldTypes={FIELD_TYPES}
                onChange={(f) => handleFieldChange(index, f)}
                onRemove={() => handleRemoveField(index)}
                onMove={(dir) => handleMoveField(index, dir)}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <HiSave className="w-5 h-5" />
                <span>{isEditing ? 'Update Card' : 'Create Card'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGeneratedContent}
        />
      )}
    </div>
  );
};

export default CardEditor;
