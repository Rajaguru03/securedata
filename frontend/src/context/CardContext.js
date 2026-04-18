import React, { createContext, useContext, useState, useCallback } from 'react';
import { cardAPI, llmAPI } from '../services/api';

const CardContext = createContext(null);

export const CardProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  // Fetch all cards
  const fetchCards = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardAPI.getAll({ page, limit });
      setCards(response.data.data.datacards);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single card
  const fetchCard = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardAPI.getOne(id);
      setCurrentCard(response.data.data.datacard);
      return response.data.data.datacard;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch card');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new card
  const createCard = async (cardData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardAPI.create(cardData);
      const newCard = response.data.data.datacard;
      setCards((prev) => [newCard, ...prev]);
      return { success: true, card: newCard };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create card';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Update card
  const updateCard = async (id, cardData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardAPI.update(id, cardData);
      const updatedCard = response.data.data.datacard;

      setCards((prev) =>
        prev.map((card) => (card._id === id ? updatedCard : card))
      );

      if (currentCard?._id === id) {
        setCurrentCard(updatedCard);
      }

      return { success: true, card: updatedCard };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update card';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Delete card
  const deleteCard = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await cardAPI.delete(id);
      setCards((prev) => prev.filter((card) => card._id !== id));

      if (currentCard?._id === id) {
        setCurrentCard(null);
      }

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete card';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Generate share link
  const generateShareLink = async (id, expiryDays = 7, password = null) => {
    try {
      setLoading(true);
      setError(null);
      const payload = { expiryDays };
      if (password) payload.password = password;
      const response = await cardAPI.generateShareLink(id, payload);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to generate share link';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Revoke share link
  const revokeShareLink = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await cardAPI.revokeShareLink(id);
      if (currentCard?._id === id) {
        setCurrentCard((prev) => ({ ...prev, shareToken: undefined, shareExpiry: undefined }));
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to revoke share link';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Get shared card (public)
  const getSharedCard = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardAPI.getShared(token);
      return { success: true, card: response.data.data.datacard };
    } catch (err) {
      const message = err.response?.data?.error || 'Card not found or link expired';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate card with LLM
  const generateWithLLM = async (prompt, referenceText = '', section = '') => {
    try {
      setLoading(true);
      setError(null);
      const payload = { prompt };
      if (referenceText.trim()) payload.referenceText = referenceText;
      if (section && section !== 'full') payload.section = section;
      const response = await llmAPI.generate(payload);
      const { generated, ragUsed, completenessScore, faithfulnessScore, section: usedSection } = response.data.data;
      return {
        success: true,
        data: generated,
        ragUsed: ragUsed || false,
        completenessScore: completenessScore ?? null,
        faithfulnessScore: faithfulnessScore ?? null,
        section: usedSection || 'full',
      };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to generate content';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Get LLM templates
  const getTemplates = async () => {
    try {
      const response = await llmAPI.getTemplates();
      return { success: true, templates: response.data.data.templates };
    } catch (err) {
      return { success: false, error: 'Failed to fetch templates' };
    }
  };

  // Clear current card
  const clearCurrentCard = () => setCurrentCard(null);

  // Clear error
  const clearError = () => setError(null);

  const value = {
    cards,
    currentCard,
    loading,
    error,
    pagination,
    fetchCards,
    fetchCard,
    createCard,
    updateCard,
    deleteCard,
    generateShareLink,
    revokeShareLink,
    getSharedCard,
    generateWithLLM,
    getTemplates,
    clearCurrentCard,
    clearError,
  };

  return (
    <CardContext.Provider value={value}>
      {children}
    </CardContext.Provider>
  );
};

// Custom hook to use card context
export const useCards = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
};

export default CardContext;
