import React from 'react';
import { useKBStore } from '../store/kbStore';
import { Edit2, Play } from 'lucide-react';

function ArticleViewer({ onEdit }) {
  const { currentArticle } = useKBStore();

  if (!currentArticle) return null;

  const executeButtonCode = (code) => {
    try {
      // Create a safe function context with limited access
      const fn = new Function('alert', 'console', code);
      fn(window.alert, window.console);
    } catch (error) {
      alert('Error executing button code: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{currentArticle.title}</h1>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          <Edit2 size={18} />
          Edit
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl">
          {currentArticle.content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentArticle.content }}
            />
          ) : (
            <p className="text-gray-500">No content yet</p>
          )}
        </div>
      </div>

      {/* Custom Buttons */}
      {currentArticle.buttons && currentArticle.buttons.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {currentArticle.buttons.map(button => (
              <button
                key={button.id}
                onClick={() => executeButtonCode(button.code)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
              >
                <Play size={16} />
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleViewer;
