/**
 * cinQ Canvas Layout System
 * Drag, drop, and resize app widgets on an open canvas
 * Military tactical dashboard / PowerBI style
 */

// Widget position and size
export interface WidgetLayout {
  id: string;
  appId: string;
  x: number;      // Grid units from left
  y: number;      // Grid units from top
  width: number;  // Grid units wide
  height: number; // Grid units tall
  minimized: boolean;
  zIndex: number;
}

// Full dashboard layout
export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetLayout[];
  gridSize: number;  // Pixels per grid unit
  createdAt: number;
  updatedAt: number;
}

// Preset layouts
export const PRESET_LAYOUTS: Record<string, Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>> = {
  tactical: {
    name: '🎖️ Tactical',
    gridSize: 20,
    widgets: [
      { id: 'w1', appId: 'cinq.chat', x: 0, y: 0, width: 20, height: 25, minimized: false, zIndex: 1 },
      { id: 'w2', appId: 'cinq.wallet', x: 20, y: 0, width: 15, height: 10, minimized: false, zIndex: 2 },
      { id: 'w3', appId: 'cinq.compute', x: 20, y: 10, width: 15, height: 15, minimized: false, zIndex: 3 },
      { id: 'w4', appId: 'system.monitor', x: 35, y: 0, width: 15, height: 12, minimized: false, zIndex: 4 },
      { id: 'w5', appId: 'system.network', x: 35, y: 12, width: 15, height: 13, minimized: false, zIndex: 5 },
    ]
  },
  minimal: {
    name: '✨ Minimal',
    gridSize: 20,
    widgets: [
      { id: 'w1', appId: 'cinq.chat', x: 10, y: 2, width: 30, height: 22, minimized: false, zIndex: 1 },
    ]
  },
  command: {
    name: '🖥️ Command Center',
    gridSize: 20,
    widgets: [
      { id: 'w1', appId: 'cinq.chat', x: 0, y: 0, width: 18, height: 20, minimized: false, zIndex: 1 },
      { id: 'w2', appId: 'cinq.voice', x: 0, y: 20, width: 18, height: 8, minimized: false, zIndex: 2 },
      { id: 'w3', appId: 'cinq.grid', x: 18, y: 0, width: 18, height: 28, minimized: false, zIndex: 3 },
      { id: 'w4', appId: 'cinq.compute', x: 36, y: 0, width: 14, height: 14, minimized: false, zIndex: 4 },
      { id: 'w5', appId: 'cinq.wallet', x: 36, y: 14, width: 14, height: 14, minimized: false, zIndex: 5 },
    ]
  },
  ops: {
    name: '📊 Ops Dashboard',
    gridSize: 20,
    widgets: [
      { id: 'w1', appId: 'system.monitor', x: 0, y: 0, width: 16, height: 14, minimized: false, zIndex: 1 },
      { id: 'w2', appId: 'system.bandwidth', x: 16, y: 0, width: 16, height: 14, minimized: false, zIndex: 2 },
      { id: 'w3', appId: 'system.network', x: 32, y: 0, width: 18, height: 14, minimized: false, zIndex: 3 },
      { id: 'w4', appId: 'cinq.compute', x: 0, y: 14, width: 25, height: 14, minimized: false, zIndex: 4 },
      { id: 'w5', appId: 'cinq.wallet', x: 25, y: 14, width: 25, height: 14, minimized: false, zIndex: 5 },
    ]
  }
};

// Canvas state
export interface CanvasState {
  layout: DashboardLayout;
  dragging: string | null;       // Widget ID being dragged
  resizing: string | null;       // Widget ID being resized
  resizeHandle: string | null;   // Which handle (n, s, e, w, ne, nw, se, sw)
  dragOffset: { x: number; y: number };
  selectedWidget: string | null;
  editMode: boolean;             // Layout edit mode
}

// Generate unique ID
function generateId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Load layout from localStorage
export function loadLayout(layoutId?: string): DashboardLayout {
  const saved = localStorage.getItem('cinq_dashboard_layout');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved layout:', e);
    }
  }
  
  // Default to tactical layout
  const preset = PRESET_LAYOUTS.tactical;
  return {
    id: generateId(),
    ...preset,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Save layout to localStorage
export function saveLayout(layout: DashboardLayout): void {
  layout.updatedAt = Date.now();
  localStorage.setItem('cinq_dashboard_layout', JSON.stringify(layout));
}

// Apply preset layout
export function applyPreset(presetName: string): DashboardLayout {
  const preset = PRESET_LAYOUTS[presetName];
  if (!preset) {
    console.error('Unknown preset:', presetName);
    return loadLayout();
  }
  
  const layout: DashboardLayout = {
    id: generateId(),
    ...preset,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  saveLayout(layout);
  return layout;
}

// Add widget to layout
export function addWidget(layout: DashboardLayout, appId: string): DashboardLayout {
  const maxZ = Math.max(0, ...layout.widgets.map(w => w.zIndex));
  
  // Find open spot
  let x = 0, y = 0;
  const occupied = new Set(layout.widgets.map(w => `${w.x},${w.y}`));
  while (occupied.has(`${x},${y}`)) {
    x += 5;
    if (x > 40) { x = 0; y += 5; }
  }
  
  const newWidget: WidgetLayout = {
    id: generateId(),
    appId,
    x,
    y,
    width: 15,
    height: 12,
    minimized: false,
    zIndex: maxZ + 1,
  };
  
  layout.widgets.push(newWidget);
  saveLayout(layout);
  return layout;
}

// Remove widget from layout
export function removeWidget(layout: DashboardLayout, widgetId: string): DashboardLayout {
  layout.widgets = layout.widgets.filter(w => w.id !== widgetId);
  saveLayout(layout);
  return layout;
}

// Update widget position/size
export function updateWidget(
  layout: DashboardLayout, 
  widgetId: string, 
  updates: Partial<WidgetLayout>
): DashboardLayout {
  const widget = layout.widgets.find(w => w.id === widgetId);
  if (widget) {
    Object.assign(widget, updates);
    saveLayout(layout);
  }
  return layout;
}

// Bring widget to front
export function bringToFront(layout: DashboardLayout, widgetId: string): DashboardLayout {
  const maxZ = Math.max(...layout.widgets.map(w => w.zIndex));
  const widget = layout.widgets.find(w => w.id === widgetId);
  if (widget) {
    widget.zIndex = maxZ + 1;
    saveLayout(layout);
  }
  return layout;
}

// Render the canvas with all widgets
export function renderCanvas(
  state: CanvasState,
  renderWidgetContent: (appId: string, widget: WidgetLayout) => string
): string {
  const { layout, editMode, selectedWidget } = state;
  
  return `
    <div class="canvas-container ${editMode ? 'edit-mode' : ''}" data-grid-size="${layout.gridSize}">
      <!-- Canvas toolbar -->
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" data-action="classic-mode" title="Switch to Classic Mode">
            ◀ Classic
          </button>
          <span class="layout-name">${layout.name}</span>
          ${editMode ? '<span class="edit-badge">✏️ Edit Mode</span>' : ''}
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn" data-action="toggle-edit" title="${editMode ? 'Done Editing' : 'Edit Layout'}">
            ${editMode ? '✓ Done' : '✏️ Edit'}
          </button>
          <button class="toolbar-btn" data-action="add-widget" title="Add Widget">➕</button>
          <div class="preset-dropdown">
            <button class="toolbar-btn" data-action="presets">📐 Layouts</button>
            <div class="preset-menu">
              ${Object.entries(PRESET_LAYOUTS).map(([key, preset]) => `
                <button class="preset-item" data-preset="${key}">${preset.name}</button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Canvas grid -->
      <div class="canvas-grid" id="canvas-grid">
        ${layout.widgets.map(widget => renderWidget(widget, renderWidgetContent, editMode, selectedWidget === widget.id, layout.gridSize)).join('')}
      </div>
      
      <!-- Add widget modal -->
      <div class="add-widget-modal" id="add-widget-modal" style="display: none;">
        <div class="modal-content">
          <h3>Add Widget</h3>
          <div class="widget-options">
            <button class="widget-option" data-app="cinq.chat">💬 Chat</button>
            <button class="widget-option" data-app="cinq.voice">📞 Voice</button>
            <button class="widget-option" data-app="cinq.grid">🌐 Grid</button>
            <button class="widget-option" data-app="cinq.compute">⚡ Compute</button>
            <button class="widget-option" data-app="cinq.wallet">👛 Wallet</button>
            <button class="widget-option" data-app="cinq.files">📁 Files</button>
            <button class="widget-option" data-app="system.monitor">📊 System</button>
            <button class="widget-option" data-app="system.bandwidth">📶 Bandwidth</button>
            <button class="widget-option" data-app="system.network">🔗 Network</button>
          </div>
          <button class="modal-close" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

// Render individual widget
function renderWidget(
  widget: WidgetLayout,
  renderContent: (appId: string, widget: WidgetLayout) => string,
  editMode: boolean,
  selected: boolean,
  gridSize: number
): string {
  const style = `
    left: ${widget.x * gridSize}px;
    top: ${widget.y * gridSize}px;
    width: ${widget.width * gridSize}px;
    height: ${widget.minimized ? 32 : widget.height * gridSize}px;
    z-index: ${widget.zIndex};
  `;
  
  const appName = getAppName(widget.appId);
  const appIcon = getAppIcon(widget.appId);
  
  return `
    <div 
      class="canvas-widget ${widget.minimized ? 'minimized' : ''} ${selected ? 'selected' : ''} ${editMode ? 'editable' : ''}"
      data-widget-id="${widget.id}"
      data-app-id="${widget.appId}"
      style="${style}"
    >
      <!-- Widget header (draggable) -->
      <div class="widget-header" data-drag-handle="${widget.id}">
        <span class="widget-icon">${appIcon}</span>
        <span class="widget-title">${appName}</span>
        <div class="widget-controls">
          <button class="widget-btn" data-action="minimize" data-widget="${widget.id}" title="Minimize">─</button>
          <button class="widget-btn" data-action="maximize" data-widget="${widget.id}" title="Maximize">□</button>
          ${editMode ? `<button class="widget-btn close" data-action="remove" data-widget="${widget.id}" title="Remove">✕</button>` : ''}
        </div>
      </div>
      
      <!-- Widget content -->
      ${!widget.minimized ? `
        <div class="widget-content">
          ${renderContent(widget.appId, widget)}
        </div>
      ` : ''}
      
      <!-- Resize handles (edit mode only) -->
      ${editMode && !widget.minimized ? `
        <div class="resize-handle n" data-resize="${widget.id}" data-handle="n"></div>
        <div class="resize-handle s" data-resize="${widget.id}" data-handle="s"></div>
        <div class="resize-handle e" data-resize="${widget.id}" data-handle="e"></div>
        <div class="resize-handle w" data-resize="${widget.id}" data-handle="w"></div>
        <div class="resize-handle ne" data-resize="${widget.id}" data-handle="ne"></div>
        <div class="resize-handle nw" data-resize="${widget.id}" data-handle="nw"></div>
        <div class="resize-handle se" data-resize="${widget.id}" data-handle="se"></div>
        <div class="resize-handle sw" data-resize="${widget.id}" data-handle="sw"></div>
      ` : ''}
    </div>
  `;
}

// Get app display name
function getAppName(appId: string): string {
  const names: Record<string, string> = {
    'cinq.chat': 'Chat',
    'cinq.voice': 'Voice',
    'cinq.grid': 'Grid',
    'cinq.compute': 'Compute',
    'cinq.wallet': 'Wallet',
    'cinq.files': 'Files',
    'cinq.settings': 'Settings',
    'system.monitor': 'System Monitor',
    'system.bandwidth': 'Bandwidth',
    'system.network': 'Network',
    'system.depin': 'DePIN Stats',
  };
  return names[appId] || appId;
}

// Get app icon
function getAppIcon(appId: string): string {
  const icons: Record<string, string> = {
    'cinq.chat': '💬',
    'cinq.voice': '📞',
    'cinq.grid': '🌐',
    'cinq.compute': '⚡',
    'cinq.wallet': '👛',
    'cinq.files': '📁',
    'cinq.settings': '⚙️',
    'system.monitor': '📊',
    'system.bandwidth': '📶',
    'system.network': '🔗',
    'system.depin': '🌍',
  };
  return icons[appId] || '📦';
}

// Attach canvas event handlers
export function attachCanvasHandlers(
  state: CanvasState,
  onUpdate: (state: CanvasState) => void
): void {
  const canvas = document.getElementById('canvas-grid');
  if (!canvas) return;
  
  const gridSize = state.layout.gridSize;
  
  // Track mouse position for drag/resize
  let startX = 0, startY = 0;
  let startWidget: WidgetLayout | null = null;
  
  // Drag start
  document.querySelectorAll('[data-drag-handle]').forEach(handle => {
    handle.addEventListener('mousedown', (e: Event) => {
      const evt = e as MouseEvent;
      const widgetId = (handle as HTMLElement).dataset.dragHandle!;
      const widget = state.layout.widgets.find(w => w.id === widgetId);
      
      if (widget && state.editMode) {
        evt.preventDefault();
        state.dragging = widgetId;
        state.dragOffset = { 
          x: evt.clientX - widget.x * gridSize, 
          y: evt.clientY - widget.y * gridSize 
        };
        startWidget = { ...widget };
        
        // Bring to front
        state.layout = bringToFront(state.layout, widgetId);
        onUpdate(state);
      }
    });
  });
  
  // Resize start
  document.querySelectorAll('[data-resize]').forEach(handle => {
    handle.addEventListener('mousedown', (e: Event) => {
      const evt = e as MouseEvent;
      const el = handle as HTMLElement;
      const widgetId = el.dataset.resize!;
      const resizeHandle = el.dataset.handle!;
      const widget = state.layout.widgets.find(w => w.id === widgetId);
      
      if (widget && state.editMode) {
        evt.preventDefault();
        evt.stopPropagation();
        state.resizing = widgetId;
        state.resizeHandle = resizeHandle;
        startX = evt.clientX;
        startY = evt.clientY;
        startWidget = { ...widget };
        onUpdate(state);
      }
    });
  });
  
  // Mouse move (drag/resize)
  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (state.dragging && startWidget) {
      const newX = Math.max(0, Math.round((e.clientX - state.dragOffset.x) / gridSize));
      const newY = Math.max(0, Math.round((e.clientY - state.dragOffset.y) / gridSize));
      
      state.layout = updateWidget(state.layout, state.dragging, { x: newX, y: newY });
      onUpdate(state);
    }
    
    if (state.resizing && state.resizeHandle && startWidget) {
      const dx = Math.round((e.clientX - startX) / gridSize);
      const dy = Math.round((e.clientY - startY) / gridSize);
      
      let updates: Partial<WidgetLayout> = {};
      const handle = state.resizeHandle;
      
      // Handle each resize direction
      if (handle.includes('e')) {
        updates.width = Math.max(5, startWidget.width + dx);
      }
      if (handle.includes('w')) {
        updates.x = startWidget.x + dx;
        updates.width = Math.max(5, startWidget.width - dx);
      }
      if (handle.includes('s')) {
        updates.height = Math.max(4, startWidget.height + dy);
      }
      if (handle.includes('n')) {
        updates.y = startWidget.y + dy;
        updates.height = Math.max(4, startWidget.height - dy);
      }
      
      state.layout = updateWidget(state.layout, state.resizing, updates);
      onUpdate(state);
    }
  });
  
  // Mouse up (end drag/resize)
  document.addEventListener('mouseup', () => {
    if (state.dragging || state.resizing) {
      state.dragging = null;
      state.resizing = null;
      state.resizeHandle = null;
      startWidget = null;
      saveLayout(state.layout);
      onUpdate(state);
    }
  });
  
  // Toggle edit mode
  document.querySelectorAll('[data-action="toggle-edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.editMode = !state.editMode;
      onUpdate(state);
    });
  });
  
  // Add widget button
  document.querySelectorAll('[data-action="add-widget"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('add-widget-modal');
      if (modal) modal.style.display = 'flex';
    });
  });
  
  // Close modal
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('add-widget-modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // Widget option selection
  document.querySelectorAll('.widget-option[data-app]').forEach(btn => {
    btn.addEventListener('click', () => {
      const appId = (btn as HTMLElement).dataset.app!;
      state.layout = addWidget(state.layout, appId);
      const modal = document.getElementById('add-widget-modal');
      if (modal) modal.style.display = 'none';
      onUpdate(state);
    });
  });
  
  // Preset selection
  document.querySelectorAll('.preset-item[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = (btn as HTMLElement).dataset.preset!;
      state.layout = applyPreset(preset);
      onUpdate(state);
    });
  });
  
  // Widget minimize
  document.querySelectorAll('[data-action="minimize"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const widgetId = (btn as HTMLElement).dataset.widget!;
      const widget = state.layout.widgets.find(w => w.id === widgetId);
      if (widget) {
        state.layout = updateWidget(state.layout, widgetId, { minimized: !widget.minimized });
        onUpdate(state);
      }
    });
  });
  
  // Widget maximize (expand to fill)
  document.querySelectorAll('[data-action="maximize"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const widgetId = (btn as HTMLElement).dataset.widget!;
      state.layout = updateWidget(state.layout, widgetId, { 
        x: 0, y: 0, width: 50, height: 28, minimized: false 
      });
      state.layout = bringToFront(state.layout, widgetId);
      onUpdate(state);
    });
  });
  
  // Widget remove
  document.querySelectorAll('[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const widgetId = (btn as HTMLElement).dataset.widget!;
      state.layout = removeWidget(state.layout, widgetId);
      onUpdate(state);
    });
  });
  
  // Click to select/bring to front
  document.querySelectorAll('.canvas-widget').forEach(widget => {
    widget.addEventListener('mousedown', () => {
      const widgetId = (widget as HTMLElement).dataset.widgetId!;
      state.selectedWidget = widgetId;
      state.layout = bringToFront(state.layout, widgetId);
      onUpdate(state);
    });
  });
}

// Initialize canvas state
export function initCanvasState(): CanvasState {
  return {
    layout: loadLayout(),
    dragging: null,
    resizing: null,
    resizeHandle: null,
    dragOffset: { x: 0, y: 0 },
    selectedWidget: null,
    editMode: false,
  };
}
