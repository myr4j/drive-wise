import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { useTheme } from '@/contexts/ThemeContext';

interface DawnIllustrationProps {
  size?: number;
}

/**
 * Signature illustration — stylized dawn over a horizon line.
 *
 * Used in empty states + as a brand artifact. Reinforces the "Dawn
 * Companion" concept without literal sun/road clip-art clichés.
 */
export default function DawnIllustration({ size = 120 }: DawnIllustrationProps) {
  const { colors } = useTheme();
  const w = size;
  const h = size;
  const cx = w / 2;
  const horizonY = h * 0.7;
  const sunR = w * 0.18;
  const sunY = horizonY - sunR * 0.6;

  return (
    <View>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="sunBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
            <Stop
              offset="100%"
              stopColor={colors.accentSoft}
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>

        {/* Atmospheric halo behind the sun */}
        <Circle
          cx={cx}
          cy={sunY}
          r={sunR * 2.4}
          fill="url(#sunGlow)"
        />

        {/* The sun (semi-circle clipped by horizon) */}
        <Path
          d={`
            M ${cx - sunR} ${horizonY}
            A ${sunR} ${sunR} 0 0 1 ${cx + sunR} ${horizonY}
            Z
          `}
          fill="url(#sunBody)"
        />

        {/* Horizon line */}
        <Line
          x1={w * 0.1}
          y1={horizonY}
          x2={w * 0.9}
          y2={horizonY}
          stroke={colors.ink}
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        {/* Soft secondary horizon (perspective hint) */}
        <Line
          x1={w * 0.3}
          y1={horizonY + 14}
          x2={w * 0.7}
          y2={horizonY + 14}
          stroke={colors.hairlineStrong}
          strokeWidth={1}
          strokeLinecap="round"
        />

        {/* Faint upper trace */}
        <Line
          x1={w * 0.38}
          y1={horizonY - sunR * 2.3}
          x2={w * 0.62}
          y2={horizonY - sunR * 2.3}
          stroke={colors.accent}
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.35}
        />
      </Svg>
    </View>
  );
}
