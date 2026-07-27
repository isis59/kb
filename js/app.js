// Knowledge Base App with Variables & Checkboxes
(function() {
    'use strict';

    const KB = {
        articles: {},
        directories: {},
        currentArticle: null,
        globalVariables: {},
        globalCheckboxes: {},
        globalButtons: {},
        editingItem: null, // Track what's being edited

        // Initialize
        init: function() {
            console.log('Initializing KB...');
            this.loadStorage();
            this.bindEvents();
            this.renderTree();
            this.showEmptyState();
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
            
            // Variables
            $(document).on('click', '#addVariableBtn', () => this.openVariableModal());
            $(document).on('click', '#saveVariableBtn', () => this.saveVariable());
            $(document).on('click', '.edit-variable-btn', (e) => this.editVariable($(e.target).data('name')));
            
            // Checkboxes
            $(document).on('click', '#addCheckboxBtn', () => this.openCheckboxModal());
            $(document).on('click', '#saveCheckboxBtn', () => this.saveCheckbox());
            $(document).on('click', '.edit-checkbox-btn', (e) => this.editCheckbox($(e.target).data('name')));
            $(document).on('click', '#addGlobalCheckboxBtn', () => this.openGlobalCheckboxModal());
            $(document).on('click', '#saveGlobalCheckboxBtn', () => this.saveGlobalCheckbox());
            
            // Buttons
            $(document).on('click', '#addButtonBtn', () => this.openButtonModal());
            $(document).on('click', '#saveButtonBtn', () => this.saveButton());
            $(document).on('click', '.edit-button-btn', (e) => this.editButton($(e.target).data('id')));
            
            // Viewer interactions
            $(document).on('input', '.viewer-variable', () => this.updatePreview());
            $(document).on('change', '.viewer-checkbox', () => this.updatePreview());
        },

        // Storage
        loadStorage: function() {
            const stored = localStorage.getItem('kb_data');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    this.articles = data.articles || {};
                    this.directories = data.directories || {};
                    this.globalVariables = data.globalVariables || {};
                    this.globalCheckboxes = data.globalCheckboxes || {};
                    this.globalButtons = data.globalButtons || {};
                    // Normalize articles
                    Object.values(this.articles).forEach(article => {
                        article.variables = article.variables || [];
                        article.checkboxes = article.checkboxes || [];
                        article.buttons = article.buttons || [];
                    });
                    console.log('Loaded:', Object.keys(this.articles).length, 'articles');
                } catch (e) {
                    console.error('Load error:', e);
                }
            }
        },

        saveStorage: function() {
            const data = { 
                articles: this.articles, 
                directories: this.directories,
                globalVariables: this.globalVariables,
                globalCheckboxes: this.globalCheckboxes,
                globalButtons: this.globalButtons
            };
            localStorage.setItem('kb_data', JSON.stringify(data));
            this.syncServer(data);
        },

        syncServer: function(data) {
            $.ajax({
                url: './server/api.php',
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                error: () => {}
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
                folderId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                variables: [],
                checkboxes: [],
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
            this.renderViewerVariables();
            this.renderViewerCheckboxes();
            this.renderViewerButtons();
            this.updatePreview();
        },

        enterEdit: function() {
            if (!this.currentArticle) return;
            $('#emptyState').hide();
            $('#viewerView').hide();
            $('#searchResultsView').hide();
            $('#editorView').show();

            $('#articleTitle').val(this.currentArticle.title);
            this.updateFolderSelect();
            if (this.currentArticle.folderId) {
                $('#articleFolder').val(this.currentArticle.folderId);
            }
            $('#editor').html(this.currentArticle.content);
            this.renderEditorVariables();
            this.renderEditorCheckboxes();
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
                'bold': 'bold', 'italic': 'italic', 'underline': 'underline',
                'strikethrough': 'strikethrough', 'heading1': 'formatblock',
                'heading2': 'formatblock', 'ul': 'insertUnorderedList',
                'ol': 'insertOrderedList', 'blockquote': 'formatblock',
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
            this.currentArticle.folderId = $('#articleFolder').val() || null;
            this.currentArticle.content = $('#editor').html();
            this.currentArticle.updatedAt = new Date().toISOString();
            this.articles[this.currentArticle.id] = this.currentArticle;
            this.saveStorage();
            this.exitEdit();
        },

        // Variables
        openVariableModal: function() {
            this.editingItem = null;
            $('#variableName').val('').prop('disabled', false);
            $('#variableLabel').val('');
            $('#variablePlaceholder').val('');
            $('#variableModalLabel').text('Add Variable');
            new bootstrap.Modal(document.getElementById('variableConfigModal')).show();
        },

        editVariable: function(name) {
            const variable = this.currentArticle.variables.find(v => v.name === name);
            if (!variable) return;
            this.editingItem = { type: 'variable', name: name };
            $('#variableName').val(name).prop('disabled', true);
            $('#variableLabel').val(variable.label);
            $('#variablePlaceholder').val(variable.placeholder || '');
            $('#variableModalLabel').text('Edit Variable');
            new bootstrap.Modal(document.getElementById('variableConfigModal')).show();
        },

        saveVariable: function() {
            const name = $('#variableName').val().trim();
            const label = $('#variableLabel').val().trim();
            const placeholder = $('#variablePlaceholder').val().trim();
            
            if (!name) { alert('Variable name required'); return; }
            if (!label) { alert('Label required'); return; }
            
            if (!this.currentArticle) return;
            
            if (this.editingItem && this.editingItem.type === 'variable') {
                // Edit existing
                const idx = this.currentArticle.variables.findIndex(v => v.name === name);
                if (idx >= 0) {
                    this.currentArticle.variables[idx] = { name, label, placeholder, value: this.currentArticle.variables[idx].value };
                }
                this.editingItem = null;
            } else {
                // Add new
                if (this.currentArticle.variables.some(v => v.name === name)) {
                    alert('Variable already exists');
                    return;
                }
                this.currentArticle.variables.push({ name, label, placeholder, value: '' });
            }
            
            this.saveStorage();
            this.renderEditorVariables();
            bootstrap.Modal.getInstance(document.getElementById('variableConfigModal')).hide();
        },

        deleteVariable: function(varName) {
            if (!this.currentArticle) return;
            this.currentArticle.variables = this.currentArticle.variables.filter(v => v.name !== varName);
            this.saveStorage();
            this.renderEditorVariables();
        },

        renderEditorVariables: function() {
            const container = $('#editorVariablesList').empty();
            if (!this.currentArticle || !this.currentArticle.variables) return;
            this.currentArticle.variables.forEach(v => {
                const tag = $(`
                    <div class="tag">
                        {{${this.escape(v.name)}}}
                        <button class="edit-variable-btn" type="button" title="Edit" data-name="${this.escape(v.name)}">✎</button>
                        <button class="delete-btn" type="button" title="Delete">×</button>
                    </div>
                `);
                tag.find('.delete-btn').on('click', () => this.deleteVariable(v.name));
                container.append(tag);
            });
        },

        renderViewerVariables: function() {
            const container = $('#viewerVariablesPanel').empty();
            if (!this.currentArticle || !this.currentArticle.variables || this.currentArticle.variables.length === 0) {
                container.hide();
                return;
            }
            container.show();
            const grid = $('<div class="variables-grid"></div>');
            this.currentArticle.variables.forEach(v => {
                const group = $(`
                    <div class="variable-input-group">
                        <label>${this.escape(v.label)}</label>
                        <input type="text" class="viewer-variable" data-var="${this.escape(v.name)}" placeholder="${this.escape(v.placeholder)}" value="${this.escape(v.value || '')}">
                    </div>
                `);
                grid.append(group);
            });
            container.append(grid);
        },

        // Checkboxes
        openCheckboxModal: function() {
            this.editingItem = null;
            $('#checkboxName').val('').prop('disabled', false);
            $('#checkboxLabel').val('');
            $('#checkboxContent').val('');
            $('#checkboxModalLabel').text('Add Checkbox');
            new bootstrap.Modal(document.getElementById('checkboxConfigModal')).show();
        },

        editCheckbox: function(name) {
            const checkbox = this.currentArticle.checkboxes.find(c => c.name === name);
            if (!checkbox) return;
            this.editingItem = { type: 'checkbox', name: name };
            $('#checkboxName').val(name).prop('disabled', true);
            $('#checkboxLabel').val(checkbox.label);
            $('#checkboxContent').val(checkbox.content);
            $('#checkboxModalLabel').text('Edit Checkbox');
            new bootstrap.Modal(document.getElementById('checkboxConfigModal')).show();
        },

        saveCheckbox: function() {
            const name = $('#checkboxName').val().trim();
            const label = $('#checkboxLabel').val().trim();
            const content = $('#checkboxContent').val().trim();
            
            if (!name) { alert('Checkbox name required'); return; }
            if (!label) { alert('Label required'); return; }
            if (!content) { alert('Content required'); return; }
            
            if (!this.currentArticle) return;
            
            if (this.editingItem && this.editingItem.type === 'checkbox') {
                // Edit existing
                const idx = this.currentArticle.checkboxes.findIndex(c => c.name === name);
                if (idx >= 0) {
                    this.currentArticle.checkboxes[idx] = { name, label, content, checked: this.currentArticle.checkboxes[idx].checked };
                }
                this.editingItem = null;
            } else {
                // Add new
                if (this.currentArticle.checkboxes.some(c => c.name === name)) {
                    alert('Checkbox already exists');
                    return;
                }
                this.currentArticle.checkboxes.push({ name, label, content, checked: false });
            }
            
            this.saveStorage();
            this.renderEditorCheckboxes();
            bootstrap.Modal.getInstance(document.getElementById('checkboxConfigModal')).hide();
        },

        deleteCheckbox: function(cbName) {
            if (!this.currentArticle) return;
            this.currentArticle.checkboxes = this.currentArticle.checkboxes.filter(c => c.name !== cbName);
            this.saveStorage();
            this.renderEditorCheckboxes();
        },

        renderEditorCheckboxes: function() {
            const container = $('#editorCheckboxesList').empty();
            if (!this.currentArticle || !this.currentArticle.checkboxes) return;
            this.currentArticle.checkboxes.forEach(c => {
                const tag = $(`
                    <div class="tag">
                        {{${this.escape(c.name)}-content}}
                        <button class="edit-checkbox-btn" type="button" title="Edit" data-name="${this.escape(c.name)}">✎</button>
                        <button class="delete-btn" type="button" title="Delete">×</button>
                    </div>
                `);
                tag.find('.delete-btn').on('click', () => this.deleteCheckbox(c.name));
                container.append(tag);
            });
            
            // Add option to add from global
            if (Object.keys(this.globalCheckboxes).length > 0) {
                container.append($('<button id="addGlobalCheckboxBtn" class="btn btn-sm btn-secondary mt-2">+ From Library</button>'));
            }
        },

        openGlobalCheckboxModal: function() {
            const list = $('<div class="global-checkbox-list"></div>');
            Object.entries(this.globalCheckboxes).forEach(([id, cb]) => {
                const alreadyAdded = this.currentArticle.checkboxes.some(c => c.name === cb.name);
                const item = $(`
                    <div class="checkbox-item" style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; cursor: pointer; ${alreadyAdded ? 'background-color: #f0f0f0;' : ''}">
                        <strong>${this.escape(cb.label)}</strong>
                        <p style="margin: 5px 0; font-size: 0.9em; color: #666;">${this.escape(cb.content.substring(0, 50))}${cb.content.length > 50 ? '...' : ''}</p>
                        ${alreadyAdded ? '<span style="color: #999;">✓ Already added</span>' : ''}
                    </div>
                `);
                if (!alreadyAdded) {
                    item.on('click', () => {
                        this.currentArticle.checkboxes.push({ name: cb.name, label: cb.label, content: cb.content, checked: false });
                        this.saveStorage();
                        this.renderEditorCheckboxes();
                        bootstrap.Modal.getInstance(document.getElementById('globalCheckboxModal')).hide();
                    });
                }
                list.append(item);
            });
            $('#globalCheckboxList').html(list);
            new bootstrap.Modal(document.getElementById('globalCheckboxModal')).show();
        },

        saveGlobalCheckbox: function() {
            const label = $('#globalCheckboxLabel').val().trim();
            const content = $('#globalCheckboxContent').val().trim();
            
            if (!label) { alert('Label required'); return; }
            if (!content) { alert('Content required'); return; }
            
            const id = 'gchk_' + Date.now();
            this.globalCheckboxes[id] = { label, content, createdAt: new Date().toISOString() };
            this.saveStorage();
            
            $('#globalCheckboxLabel').val('');
            $('#globalCheckboxContent').val('');
            bootstrap.Modal.getInstance(document.getElementById('globalCheckboxModal')).hide();
            alert('Checkbox added to library!');
        },

        renderViewerCheckboxes: function() {
            const container = $('#viewerCheckboxesPanel').empty();
            if (!this.currentArticle || !this.currentArticle.checkboxes || this.currentArticle.checkboxes.length === 0) {
                container.hide();
                return;
            }
            container.show();
            const grid = $('<div class="checkboxes-grid"></div>');
            this.currentArticle.checkboxes.forEach(c => {
                const group = $(`
                    <div class="checkbox-input-group">
                        <input type="checkbox" class="viewer-checkbox" data-checkbox="${this.escape(c.name)}" ${c.checked ? 'checked' : ''}>
                        <label>${this.escape(c.label)}</label>
                    </div>
                `);
                grid.append(group);
            });
            container.append(grid);
        },

        updatePreview: function() {
            if (!this.currentArticle) return;
            
            // Update variable values
            if (this.currentArticle.variables) {
                this.currentArticle.variables.forEach(v => {
                    v.value = $(`.viewer-variable[data-var="${v.name}"]`).val() || '';
                });
            }
            
            // Update checkbox states
            if (this.currentArticle.checkboxes) {
                this.currentArticle.checkboxes.forEach(c => {
                    c.checked = $(`.viewer-checkbox[data-checkbox="${c.name}"]`).is(':checked');
                });
            }
            
            // Process content
            let content = this.currentArticle.content;
            
            // Replace variables
            if (this.currentArticle.variables) {
                this.currentArticle.variables.forEach(v => {
                    const regex = new RegExp('{{' + v.name + '}}', 'g');
                    content = content.replace(regex, this.escape(v.value));
                });
            }
            
            // Replace conditional checkboxes
            if (this.currentArticle.checkboxes) {
                this.currentArticle.checkboxes.forEach(c => {
                    const regex = new RegExp('{{' + c.name + '-content}}', 'g');
                    content = content.replace(regex, c.checked ? this.escape(c.content) : '');
                });
            }
            
            $('#viewerContent').html(content);
        },

        // Buttons
        openButtonModal: function() {
            this.editingItem = null;
            $('#buttonLabel').val('');
            $('#buttonCode').val('');
            $('#buttonModalLabel').text('Add Button');
            new bootstrap.Modal(document.getElementById('buttonConfigModal')).show();
        },

        editButton: function(btnId) {
            const button = this.currentArticle.buttons.find(b => b.id === btnId);
            if (!button) return;
            this.editingItem = { type: 'button', id: btnId };
            $('#buttonLabel').val(button.label);
            $('#buttonCode').val(button.code);
            $('#buttonModalLabel').text('Edit Button');
            new bootstrap.Modal(document.getElementById('buttonConfigModal')).show();
        },

        saveButton: function() {
            const label = $('#buttonLabel').val().trim();
            const code = $('#buttonCode').val().trim();
            if (!label) { alert('Label required'); return; }
            if (!code) { alert('Code required'); return; }
            try { new Function(code); }
            catch (e) { alert('Invalid JS: ' + e.message); return; }
            if (!this.currentArticle) return;
            
            if (this.editingItem && this.editingItem.type === 'button') {
                // Edit existing
                const idx = this.currentArticle.buttons.findIndex(b => b.id === this.editingItem.id);
                if (idx >= 0) {
                    this.currentArticle.buttons[idx] = { id: this.editingItem.id, label, code };
                }
                this.editingItem = null;
            } else {
                // Add new
                this.currentArticle.buttons.push({ id: 'btn_' + Date.now(), label, code });
            }
            
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
            try { eval(code); }
            catch (e) { alert('Error: ' + e.message); }
        },

        renderEditorButtons: function() {
            const container = $('#editorButtonsList').empty();
            if (!this.currentArticle || !this.currentArticle.buttons) return;
            this.currentArticle.buttons.forEach(btn => {
                const tag = $(`
                    <div class="tag">
                        ${this.escape(btn.label)}
                        <button class="edit-button-btn" type="button" title="Edit" data-id="${btn.id}">✎</button>
                        <button class="delete-btn" type="button" title="Delete">×</button>
                    </div>
                `);
                tag.find('.delete-btn').on('click', () => this.deleteButton(btn.id));
                container.append(tag);
            });
        },

        renderViewerButtons: function() {
            const container = $('#buttonsContainer').empty();
            if (!this.currentArticle || !this.currentArticle.buttons || this.currentArticle.buttons.length === 0) {
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

        // Folder Selection
        updateFolderSelect: function() {
            const select = $('#articleFolder');
            select.empty().append($('<option value="">Root</option>'));
            Object.values(this.directories).forEach(dir => {
                select.append($(`<option value="${dir.id}">${this.escape(dir.name)}</option>`));
            });
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

        // Tree
        renderTree: function() {
            const tree = $('#navTree').empty();
            
            // First, render directories with their nested articles
            Object.values(this.directories).forEach(dir => {
                const dirElement = this.renderTreeItem({ ...dir, isDir: true });
                tree.append(dirElement);
                
                // Find articles that belong to this directory
                const childArticles = Object.values(this.articles).filter(a => a.folderId === dir.id);
                
                // Add articles as children of the directory
                if (childArticles.length > 0) {
                    const childrenContainer = dirElement.find('.tree-children');
                    childArticles.forEach(article => {
                        const articleElement = this.renderTreeItem({ ...article, isDir: false });
                        childrenContainer.append(articleElement);
                    });
                }
            });
            
            // Then, render root-level articles (those without a folder)
            const rootArticles = Object.values(this.articles).filter(a => !a.folderId);
            rootArticles.forEach(article => {
                const articleElement = this.renderTreeItem({ ...article, isDir: false });
                tree.append(articleElement);
            });
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

    $(document).ready(() => KB.init());
})();
