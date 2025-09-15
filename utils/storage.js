import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKENS_KEY = 'juk_authenticator_tokens';
const BACKUP_KEY = 'juk_authenticator_backup';

export const getTokens = async () => {
  try {
    const tokens = await AsyncStorage.getItem(TOKENS_KEY);
    return tokens ? JSON.parse(tokens) : [];
  } catch (error) {
    console.error('Error getting tokens:', error);
    return [];
  }
};

export const saveToken = async (token) => {
  try {
    const tokens = await getTokens();
    const existingIndex = tokens.findIndex(t => t.id === token.id);
    
    if (existingIndex >= 0) {
      tokens[existingIndex] = token;
    } else {
      tokens.push(token);
    }
    
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    
    // Criar backup automático
    await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(tokens));
    
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

export const deleteToken = async (id) => {
  try {
    const tokens = await getTokens();
    const filteredTokens = tokens.filter(token => token.id !== id);
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(filteredTokens));
    return true;
  } catch (error) {
    console.error('Error deleting token:', error);
    return false;
  }
};

export const clearAllTokens = async () => {
  try {
    await AsyncStorage.removeItem(TOKENS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing tokens:', error);
    return false;
  }
};

export const exportTokens = async () => {
  try {
    const tokens = await getTokens();
    return JSON.stringify(tokens);
  } catch (error) {
    console.error('Error exporting tokens:', error);
    return null;
  }
};

export const importTokens = async (tokensData) => {
  try {
    const tokens = JSON.parse(tokensData);
    if (Array.isArray(tokens)) {
      await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing tokens:', error);
    return false;
  }
};

export const restoreBackup = async () => {
  try {
    const backup = await AsyncStorage.getItem(BACKUP_KEY);
    if (backup) {
      await AsyncStorage.setItem(TOKENS_KEY, backup);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
};