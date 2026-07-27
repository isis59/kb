import { create } from 'zustand';

const STORAGE_KEY = 'kb_data';

const defaultState = {
  articles: {},
  directories: {},
  currentArticle: null,
};

export const useKBStore = create((set, get) => ({
  ...defaultState,

  // Load KB from localStorage
  loadKB: async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set(data);
      }
    } catch (error) {
      console.error('Failed to load KB:', error);
    }
  },

  // Save KB to localStorage (and optionally to server)
  saveKB: async () => {
    const state = get();
    const data = {
      articles: state.articles,
      directories: state.directories,
    };
    
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // TODO: Send to server for file persistence
      await fetch('/api/kb/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        // Server not available, continue with localStorage
      });
    } catch (error) {
      console.error('Failed to save KB:', error);
    }
  },

  // Create new article
  createArticle: (title, parentId = null) => {
    const id = Date.now().toString();
    const article = {
      id,
      title,
      content: '',
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buttons: [], // Custom buttons with JS code
    };

    set(state => ({
      articles: {
        ...state.articles,
        [id]: article,
      },
      currentArticle: article,
    }));

    get().saveKB();
    return article;
  },

  // Create new directory
  createDirectory: (name, parentId = null) => {
    const id = `dir_${Date.now()}`;
    const directory = {
      id,
      name,
      parentId,
      children: [], // Article and directory IDs
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      directories: {
        ...state.directories,
        [id]: directory,
      },
    }));

    get().saveKB();
    return directory;
  },

  // Update article
  updateArticle: (id, updates) => {
    set(state => ({
      articles: {
        ...state.articles,
        [id]: {
          ...state.articles[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveKB();
  },

  // Delete article
  deleteArticle: (id) => {
    set(state => {
      const { [id]: _, ...rest } = state.articles;
      return { articles: rest };
    });
    get().saveKB();
  },

  // Set current article
  setCurrentArticle: (article) => {
    set({ currentArticle: article });
  },

  // Add button to article
  addButton: (articleId, button) => {
    const article = get().articles[articleId];
    if (article) {
      const buttons = [...(article.buttons || []), { ...button, id: Date.now().toString() }];
      get().updateArticle(articleId, { buttons });
    }
  },

  // Update button
  updateButton: (articleId, buttonId, updates) => {
    const article = get().articles[articleId];
    if (article) {
      const buttons = article.buttons.map(btn => btn.id === buttonId ? { ...btn, ...updates } : btn);
      get().updateArticle(articleId, { buttons });
    }
  },

  // Remove button
  removeButton: (articleId, buttonId) => {
    const article = get().articles[articleId];
    if (article) {
      const buttons = article.buttons.filter(btn => btn.id !== buttonId);
      get().updateArticle(articleId, { buttons });
    }
  },
}));
