#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// ⚡ Project Root & Args Handling
// ================================
const args = process.argv.slice(2);

// Default output directory = project root
let OUTPUT_DIR = process.cwd();
const OUTPUT_FILE_NAME = 'theme-provider.tsx';

// Check for --dir argument
const dirIndex = args.findIndex(arg => arg.startsWith('--dir'));
if (dirIndex !== -1) {
  const dirArg = args[dirIndex].split('=')[1] || args[dirIndex + 1];
  if (dirArg) {
    // Replace '@' with '.' to resolve project-relative path
    OUTPUT_DIR = path.resolve(process.cwd(), dirArg.replace(/^@/, '.'));
    args.splice(dirIndex, 2);
  }
}

// Remaining args = theme modes
if (args.length === 0) {
  console.error(
    '❌ Please provide at least one theme mode, e.g. --light --dark',
  );
  process.exit(1);
}

const themeModes = args.map(arg => arg.replace('--', ''));

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ================================
// ⚡ Theme Template
// ================================
const template = mode => `export const ${mode} = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  primary: '#2563EB',
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',
  secondary: '#9333EA',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  card: '#FFFFFF',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
} as const;
`;

// ================================
// ⚡ Create individual theme files
// ================================
themeModes.forEach(mode => {
  const filePath = path.join(OUTPUT_DIR, `${mode}.ts`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template(mode), 'utf8');
    console.log(`🆕 Created ${filePath}`);
  } else {
    console.log(`ℹ️  ${filePath} already exists, skipped.`);
  }
});

// ================================
// ⚡ Generate ThemeProvider.tsx
// ================================
const imports = themeModes
  .map(mode => `import { ${mode} } from './${mode}';`)
  .join('\n');

const themeColorsObj = `export const themeColors = {
  ${themeModes.join(',\n  ')}
};`;

const themeModeType = `export type ThemeMode = keyof typeof themeColors;`;

const content = `// ================================
// 🚀 Auto-generated file - DO NOT EDIT
// ================================

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
${imports}

${themeColorsObj}

export type ThemeColors = typeof ${themeModes[0]};
${themeModeType}

export let GlobalColors: ThemeColors = ${themeModes[0]};

export const setGlobalColors = (mode: ThemeMode) => {
  GlobalColors = themeColors[mode];
};

interface IThemeContext {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<IThemeContext>({
  themeMode: '${themeModes[0]}',
  setThemeMode: () => {},
  colors: ${themeModes[0]},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme() as ThemeMode;
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    systemScheme || '${themeModes[0]}',
  );

  useEffect(() => {
    setGlobalColors(themeMode);
  }, [themeMode]);

  const value = useMemo(() => {
    return {
      themeMode,
      setThemeMode,
      colors: themeColors[themeMode],
    };
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const useColors = () => useTheme().colors;
`;

fs.writeFileSync(path.join(OUTPUT_DIR, OUTPUT_FILE_NAME), content, 'utf8');

console.log(
  `✅ Generated ${OUTPUT_FILE_NAME} with themes: ${themeModes.join(', ')}`,
);
