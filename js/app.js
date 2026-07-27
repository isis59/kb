// Knowledge Base Application
class KnowledgeBase {
    constructor() {
        this.currentArticle = null;
        this.articles = {};
        this.directories = {};
        this.currentButtons = [];
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderTree();
        this.showEmptyState();
    }

    setupEventListeners() {
        // Sidebar actions
        $(document).on('click', '#newArticleBtn', () => this.newArticle());
        $(document).on('click', '#newDirBtn', () => this.newDirectory());

        // Search
        $(document).on('input', '#searchInput', (e) => this.handleSearch($(e.target).val()));
        $(document).on('click', '#clearSearchBtn', () => this.clearSearch());

        // Editor actions
        $(document).on('click', '#editBtn', () => this.enterEditMode());
        $(document).on('click', '#backBtn', () => this.exitEditMode());
        $(document).on('click', '#saveBtn', () => this.saveArticle());

        // Editor toolbar
        $(document).on('click', '.editor-btn', (e) => this.editorAction($(e.currentTarget).data('action')));

        // Buttons
        $(document).on('click', '#addButtonBtn', () => this.openButtonConfig());
        $(document).on('click', '#saveButtonBtn', () => this.saveButton());
    }

    // Storage Methods
    saveToStorage() {
        const data = {
            articles: this.articles,
            directories: this.directories
        };
        localStorage.setItem('kb_data', JSON.stringify(data));
        this.syncToServer(data);
    }

    loadFromStorage() {
        const stored = localStorage.getItem('kb_data');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.articles = data.articles || {};
                this.directories = data.directories || {};
            } catch (e) {
                console.error('Failed to load from storage', e);
            }
        }
    }

    syncToServer(data) {
        // Try to sync with PHP backend
        $.ajax({
            url: './server/api.php?action=save',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            error: () => {
                // Server not available, continue with localStorage
            }
        });
    }

    // Article Methods
    newArticle() {
        const title = prompt('Article name:');
        if (title) {
            const id = 'article_' + Date.now();
            this.articles[id] = {
                id,
                title,
                content: '',
                parentId: this.currentArticle?.parentId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                buttons: []
            };
            this.currentArticle = this.articles[id];
            this.saveToStorage();
            this.renderTree();
            this.enterEditMode();
        }
    }

    newDirectory() {
        const name = prompt('Directory name:');
        if (name) {
            const id = 'dir_' + Date.now();
            this.directories[id] = {
                id,
                name,
                parentId: this.currentArticle?.parentId || null,
                children: [],
                createdAt: new Date().toISOString()
            };
            this.saveToStorage();
            this.renderTree();
        }
    }

    selectArticle(id) {
        this.currentArticle = this.articles[id];
        this.currentButtons = this.articles[id]?.buttons || [];
        this.showViewer();
        this.renderTree();
    }

    deleteArticle(id) {
        if (confirm('Are you sure?')) {
            delete this.articles[id];
            this.currentArticle = null;
            this.saveToStorage();
            this.renderTree();
            this.showEmptyState();
        }
    }

    deleteDirectory(id) {
        if (confirm('Are you sure?')) {
            delete this.directories[id];
            this.saveToStorage();
            this.renderTree();
        }
    }

    saveArticle() {
        if (!this.currentArticle) return;

        this.currentArticle.title = $('#articleTitle').val() || this.currentArticle.title;
        this.currentArticle.content = $('#editor').html();
        this.currentArticle.updatedAt = new Date().toISOString();

        this.articles[this.currentArticle.id] = this.currentArticle;
        this.saveToStorage();
        this.exitEditMode();
    }

    // View Methods
    showViewer() {
        if (!this.currentArticle) {
            this.showEmptyState();
            return;
        }

        $('#searchResultsView').hide();
        $('#emptyState').hide();
        $('#editorView').hide();
        $('#viewerView').show();

        $('#viewerTitle').text(this.currentArticle.title);
        $('#viewerContent').html(this.currentArticle.content || '<p>No content</p>');
        this.renderViewerButtons();
    }

    showEmptyState() {
        $('#searchResultsView').hide();
        $('#editorView').hide();
        $('#viewerView').hide();
        $('#emptyState').show();
    }

    enterEditMode() {
        if (!this.currentArticle) return;

        $('#editorView').show();
        $('#viewerView').hide();
        $('#searchResultsView').hide();
        $('#emptyState').hide();

        $('#articleTitle').val(this.currentArticle.title);
        $('#editor').html(this.currentArticle.content || '');
        this.renderEditorButtons();
    }

    exitEditMode() {
        this.showViewer();
    }

    // Editor Actions
    editorAction(action) {
        const editor = document.getElementById('editor');
        editor.focus();

        const commands = {
            bold: () => document.execCommand('bold'),
            italic: () => document.execCommand('italic'),
            underline: () => document.execCommand('underline'),
            strikethrough: () => document.execCommand('strikethrough'),
            heading1: () => document.execCommand('formatblock', false, '<h1>'),
            heading2: () => document.execCommand('formatblock', false, '<h2>'),
            ul: () => document.execCommand('insertUnorderedList'),
            ol: () => document.execCommand('insertOrderedList'),
            blockquote: () => document.execCommand('formatblock', false, '<blockquote>'),
            code: () => document.execCommand('formatblock', false, '<pre>')
        };

        if (commands[action]) {
            commands[action]();
        }
    }

    // Search Methods
    handleSearch(query) {
        if (!query.trim()) {
            this.showEmptyState();
            return;
        }

        const results = this.fuzzySearch(query);
        this.showSearchResults(results);
    }

    fuzzySearch(query) {
        const q = query.toLowerCase();
        return Object.values(this.articles)
            .filter(article => 
                article.title.toLowerCase().includes(q) ||
                article.content.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const aTitle = a.title.toLowerCase().indexOf(q);
                const bTitle = b.title.toLowerCase().indexOf(q);
                if (aTitle !== bTitle) return aTitle - bTitle;
                return b.updatedAt.localeCompare(a.updatedAt);
            });
    }

    showSearchResults(results) {
        $('#editorView').hide();
        $('#viewerView').hide();
        $('#emptyState').hide();
        $('#searchResultsView').show();

        const list = $('#searchResultsList');
        list.empty();

        if (results.length === 0) {
            list.html('<p class="text-muted">No results found</p>');
            return;
        }

        results.forEach(article => {
            const preview = $('<div>').html(article.content).text().substring(0, 150);
            const item = $(`
                <div class="result-item">
                    <h3>${this.escapeHtml(article.title)}</h3>
                    <p>${this.escapeHtml(preview)}</p>
                </div>
            `);
            item.on('click', () => {
                this.selectArticle(article.id);
                $('#searchInput').val('');
            });
            list.append(item);
        });
    }

    clearSearch() {
        $('#searchInput').val('');
        this.showEmptyState();
    }

    // Button Methods
    openButtonConfig() {
        $('#buttonLabel').val('');
        $('#buttonCode').val('');
        new bootstrap.Modal(document.getElementById('buttonConfigModal')).show();
    }

    saveButton() {
        const label = $('#buttonLabel').val();
        const code = $('#buttonCode').val();

        if (!label.trim()) {
            alert('Button label is required');
            return;
        }
        if (!code.trim()) {
            alert('Button code is required');
            return;
        }

        // Validate JavaScript
        try {
            new Function(code);
        } catch (e) {
            alert('Invalid JavaScript: ' + e.message);
            return;
        }

        if (!this.currentArticle) return;

        this.currentArticle.buttons.push({
            id: 'btn_' + Date.now(),
            label,
            code
        });

        this.articles[this.currentArticle.id] = this.currentArticle;
        this.saveToStorage();
        this.renderEditorButtons();
        bootstrap.Modal.getInstance(document.getElementById('buttonConfigModal')).hide();
    }

    deleteButton(buttonId) {
        if (!this.currentArticle) return;
        this.currentArticle.buttons = this.currentArticle.buttons.filter(b => b.id !== buttonId);
        this.articles[this.currentArticle.id] = this.currentArticle;
        this.saveToStorage();
        this.renderEditorButtons();
    }

    executeButton(code) {
        try {
            eval(code);
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    renderEditorButtons() {
        const container = $('#editorButtonsList');
        container.empty();

        this.currentArticle.buttons.forEach(button => {
            const tag = $(`
                <div class="button-tag">
                    ${this.escapeHtml(button.label)}
                    <button class="delete-btn" type="button" title="Delete">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `);
            tag.find('.delete-btn').on('click', () => this.deleteButton(button.id));
            container.append(tag);
        });
    }

    renderViewerButtons() {
        const container = $('#buttonsContainer');
        container.empty();

        if (!this.currentArticle.buttons || this.currentArticle.buttons.length === 0) {
            container.hide();
            return;
        }

        container.show();
        const buttonsList = $('<div class="action-buttons"></div>');

        this.currentArticle.buttons.forEach(button => {
            const btn = $(`
                <button class="action-btn" type="button">
                    <i class="fas fa-play"></i>
                    ${this.escapeHtml(button.label)}
                </button>
            `);
            btn.on('click', () => this.executeButton(button.code));
            buttonsList.append(btn);
        });

        container.html('<h5>Actions</h5>').append(buttonsList);
    }

    // Tree Rendering
    renderTree() {
        const tree = $('#navTree');
        tree.empty();

        const rootItems = [];
        
        // Add directories
        Object.values(this.directories).forEach(dir => {
            if (!dir.parentId) {
                rootItems.push({ ...dir, isDir: true });
            }
        });

        // Add articles
        Object.values(this.articles).forEach(article => {
            if (!article.parentId) {
                rootItems.push({ ...article, isDir: false });
            }
        });

        // Sort: directories first
        rootItems.sort((a, b) => (b.isDir ? 1 : -1) - (a.isDir ? 1 : -1));

        rootItems.forEach(item => {
            tree.append(this.renderTreeItem(item));
        });
    }

    renderTreeItem(item) {
        const wrapper = $('<div class="tree-item"></div>');
        
        const content = $(`
            <div class="tree-item-content ${this.currentArticle?.id === item.id ? 'active' : ''}">
                ${item.isDir ? '<button class="tree-toggle"><i class="fas fa-chevron-right"></i></button>' : '<div class="tree-toggle"></div>'}
                <div class="tree-item-icon">
                    <i class="fas ${item.isDir ? 'fa-folder' : 'fa-file-alt'}"></i>
                </div>
                <div class="tree-item-text">${this.escapeHtml(item.name || item.title)}</div>
                <button class="tree-item-delete" type="button" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `);

        content.find('.tree-item-text').on('click', () => {
            if (item.isDir) {
                // Could implement directory selection here
            } else {
                this.selectArticle(item.id);
            }
        });

        content.find('.tree-item-delete').on('click', (e) => {
            e.stopPropagation();
            if (item.isDir) {
                this.deleteDirectory(item.id);
            } else {
                this.deleteArticle(item.id);
            }
        });

        if (item.isDir) {
            const toggle = content.find('.tree-toggle');
            const children = $('<div class="tree-children"></div>');
            wrapper.append(content, children);

            toggle.on('click', (e) => {
                e.stopPropagation();
                children.toggleClass('hidden');
                toggle.find('i').toggleClass('fa-chevron-right fa-chevron-down');
            });
        } else {
            wrapper.append(content);
        }

        return wrapper;
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when document is ready
$(document).ready(() => {
    window.kb = new KnowledgeBase();
});
