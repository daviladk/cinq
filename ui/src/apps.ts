/**
 * cinQ Apps Launcher Module
 * Handles app grid, dock, and app switching
 */

import { invoke } from '@tauri-apps/api/core';

// App types from backend
export interface AppInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  kind: 'builtin' | 'userinstalled' | 'marketplace';
  status: 'idle' | 'running' | 'background' | { error: string };
  pinned: boolean;
  pinned_position: number | null;
  entry_component: string;
}

interface CommandResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// App state for UI
export interface AppsState {
  apps: AppInfo[];
  pinnedApps: AppInfo[];
  activeApp: AppInfo | null;
  showLauncher: boolean;
}

export const initialAppsState: AppsState = {
  apps: [],
  pinnedApps: [],
  activeApp: null,
  showLauncher: false,
};

// API Functions
export async function listApps(): Promise<AppInfo[]> {
  try {
    const response = await invoke<CommandResponse<AppInfo[]>>('apps_list');
    return response.data || [];
  } catch (e) {
    console.error('Failed to list apps:', e);
    return [];
  }
}

export async function getPinnedApps(): Promise<AppInfo[]> {
  try {
    const response = await invoke<CommandResponse<AppInfo[]>>('apps_pinned');
    return response.data || [];
  } catch (e) {
    console.error('Failed to get pinned apps:', e);
    return [];
  }
}

export async function getActiveApp(): Promise<AppInfo | null> {
  try {
    const response = await invoke<CommandResponse<AppInfo | null>>('apps_active');
    return response.data;
  } catch (e) {
    console.error('Failed to get active app:', e);
    return null;
  }
}

export async function launchApp(appId: string): Promise<AppInfo | null> {
  try {
    const response = await invoke<CommandResponse<AppInfo>>('apps_launch', { appId });
    return response.data;
  } catch (e) {
    console.error('Failed to launch app:', e);
    return null;
  }
}

export async function closeApp(appId: string): Promise<void> {
  try {
    await invoke<CommandResponse<void>>('apps_close', { appId });
  } catch (e) {
    console.error('Failed to close app:', e);
  }
}

export async function minimizeApp(appId: string): Promise<void> {
  try {
    await invoke<CommandResponse<void>>('apps_minimize', { appId });
  } catch (e) {
    console.error('Failed to minimize app:', e);
  }
}

// Render the app dock (sidebar)
export function renderAppDock(state: AppsState, onAppClick: (appId: string) => void): string {
  const apps = state.pinnedApps.length > 0 ? state.pinnedApps : state.apps.filter(a => a.pinned);
  
  return `
    <div class="app-dock">
      ${apps.map(app => `
        <button 
          class="dock-item ${state.activeApp?.id === app.id ? 'active' : ''} ${getStatusClass(app.status)}"
          data-app-id="${app.id}"
          title="${app.name}"
        >
          <span class="dock-icon">${app.icon}</span>
          ${app.status === 'running' ? '<span class="dock-indicator"></span>' : ''}
        </button>
      `).join('')}
      
      <div class="dock-divider"></div>
      
      <button class="dock-item launcher-btn" data-action="open-launcher" title="All Apps">
        <span class="dock-icon">⊞</span>
      </button>
    </div>
  `;
}

// Render the full app launcher grid
export function renderAppLauncher(state: AppsState, onClose: () => void): string {
  // Group apps by kind
  const builtInApps = state.apps.filter(a => a.kind === 'builtin');
  const installedApps = state.apps.filter(a => a.kind !== 'builtin');
  
  return `
    <div class="app-launcher-overlay" data-action="close-launcher">
      <div class="app-launcher" onclick="event.stopPropagation()">
        <div class="launcher-header">
          <h2>Apps</h2>
          <button class="launcher-close" data-action="close-launcher">✕</button>
        </div>
        
        <div class="launcher-search">
          <input type="text" id="app-search" placeholder="Search apps..." autocomplete="off">
        </div>
        
        <div class="launcher-grid">
          <div class="app-section">
            <h3>Built-in Apps</h3>
            <div class="app-grid">
              ${builtInApps.map(app => renderAppTile(app, state.activeApp?.id === app.id)).join('')}
            </div>
          </div>
          
          ${installedApps.length > 0 ? `
            <div class="app-section">
              <h3>Installed Apps</h3>
              <div class="app-grid">
                ${installedApps.map(app => renderAppTile(app, state.activeApp?.id === app.id)).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="app-section marketplace">
            <h3>Get More Apps</h3>
            <div class="marketplace-cta">
              <span class="marketplace-icon">🏪</span>
              <p>Discover more apps in the cinQ Marketplace</p>
              <button class="btn-secondary" disabled>Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render a single app tile
function renderAppTile(app: AppInfo, isActive: boolean): string {
  const statusText = getStatusText(app.status);
  
  return `
    <div 
      class="app-tile ${isActive ? 'active' : ''} ${getStatusClass(app.status)}"
      data-app-id="${app.id}"
    >
      <div class="app-icon">${app.icon}</div>
      <div class="app-name">${app.name}</div>
      ${statusText ? `<div class="app-status">${statusText}</div>` : ''}
    </div>
  `;
}

// Helper to get status class
function getStatusClass(status: AppInfo['status']): string {
  if (status === 'running') return 'running';
  if (status === 'background') return 'background';
  if (typeof status === 'object' && 'error' in status) return 'error';
  return '';
}

// Helper to get status text
function getStatusText(status: AppInfo['status']): string {
  if (status === 'running') return '● Running';
  if (status === 'background') return '○ Background';
  if (typeof status === 'object' && 'error' in status) return '⚠ Error';
  return '';
}

// Attach handlers for app launcher
export function attachAppHandlers(
  state: AppsState, 
  onLaunch: (appId: string) => Promise<void>,
  onToggleLauncher: () => void
): void {
  // Dock item clicks
  document.querySelectorAll('.dock-item[data-app-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const appId = btn.getAttribute('data-app-id');
      if (appId) onLaunch(appId);
    });
  });
  
  // Launcher button
  document.querySelectorAll('[data-action="open-launcher"]').forEach(btn => {
    btn.addEventListener('click', onToggleLauncher);
  });
  
  // Close launcher
  document.querySelectorAll('[data-action="close-launcher"]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) onToggleLauncher();
    });
  });
  
  // App tile clicks
  document.querySelectorAll('.app-tile[data-app-id]').forEach(tile => {
    tile.addEventListener('click', () => {
      const appId = tile.getAttribute('data-app-id');
      if (appId) {
        onLaunch(appId);
        onToggleLauncher(); // Close launcher after selection
      }
    });
  });
  
  // Search filter
  const searchInput = document.getElementById('app-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      document.querySelectorAll('.app-tile').forEach(tile => {
        const name = tile.querySelector('.app-name')?.textContent?.toLowerCase() || '';
        (tile as HTMLElement).style.display = name.includes(query) ? '' : 'none';
      });
    });
  }
}

// CSS for the app launcher (to be added to styles.css)
export const appLauncherStyles = `
/* App Dock - Left sidebar */
.app-dock {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(15, 15, 20, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  gap: 8px;
  width: 64px;
  min-width: 64px;
}

.dock-item {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
}

.dock-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.dock-item.active {
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
}

.dock-item.running .dock-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #00ff88;
  border-radius: 50%;
}

.dock-icon {
  font-size: 20px;
}

.dock-divider {
  width: 32px;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 4px 0;
}

.launcher-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

/* App Launcher Overlay */
.app-launcher-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.app-launcher {
  background: rgba(25, 25, 35, 0.98);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.launcher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.launcher-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.launcher-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.launcher-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.launcher-search {
  padding: 16px 24px;
}

.launcher-search input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 14px;
}

.launcher-search input:focus {
  outline: none;
  border-color: #00d4ff;
}

.launcher-grid {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.app-section {
  margin-bottom: 24px;
}

.app-section h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px 0;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.app-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-tile:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.app-tile.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
}

.app-tile.running .app-status {
  color: #00ff88;
}

.app-tile.background .app-status {
  color: #ffaa00;
}

.app-tile.error .app-status {
  color: #ff4444;
}

.app-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.app-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  color: white;
}

.app-status {
  font-size: 10px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.5);
}

/* Marketplace CTA */
.marketplace-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.marketplace-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.marketplace-cta p {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}
`;
