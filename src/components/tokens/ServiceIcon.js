import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../ui/Text';
import { useTheme, fonts } from '../../theme';
import { SERVICE_ICONS } from '../../data/serviceIcons';
import { bestOn, contrast } from '../../theme/color';

/** Ícone do serviço (marca) ou inicial do nome quando não há ícone. */
export default function ServiceIcon({ iconKey, name = '?', size = 44, bg, style }) {
  const { colors, scheme } = useTheme();
  const icon = iconKey ? SERVICE_ICONS[iconKey] : null;
  const box = { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' };

  if (icon) {
    // escolhe fundo e cor do desenho para a logo sempre ter contraste (ex.: Snapchat amarelo, GitHub preto)
    let tile = '#FFFFFF';
    let glyph = icon.hex;
    if (scheme === 'dark' && contrast(icon.hex, colors.surfaceAlt) >= 3) {
      tile = colors.surfaceAlt;
    } else if (contrast(icon.hex, '#FFFFFF') < 2) {
      tile = icon.hex;
      glyph = bestOn(icon.hex);
    }
    return (
      <View style={[box, { backgroundColor: bg || tile, borderWidth: 1, borderColor: colors.border }, style]}>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
          <Path d={icon.path} fill={glyph} />
        </Svg>
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: bg || colors.primarySoft }, style]}>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.4, color: colors.primary }}>
        {(name || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
