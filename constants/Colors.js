// constants/Colors.js

export const LightPalette = {
  primary: '#2CA87F',
  background: '#ffffff',
  card: '#f8f9fa',
  text: '#202124',
  textSecondary: '#5f6368',
  border: '#dadce0',
  inputBackground: '#ffffff',
  danger: '#ea4335',
  success: '#34a853',
  warning: '#fbbc04',
  divider: '#e8eaed',
  icon: '#5f6368',
};

export const DarkPalette = {
  primary: '#146e50ff',
  background: '#121212',
  card: '#1e1e1e',
  text: '#e8eaed',
  textSecondary: '#b0b3b8',
  border: '#2c2c2c',
  inputBackground: '#1e1e1e',
  danger: '#f28b82',
  success: '#81c995',
  warning: '#fdd663',
  divider: '#3c4043',
  icon: '#b0b3b8',
};

// função para escolher paleta com base no esquema
export const getColors = (scheme) => (scheme === 'dark' ? DarkPalette : LightPalette);
