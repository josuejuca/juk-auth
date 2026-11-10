import React, { useEffect, useState } from 'react';
import { goBack } from '../../utils/navigation';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Page } from '../../components/layout';
import { ScreenHeader, TextField, Button, Text, useToast } from '../../components/ui';
import IconPicker from '../../components/tokens/IconPicker';
import { getTokens, updateToken } from '../../services/storage';
import { tokenTitle } from '../../services/serviceDetect';

export default function EditTokenScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState(null);
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(null);

  useEffect(() => {
    getTokens().then((all) => {
      const t = all.find((x) => String(x.id) === String(id));
      if (t) { setToken(t); setName(t.name || t.issuer || t.accountName || ''); setIconKey(t.iconKey || null); }
    });
  }, [id]);

  const save = async () => {
    await updateToken(token.id, { name: name.trim() || undefined, iconKey: iconKey || undefined });
    toast('Alterações salvas');
    goBack(router);
  };

  return (
    <Page>
      <ScreenHeader title="Editar conta" />
      {token ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
          <TextField label="Nome" value={name} onChangeText={setName} placeholder={tokenTitle(token)} autoCapitalize="words" hint={token.accountName} />
          <View style={{ gap: 10 }}>
            <Text variant="label" tone="textSecondary">Ícone</Text>
            <IconPicker value={iconKey} onChange={setIconKey} name={name} />
          </View>
          <Button title="Salvar" onPress={save} />
        </ScrollView>
      ) : null}
    </Page>
  );
}
