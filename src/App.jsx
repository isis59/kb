import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ArticleViewer from './components/ArticleViewer';
import SearchBar from './components/SearchBar';
import { useKBStore } from './store/kbStore';
import { FileText, FolderPlus, FilePlus } from 'lucide-react';

function App() {
  const { currentArticle, articles, directories, loadKB, saveKB, createArticle, createDirectory } = useKBStore();
  const [isEditing, setIsEditing] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Load KB on mount
  useEffect(() => {
    loadKB();
  }, [loadKB]);

  const handleNewArticle = () => {
    const name = prompt('Article name:');
    if (name) {
      createArticle(name, currentArticle?.id);
    }
  };

  const handleNewDirectory = () => {
    const name = prompt('Directory name:');
    if (name) {
      createDirectory(name, currentArticle?.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <SearchBar onSearch={setSearchResults} />
            <div className="flex gap-2">
              <button
                onClick={handleNewDirectory}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                <FolderPlus size={18} />
                New Directory
              </button>
              <button
                onClick={handleNewArticle}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <FilePlus size={18} />
                New Article
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {searchResults ? (
            <div className="p-6 overflow-auto h-full">
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <div className="space-y-4">
                {searchResults.length === 0 ? (
                  <p className="text-gray-500">No results found</p>
                ) : (
                  searchResults.map(result => (
                    <div key={result.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md cursor-pointer">
                      <h3 className="font-semibold text-lg">{result.title}</h3>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{result.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : isEditing && currentArticle ? (
            <Editor onClose={() => setIsEditing(false)} />
          ) : currentArticle ? (
            <ArticleViewer onEdit={() => setIsEditing(true)} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select an article or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
