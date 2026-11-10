import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import Text from './Text';
import { useTheme, radius } from '../../theme';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 1800);
  }, [anim]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + 96,
          alignItems: 'center',
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.pill }}>
          <Check size={16} color={colors.background} strokeWidth={2.5} />
          <Text variant="label" style={{ color: colors.background }}>{message}</Text>
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
