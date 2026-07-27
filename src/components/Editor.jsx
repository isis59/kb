import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useKBStore } from '../store/kbStore';
import MenuBar from './MenuBar';
import ButtonConfigurator from './ButtonConfigurator';
import { Save, ChevronLeft, Plus, Trash2 } from 'lucide-react';

function Editor({ onClose }) {
  const { currentArticle, updateArticle, addButton, removeButton } = useKBStore();
  const [title, setTitle] = useState(currentArticle?.title || '');
  const [showButtonConfig, setShowButtonConfig] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your article...',
      }),
    ],
    content: currentArticle?.content || '',
  });

  const handleSave = () => {
    if (editor && currentArticle) {
      updateArticle(currentArticle.id, {
        title: title || currentArticle.title,
        content: editor.getHTML(),
      });
      onClose();
    }
  };

  const handleAddButton = (buttonConfig) => {
    if (currentArticle) {
      addButton(currentArticle.id, buttonConfig);
      setShowButtonConfig(false);
    }
  };

  if (!editor || !currentArticle) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="flex-1 text-2xl font-bold outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
        >
          <Save size={18} />
          Save
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <MenuBar editor={editor} />
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-96">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Buttons Panel */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Custom Buttons</h3>
          <button
            onClick={() => setShowButtonConfig(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
          >
            <Plus size={16} />
            Add Button
          </button>
        </div>
        
        <div className="space-y-2">
          {currentArticle.buttons?.map(button => (
            <div key={button.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
              <span className="text-sm font-medium">{button.label}</span>
              <button
                onClick={() => removeButton(currentArticle.id, button.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {showButtonConfig && (
          <ButtonConfigurator
            onSave={handleAddButton}
            onCancel={() => setShowButtonConfig(false)}
          />
        )}
      </div>
    </div>
  );
}

export default Editor;
