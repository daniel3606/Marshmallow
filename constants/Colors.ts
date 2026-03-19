const tintColorLight = '#8B635C';
const tintColorDark = '#E7B6AD';

const Colors = {
  light: {
    text: '#000',
    background: '#FFF2E5',
    tint: tintColorLight,
    tabIconDefault: '#C7BDBA',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFF',
    background: '#1A1211',
    tint: tintColorDark,
    tabIconDefault: '#6B5D5A',
    tabIconSelected: tintColorDark,
  },
} as const;

export default Colors;
