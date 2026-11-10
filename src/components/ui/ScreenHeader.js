import React from 'react';
import { goBack } from '../../utils/navigation';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import IconButton from './IconButton';
import Text from './Text';

export default function ScreenHeader({ title, right, onBack }) {
  const router = useRouter();
  return (
    <View style={{ height: 56, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
      <IconButton icon={ChevronLeft} label="Voltar" size={26} onPress={onBack || (() => goBack(router))} />
      <Text variant="heading" style={{ flex: 1, marginLeft: 4, fontSize: 20, lineHeight: 26 }} numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}
