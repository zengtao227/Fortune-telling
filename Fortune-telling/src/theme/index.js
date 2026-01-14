export const THEMES = {
    TAROT: 'tarot',
    ZEN: 'zen',
};

export const tarotTheme = {
    background: '#1a0b2e',
    surface: 'rgba(255, 255, 255, 0.1)',
    text: '#f3e8ff',
    accent: '#ffd700',
    secondary: '#9333ea',
    type: 'serif',
};

export const zenTheme = {
    background: '#f5f5f5',
    surface: 'rgba(0, 0, 0, 0.05)',
    text: '#2d3436',
    accent: '#2d3436',
    secondary: '#7f8c8d',
    type: 'sans-serif',
};

export const getTheme = (mode) => (mode === THEMES.ZEN ? zenTheme : tarotTheme);
