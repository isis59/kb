import React, { useMemo } from 'react';
import { useKBStore } from '../store/kbStore';
import { ChevronRight, ChevronDown, FileText, Folder, Trash2 } from 'lucide-react';

const TreeNode = ({ item, isDirectory, expanded, onToggle, onSelect, onDelete }) => {
  return (
    <div className="select-none">
      <div className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded cursor-pointer group">
        {isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0 w-5 h-5 flex items-center justify-center"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!isDirectory && <div className="w-5" />}
        
        {isDirectory ? <Folder size={16} /> : <FileText size={16} />}
        
        <span
          onClick={() => onSelect(item)}
          className="flex-1 text-sm text-gray-700 hover:text-gray-900"
        >
          {item.title || item.name}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      {isDirectory && expanded && item.children && (
        <div className="pl-4 border-l border-gray-200">
          {item.children.map(childId => <div key={childId}>Child items here</div>)}
        </div>
      )}
    </div>
  );
};

function Sidebar() {
  const { articles, directories, setCurrentArticle, deleteArticle } = useKBStore();
  const [expandedDirs, setExpandedDirs] = React.useState(new Set());

  const rootItems = useMemo(() => {
    const items = [];
    
    // Add root directories
    Object.values(directories).forEach(dir => {
      if (!dir.parentId) {
        items.push({ ...dir, isDirectory: true });
      }
    });
    
    // Add root articles
    Object.values(articles).forEach(article => {
      if (!article.parentId) {
        items.push({ ...article, isDirectory: false });
      }
    });
    
    return items.sort((a, b) => (b.isDirectory ? 1 : -1) - (a.isDirectory ? 1 : -1));
  }, [articles, directories]);

  const toggleDir = (id) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDirs(newExpanded);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure?')) {
      deleteArticle(id);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
      </div>
      
      <nav className="p-2">
        {rootItems.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No articles yet</p>
        ) : (
          rootItems.map(item => (
            <TreeNode
              key={item.id}
              item={item}
              isDirectory={item.isDirectory}
              expanded={expandedDirs.has(item.id)}
              onToggle={() => toggleDir(item.id)}
              onSelect={setCurrentArticle}
              onDelete={handleDelete}
            />
          ))
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
