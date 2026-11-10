import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getTokens, deleteToken } from '../services/storage';

export function useTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setTokens(await getTokens());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const remove = useCallback(async (id) => {
    await deleteToken(id);
    await reload();
  }, [reload]);

  return { tokens, loading, reload, remove };
}
