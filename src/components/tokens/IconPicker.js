import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Search } from 'lucide-react-native';
import Pressable from '../ui/Pressable';
import Text from '../ui/Text';
import TextField from '../ui/TextField';
import ServiceIcon from './ServiceIcon';
import { useTheme } from '../../theme';
import { listServices } from '../../services/serviceDetect';

const SERVICES = listServices();

/** Grade de ícones de serviços; "Letra" volta para o avatar com inicial. */
export default function IconPicker({ value, onChange, name }) {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? SERVICES.filter((x) => x.title.toLowerCase().includes(s)) : SERVICES;
  }, [q]);

  const cell = (key, node, label) => (
    <Pressable
      key={key}
      onPress={() => onChange(key === '__none' ? null : key)}
      accessibilityLabel={label}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: (value || '__none') === key ? colors.primary : 'transparent',
      }}
    >
      {node}
    </Pressable>
  );

  return (
    <View style={{ gap: 12 }}>
      <TextField placeholder="Buscar serviço" value={q} onChangeText={setQ} autoCapitalize="none" right={<Search size={18} color={colors.textMuted} />} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cell('__none', <ServiceIcon name={name || '?'} size={44} />, 'Inicial do nome')}
        {items.map((s) => cell(s.key, <ServiceIcon iconKey={s.key} size={44} />, s.title))}
      </View>
      {items.length === 0 ? <Text tone="textMuted">Nenhum serviço encontrado.</Text> : null}
    </View>
  );
}
