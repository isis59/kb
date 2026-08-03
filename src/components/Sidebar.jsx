import React, { useEffect, useMemo } from 'react';
import { useKBStore } from '../store/kbStore';
import { ChevronRight, ChevronDown, FileText, Folder, Trash2 } from 'lucide-react';

const TreeNode = ({ item, isDirectory, expanded, onToggle, onSelect, onDelete, isActive, children }) => {
  return (
    <div className="select-none">
      <div
        onClick={() => (isDirectory ? onToggle() : onSelect(item))}
        className={`flex items-center gap-1 p-2 rounded cursor-pointer group ${
          isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        }`}
      >
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
        
        <span className={`flex-1 text-sm ${isActive ? 'font-medium' : 'text-gray-700 hover:text-gray-900'}`}>
          {item.title || item.name}
        </span>
        
        {!isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      
      {isDirectory && expanded && (
        <div className="pl-4 border-l border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

function Sidebar() {
  const { articles, directories, currentArticle, setCurrentArticle, deleteArticle } = useKBStore();
  const [expandedDirs, setExpandedDirs] = React.useState(new Set());

  const rootItems = useMemo(() => {
    const items = [...Object.values(directories), ...Object.values(articles)];
    const childrenByParent = new Map();

    items.forEach(item => {
      const parentId = item.parentId || null;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(item);
    });

    const sortItems = (a, b) =>
      (b.id in directories ? 1 : 0) - (a.id in directories ? 1 : 0) ||
      (a.title || a.name).localeCompare(b.title || b.name);

    childrenByParent.forEach(children => children.sort(sortItems));
    return { root: childrenByParent.get(null) || [], childrenByParent };
  }, [articles, directories]);

  useEffect(() => {
    if (!currentArticle || !currentArticle.parentId) return;

    const ancestors = new Set();
    let parentId = currentArticle.parentId;
    while (parentId && directories[parentId]) {
      ancestors.add(parentId);
      parentId = directories[parentId].parentId;
    }

    setExpandedDirs(previous => {
      const next = new Set(previous);
      ancestors.forEach(id => next.add(id));
      return next;
    });
  }, [currentArticle, directories]);

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

  const renderNode = (item) => {
    const isDirectory = Boolean(directories[item.id]);
    return (
      <TreeNode
        key={item.id}
        item={item}
        isDirectory={isDirectory}
        expanded={expandedDirs.has(item.id)}
        onToggle={() => toggleDir(item.id)}
        onSelect={setCurrentArticle}
        onDelete={handleDelete}
        isActive={!isDirectory && currentArticle?.id === item.id}
      >
        {isDirectory && rootItems.childrenByParent.get(item.id)?.map(renderNode)}
      </TreeNode>
    );
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
          rootItems.root.map(renderNode)
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
