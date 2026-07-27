// Knowledge Base App
(function() {
    'use strict';

    const KB = {
        articles: {},
        directories: {},
        currentArticle: null,
        expandedDirs: new Set(),

        // Initialize
        init: function() {
            console.log('Initializing Knowledge Base...');
            this.loadStorage();
            this.bindEvents();
            this.renderTree();
            this.showEmptyState();
            console.log('KB initialized. Articles:', Object.keys(this.articles).length);
        },

        // Event Binding
        bindEvents: function() {
            $(document).on('click', '#newArticleBtn', () => this.newArticle());
            $(document).on('click', '#newDirBtn', () => this.newDirectory());
            $(document).on('input', '#searchInput', (e) => this.handleSearch($(e.target).val()));
            $(document).on('click', '#clearSearchBtn', () => this.clearSearch());
            $(document).on('click', '#editBtn', () => this.enterEdit());
            $(document).on('click', '#backBtn', () => this.exitEdit());
            $(document).on('click', '#saveBtn', () => this.saveArticle());
            $(document).on('click', '.editor-btn', (e) => this.editorAction($(e.target).closest('.editor-btn').data('action')));
            $(document).on('click', '#addButtonBtn', () => this.openButtonModal());
            $(document).on('click', '#saveButtonBtn', () => this.saveButton());
        },

        // Storage
        loadStorage: function() {
            const stored = localStorage.getItem('kb_data');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    this.articles = data.articles || {};
                    this.directories = data.directories || {};
                    console.log('Loaded from storage:', Object.keys(this.articles).length, 'articles');
                } catch (e) {
                    console.error('Load error:', e);
                }
            }
        },

        saveStorage: function() {
            const data = {
                articles: this.articles,
                directories: this.directories
            };
            localStorage.setItem('kb_data', JSON.stringify(data));
            console.log('Saved to storage');
            this.syncServer(data);
        },

        syncServer: function(data) {
            $.ajax({
                url: './server/api.php',
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: () => console.log('Server sync OK'),
                error: () => console.log('Server not available')
            });
        },

        // Article CRUD
        newArticle: function() {
            const title = prompt('Article name:');
            if (!title) return;

            const id = 'article_' + Date.now();
            this.articles[id] = {
                id,
                title,
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                buttons: []
            };
            this.currentArticle = this.articles[id];
            this.saveStorage();
            this.renderTree();
            this.enterEdit();
        },

        newDirectory: function() {
            const name = prompt('Directory name:');
            if (!name) return;

            const id = 'dir_' + Date.now();
            this.directories[id] = {
                id,
                name,
                children: [],
                createdAt: new Date().toISOString()
            };
            this.saveStorage();
            this.renderTree();
        },

        selectArticle: function(id) {
            this.currentArticle = this.articles[id];
            this.showViewer();
            this.renderTree();
        },

        deleteArticle: function(id) {
            if (!confirm('Delete article?')) return;
            delete this.articles[id];
            this.currentArticle = null;
            this.saveStorage();
            this.renderTree();
            this.showEmptyState();
        },

        deleteDirectory: function(id) {
            if (!confirm('Delete directory?')) return;
            delete this.directories[id];
            this.saveStorage();
            this.renderTree();
        },

        // Views
        showEmptyState: function() {
            $('#emptyState').show();
            $('#viewerView').hide();
            $('#editorView').hide();
            $('#searchResultsView').hide();
        },

        showViewer: function() {
            if (!this.currentArticle) {
                this.showEmptyState();
                return;
            }
            $('#emptyState').hide();
            $('#editorView').hide();
            $('#searchResultsView').hide();
            $('#viewerView').show();

            $('#viewerTitle').text(this.currentArticle.title);
            $('#viewerContent').html(this.currentArticle.content || '<p class="text-muted">No content</p>');
            this.renderViewerButtons();
        },

        enterEdit: function() {
            if (!this.currentArticle) return;
            $('#emptyState').hide();
            $('#viewerView').hide();
            $('#searchResultsView').hide();
            $('#editorView').show();

            $('#articleTitle').val(this.currentArticle.title);
            $('#editor').html(this.currentArticle.content);
            this.renderEditorButtons();
            $('#editor').focus();
        },

        exitEdit: function() {
            this.showViewer();
        },

        // Editor
        editorAction: function(action) {
            const editor = document.getElementById('editor');
            editor.focus();

            const actions = {
                'bold': 'bold',
                'italic': 'italic',
                'underline': 'underline',
                'strikethrough': 'strikethrough',
                'heading1': 'formatblock',
                'heading2': 'formatblock',
                'ul': 'insertUnorderedList',
                'ol': 'insertOrderedList',
                'blockquote': 'formatblock',
                'code': 'formatblock'
            };

            const cmd = actions[action];
            let value = null;

            if (action === 'heading1') value = 'h1';
            else if (action === 'heading2') value = 'h2';
            else if (action === 'blockquote') value = 'blockquote';
            else if (action === 'code') value = 'pre';

            if (value) {
                document.execCommand(cmd, false, '<' + value + '>');
            } else {
                document.execCommand(cmd, false);
            }
        },

        saveArticle: function() {
            if (!this.currentArticle) return;
            this.currentArticle.title = $('#articleTitle').val() || 'Untitled';
            this.currentArticle.content = $('#editor').html();
            this.currentArticle.updatedAt = new Date().toISOString();
            this.articles[this.currentArticle.id] = this.currentArticle;
            this.saveStorage();
            this.exitEdit();
        },

        // Search
        handleSearch: function(query) {
            if (!query.trim()) {
                this.showEmptyState();
                return;
            }
            const q = query.toLowerCase();
            const results = Object.values(this.articles).filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.content.toLowerCase().includes(q)
            );
            this.showSearchResults(results);
        },

        showSearchResults: function(results) {
            $('#emptyState').hide();
            $('#viewerView').hide();
            $('#editorView').hide();
            $('#searchResultsView').show();

            const list = $('#searchResultsList').empty();
            if (results.length === 0) {
                list.html('<p class="text-muted">No results found</p>');
                return;
            }
            results.forEach(article => {
                const preview = $('<div>').html(article.content).text().substring(0, 150);
                const item = $(`
                    <div class="result-item">
                        <h3>${this.escape(article.title)}</h3>
                        <p>${this.escape(preview)}</p>
                    </div>
                `);
                item.on('click', () => {
                    this.selectArticle(article.id);
                    $('#searchInput').val('');
                });
                list.append(item);
            });
        },

        clearSearch: function() {
            $('#searchInput').val('');
            this.showEmptyState();
        },

        // Buttons
        openButtonModal: function() {
            $('#buttonLabel').val('');
            $('#buttonCode').val('');
            new bootstrap.Modal(document.getElementById('buttonConfigModal')).show();
        },

        saveButton: function() {
            const label = $('#buttonLabel').val().trim();
            const code = $('#buttonCode').val().trim();

            if (!label) {
                alert('Label required');
                return;
            }
            if (!code) {
                alert('Code required');
                return;
            }

            try {
                new Function(code);
            } catch (e) {
                alert('Invalid JS: ' + e.message);
                return;
            }

            if (!this.currentArticle) return;
            this.currentArticle.buttons.push({
                id: 'btn_' + Date.now(),
                label,
                code
            });
            this.saveStorage();
            this.renderEditorButtons();
            bootstrap.Modal.getInstance(document.getElementById('buttonConfigModal')).hide();
        },

        deleteButton: function(btnId) {
            if (!this.currentArticle) return;
            this.currentArticle.buttons = this.currentArticle.buttons.filter(b => b.id !== btnId);
            this.saveStorage();
            this.renderEditorButtons();
        },

        executeButton: function(code) {
            try {
                eval(code);
            } catch (e) {
                alert('Error: ' + e.message);
            }
        },

        renderEditorButtons: function() {
            const container = $('#editorButtonsList').empty();
            if (!this.currentArticle.buttons) return;
            this.currentArticle.buttons.forEach(btn => {
                const tag = $(`
                    <div class="button-tag">
                        ${this.escape(btn.label)}
                        <button class="delete-btn" type="button" title="Delete">×</button>
                    </div>
                `);
                tag.find('.delete-btn').on('click', () => this.deleteButton(btn.id));
                container.append(tag);
            });
        },

        renderViewerButtons: function() {
            const container = $('#buttonsContainer').empty();
            if (!this.currentArticle.buttons || this.currentArticle.buttons.length === 0) {
                container.hide();
                return;
            }
            container.show();
            const btns = $('<div class="action-buttons"></div>');
            this.currentArticle.buttons.forEach(btn => {
                const btn_elem = $(`
                    <button class="action-btn" type="button">
                        <i class="fas fa-play"></i>
                        ${this.escape(btn.label)}
                    </button>
                `);
                btn_elem.on('click', () => this.executeButton(btn.code));
                btns.append(btn_elem);
            });
            container.html('<h5>Actions</h5>').append(btns);
        },

        // Tree
        renderTree: function() {
            const tree = $('#navTree').empty();
            const items = [];

            Object.values(this.directories).forEach(dir => {
                items.push({ ...dir, isDir: true });
            });
            Object.values(this.articles).forEach(article => {
                items.push({ ...article, isDir: false });
            });

            items.sort((a, b) => (b.isDir ? 1 : -1) - (a.isDir ? 1 : -1));
            items.forEach(item => tree.append(this.renderTreeItem(item)));
        },

        renderTreeItem: function(item) {
            const wrapper = $('<div class="tree-item"></div>');
            const isActive = this.currentArticle && this.currentArticle.id === item.id;
            const html = `
                <div class="tree-item-content ${isActive ? 'active' : ''}">
                    ${item.isDir ? '<button class="tree-toggle"><i class="fas fa-chevron-right"></i></button>' : '<span style="width:22px;"></span>'}
                    <div class="tree-item-icon">
                        <i class="fas ${item.isDir ? 'fa-folder' : 'fa-file-alt'}"></i>
                    </div>
                    <div class="tree-item-text">${this.escape(item.name || item.title)}</div>
                    <button class="tree-item-delete" type="button" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            const content = $(html);

            content.find('.tree-item-text').on('click', () => {
                if (!item.isDir) this.selectArticle(item.id);
            });

            content.find('.tree-item-delete').on('click', (e) => {
                e.stopPropagation();
                if (item.isDir) this.deleteDirectory(item.id);
                else this.deleteArticle(item.id);
            });

            wrapper.append(content);

            if (item.isDir) {
                const children = $('<div class="tree-children hidden"></div>');
                wrapper.append(children);
                content.find('.tree-toggle').on('click', (e) => {
                    e.stopPropagation();
                    children.toggleClass('hidden');
                    content.find('.tree-toggle i').toggleClass('fa-chevron-right fa-chevron-down');
                });
            }

            return wrapper;
        },

        // Utility
        escape: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize on ready
    $(document).ready(() => {
        KB.init();
    });
})();
