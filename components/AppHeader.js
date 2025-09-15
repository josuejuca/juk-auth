// components/AppHeader.js
import React, { useState } from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme';
import OverflowMenu from './OverflowMenu';
import LogoWhite from '../assets/img/jukre-white.svg';
import LogoGreen from '../assets/img/jukre-green.svg';

// helpers
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const hexToRgb = (hex) => {
    const h = (hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};
const isDarkBg = (hex) => {
    const { r, g, b } = hexToRgb(hex || '#000');
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
};

export default function AppHeader({ onPressAdd, onPressMenu }) {
    const router = useRouter();
    const { colors, scheme } = useTheme();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const [menuOpen, setMenuOpen] = useState(false);

    // dimensões COMPACTAS (iguais iOS/Android)
    const BAR_H = clamp(Math.round(height * 0.06), 48, 56);     // ↓ menor
    const SIDE_W = clamp(Math.round(width * 0.12), 42, 52);
    const PAD_X = clamp(Math.round(width * 0.04), 12, 18);
    const ICON_SIZE = clamp(Math.round(width * 0.065), 20, 24);    // ↓ menor
    const LOGO_W = clamp(Math.round(width * 0.50), 120, 200);   // ↓ menor
    const LOGO_H = clamp(Math.round(BAR_H * 0.62), 20, 30);

    // cores dos ícones (full white/black conforme fundo)
    const darkByScheme = scheme ? scheme === 'dark' : undefined;
    const darkByBg = isDarkBg(colors.background);
    const useDark = typeof darkByScheme === 'boolean' ? darkByScheme : darkByBg;
    const iconColor = useDark ? '#fff' : '#000';

    return (
        <>
            {/* Só a borda do safe area topo */}
            <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }}>
                {/* Conteúdo do header - SEM marginBottom */}
                <View
                    style={{
                        height: BAR_H,
                        paddingHorizontal: PAD_X,
                        backgroundColor: colors.background,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomWidth: 0,
                        shadowOpacity: 0,
                        elevation: 0,
                    }}
                >
                    {/* menu */}
                    <View style={{ width: SIDE_W, alignItems: 'flex-start', justifyContent: 'center' }}>
                        <TouchableOpacity
                            onPress={() => { onPressMenu?.(); setMenuOpen(true); }}
                            style={{ padding: clamp(Math.round(width * 0.015), 6, 10) }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="menu-outline" size={ICON_SIZE} color={iconColor} />
                        </TouchableOpacity>
                    </View>

                    {/* logo */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        {darkByBg ? (
                            <LogoWhite width={LOGO_W} height={LOGO_H} />
                        ) : (
                            <LogoGreen width={LOGO_W} height={LOGO_H} />
                        )}
                    </View>

                    {/* + */}
                    <View style={{ width: SIDE_W, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <TouchableOpacity
                            onPress={onPressAdd}
                            style={{ padding: clamp(Math.round(width * 0.015), 6, 10) }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="add-circle-outline" size={ICON_SIZE} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* Menu ancorado exatamente abaixo do header */}
            <OverflowMenu
                visible={menuOpen}
                onClose={() => setMenuOpen(false)}
                title="JuK Authenticator"
                subtitle="Gerencie suas contas e backups"
                items={[
                    { type: 'section', label: 'Contas' },
                    { icon: 'swap-horizontal-outline', label: 'Transferir contas', subLabel: 'Exportar/Importar via QR', onPress: () => router.push('/add-token') },
                    { type: 'divider' },
                    { type: 'section', label: 'Preferências' },
                    { type: 'toggle', icon: 'cloud-outline', label: 'Backup na nuvem', subLabel: 'Sincronizar com sua conta', value: false, onToggle: (v) => { } },
                    { icon: 'settings-outline', label: 'Configurações', onPress: () => router.push('/settings') },
                    { type: 'divider' },
                    { icon: 'chatbox-ellipses-outline', label: 'Enviar feedback', onPress: () => { } },
                    { icon: 'help-circle-outline', label: 'Ajuda', onPress: () => { } },
                    { type: 'footer', label: 'v1.0.0 • © JUCA' },
                ]}
            />

        </>
    );
}
