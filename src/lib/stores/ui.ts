import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Sidebar state
interface SidebarState {
  visible: boolean;
  collapsed: boolean;
}

// Create sidebar store with persistence
function createSidebarStore() {
  // Get saved state from localStorage
  const initialState: SidebarState = browser ? 
    JSON.parse(localStorage.getItem('sidebar') || '{"visible": true, "collapsed": false}') : 
    { visible: true, collapsed: false };
  
  const { subscribe, set, update } = writable<SidebarState>(initialState);
  
  return {
    subscribe,
    update: (updater: (state: SidebarState) => SidebarState) => {
      update(state => {
        const newState = updater(state);
        if (browser) {
          localStorage.setItem('sidebar', JSON.stringify(newState));
        }
        return newState;
      });
    },
    set: (newState: SidebarState) => {
      if (browser) {
        localStorage.setItem('sidebar', JSON.stringify(newState));
      }
      set(newState);
    },
    toggle: () => {
      update(state => {
        const newState = { ...state, visible: !state.visible };
        if (browser) {
          localStorage.setItem('sidebar', JSON.stringify(newState));
        }
        return newState;
      });
    },
    toggleCollapse: () => {
      update(state => {
        const newState = { ...state, collapsed: !state.collapsed };
        if (browser) {
          localStorage.setItem('sidebar', JSON.stringify(newState));
          // Update CSS variables immediately
          document.documentElement.style.setProperty(
            '--sidebar-width', 
            newState.collapsed ? 'var(--sidebar-collapsed-width)' : '280px'
          );
          document.documentElement.style.setProperty(
            '--header-margin-left', 
            newState.collapsed ? 'var(--sidebar-collapsed-width)' : '280px'
          );
        }
        return newState;
      });
    }
  };
}

export const sidebar = createSidebarStore();

// Modal state
interface ModalState {
  [key: string]: boolean;
}

function createModalStore() {
  const { subscribe, update } = writable<ModalState>({});
  
  return {
    subscribe,
    open: (id: string) => update(state => ({ ...state, [id]: true })),
    close: (id: string) => update(state => ({ ...state, [id]: false })),
    toggle: (id: string) => update(state => ({ ...state, [id]: !state[id] }))
  };
}

export const modals = createModalStore();

// Theme settings
interface ThemeState {
  darkMode: boolean;
}

function createThemeStore() {
  // Get saved state from localStorage
  const initialState: ThemeState = browser ? 
    JSON.parse(localStorage.getItem('theme') || '{"darkMode": false}') : 
    { darkMode: false };
  
  const { subscribe, set, update } = writable<ThemeState>(initialState);
  
  return {
    subscribe,
    update: (updater: (state: ThemeState) => ThemeState) => {
      update(state => {
        const newState = updater(state);
        if (browser) {
          localStorage.setItem('theme', JSON.stringify(newState));
        }
        return newState;
      });
    },
    toggleDarkMode: () => {
      update(state => {
        const newState = { ...state, darkMode: !state.darkMode };
        if (browser) {
          localStorage.setItem('theme', JSON.stringify(newState));
          document.documentElement.classList.toggle('dark-mode', newState.darkMode);
        }
        return newState;
      });
    }
  };
}

export const theme = createThemeStore();