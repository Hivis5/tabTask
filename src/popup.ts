interface Task {
    id: string;
    text: string;
    completed: boolean;
    type: 'global' | 'url';
    url?: string;
    fullUrl?: string;
    createdAt: number;
}

interface StorageData {
    tasks?: Task[] | string;
    cryptoKey?: JsonWebKey;
}

class TodoApp {
    private tasks: Task[] = [];
    private currentUrl: string = '';
    private currentFullUrl: string = '';
    private currentDomain: string = '';
    private isGlobalMode: boolean = false;
    private encryptionKey: CryptoKey | null = null;

    // UI Elements
    private form = document.getElementById('add-task-form') as HTMLFormElement;
    private input = document.getElementById('task-input') as HTMLInputElement;
    private taskList = document.getElementById('task-list') as HTMLUListElement;
    private domainLabel = document.getElementById('current-domain') as HTMLParagraphElement;
    private typeToggle = document.getElementById('type-toggle') as HTMLButtonElement;
    private iconUrl = this.typeToggle.querySelector('.icon-url') as HTMLElement;
    private iconGlobal = this.typeToggle.querySelector('.icon-global') as HTMLElement;

    constructor() {
        this.init();
    }

    private async init() {
        await this.getCurrentTabInfo();
        await this.initEncryptionKey();
        await this.loadTasks();
        this.setupEventListeners();
        this.render();
    }

    private async initEncryptionKey() {
        const data = await chrome.storage.local.get('cryptoKey') as StorageData;
        if (data.cryptoKey) {
            this.encryptionKey = await crypto.subtle.importKey(
                'jwk',
                data.cryptoKey,
                { name: 'AES-GCM' },
                true,
                ['encrypt', 'decrypt']
            );
        } else {
            this.encryptionKey = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            const jwk = await crypto.subtle.exportKey('jwk', this.encryptionKey);
            await chrome.storage.local.set({ cryptoKey: jwk });
        }
    }

    private async encryptData(data: string): Promise<string> {
        if (!this.encryptionKey) return data;
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.encryptionKey,
            encodedData
        );
        
        // Combine IV and Ciphertext
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);
        
        return btoa(String.fromCharCode(...combined));
    }

    private async decryptData(base64Data: string): Promise<string> {
        if (!this.encryptionKey) return '';
        try {
            const binaryStr = atob(base64Data);
            const combined = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                combined[i] = binaryStr.charCodeAt(i);
            }
            
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.encryptionKey,
                data
            );
            
            return new TextDecoder().decode(decryptedBuffer);
        } catch (e) {
            console.error('Decryption failed', e);
            return '[]';
        }
    }

    private async getCurrentTabInfo() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0 && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                // Store the base origin so all pages on the same domain share tasks
                this.currentUrl = url.origin;
                this.currentFullUrl = url.href;
                this.currentDomain = url.hostname;
                this.domainLabel.textContent = this.currentDomain || 'Unknown Site';
            } catch (e) {
                this.currentUrl = 'chrome-extension-or-internal';
                this.currentFullUrl = '';
                this.currentDomain = 'Browser Tab';
                this.domainLabel.textContent = this.currentDomain;
            }
        }
    }

    private async loadTasks() {
        const data = await chrome.storage.local.get('tasks') as StorageData;
        if (typeof data.tasks === 'string') {
            const decryptedJson = await this.decryptData(data.tasks);
            try {
                this.tasks = JSON.parse(decryptedJson);
            } catch (e) {
                this.tasks = [];
            }
        } else if (Array.isArray(data.tasks)) {
            this.tasks = data.tasks;
        } else {
            this.tasks = [];
        }
    }

    private async saveTasks() {
        const json = JSON.stringify(this.tasks);
        const encrypted = await this.encryptData(json);
        await chrome.storage.local.set({ tasks: encrypted });
    }

    private setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        this.typeToggle.addEventListener('click', () => {
            this.isGlobalMode = !this.isGlobalMode;
            this.updateToggleUI();
        });

        this.taskList.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.classList.contains('task-checkbox')) {
                const id = target.closest('li')?.dataset.id;
                if (id) this.toggleTaskCompletion(id);
            }
        });

        this.taskList.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('.delete-btn');
            if (btn) {
                const id = btn.closest('li')?.dataset.id;
                if (id) this.deleteTask(id);
            }
        });

        // Listen for tab switching to update the Side Panel URL context
        chrome.tabs.onActivated.addListener(async () => {
            await this.getCurrentTabInfo();
            this.render();
        });

        // Listen for URL changes in the active tab
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (tab.active && changeInfo.url) {
                await this.getCurrentTabInfo();
                this.render();
            }
        });
    }

    private updateToggleUI() {
        if (this.isGlobalMode) {
            this.iconGlobal.classList.add('active');
            this.iconUrl.classList.remove('active');
            this.input.placeholder = "Add a global task...";
        } else {
            this.iconUrl.classList.add('active');
            this.iconGlobal.classList.remove('active');
            this.input.placeholder = "Add a task for this page...";
        }
    }

    private async addTask() {
        const text = this.input.value.trim();
        if (!text) return;

        const newTask: Task = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            type: this.isGlobalMode ? 'global' : 'url',
            url: this.isGlobalMode ? undefined : this.currentUrl,
            fullUrl: this.isGlobalMode ? undefined : this.currentFullUrl,
            createdAt: Date.now()
        };

        this.tasks.push(newTask);
        await this.saveTasks();

        this.input.value = '';
        this.render();
    }

    private async toggleTaskCompletion(id: string) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            await this.saveTasks();
            this.render();
        }
    }

    private async deleteTask(id: string) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        await this.saveTasks();
        this.render();
    }

    private getVisibleTasks(): Task[] {
        // Show all global tasks + tasks specific to the current URL
        return this.tasks
            .filter(t => t.type === 'global' || t.url === this.currentUrl)
            .sort((a, b) => b.createdAt - a.createdAt); // Newest first
    }

    private render() {
        const visibleTasks = this.getVisibleTasks();

        if (visibleTasks.length === 0) {
            this.taskList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <p>No tasks yet. Add one above!</p>
                </div>
            `;
            return;
        }

        this.taskList.innerHTML = visibleTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        ${task.type === 'global'
                ? '<span class="badge badge-global">Global</span>'
                : '<span class="badge badge-url">This Page</span>'
            }
                    </div>
                    ${task.fullUrl ? `<a href="${task.fullUrl}" target="_blank" class="task-link" title="Open original page">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Source Link
                    </a>` : ''}
                </div>
                <button class="delete-btn" aria-label="Delete task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </li>
        `).join('');
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
