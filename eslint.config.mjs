// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const layerPatterns = (layers) =>
  layers.flatMap((layer) => [`**/${layer}`, `**/${layer}/**`]);

const ALL_MODULES = [
  'ags',
  'canvas-sync',
  'chat',
  'content-generation',
  'course',
  'curriculum',
  'document',
  'essay-processor',
  'learning-agent',
  'lesson',
  'lti',
  'micro-content',
  'model-settings',
  'question',
  'question-bank',
  'quiz',
  'review',
  'roster',
  'video-asset',
];

const MODULE_ALLOWED_DEPS = {
  'canvas-sync': ['document', 'roster'],
  'content-generation': ['question'],
  curriculum: ['course'],
  'learning-agent': ['question', 'quiz', 'roster'],
  lti: ['canvas-sync', 'roster'],
  'micro-content': ['question'],
  'question-bank': ['question'],
  quiz: ['ags', 'question', 'question-bank', 'roster'],
  review: ['question', 'question-bank'],
};

const forbiddenModulePatterns = (mod) => {
  const allowed = new Set([mod, ...(MODULE_ALLOWED_DEPS[mod] ?? [])]);
  return ALL_MODULES.filter((other) => !allowed.has(other)).flatMap((other) => [
    `../${other}`,
    `../${other}/**`,
    `../../${other}`,
    `../../${other}/**`,
    `../../../${other}`,
    `../../../${other}/**`,
    `**/modules/${other}`,
    `**/modules/${other}/**`,
  ]);
};

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/config/**/*.ts', 'src/testing/**/*.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Chỉ được đọc process.env trong src/config/** (docs/ke-hoach-tai-cau-truc-core-api.md §2).',
        },
      ],
    },
  },
  {
    files: ['src/common/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns([
                'infra',
                'integrations',
                'messaging',
                'modules',
                'auth',
                'config',
                'testing',
              ]),
              message:
                'common/ phải thuần, không phụ thuộc thư mục nội bộ khác (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              allowTypeImports: true,
              message:
                'common/ chỉ được dùng import type từ @prisma/client (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/config/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns([
                'infra',
                'integrations',
                'messaging',
                'modules',
                'auth',
                'testing',
              ]),
              message:
                'config/ chỉ được phụ thuộc common/ (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/infra/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns([
                'auth',
                'integrations',
                'messaging',
                'modules',
                'testing',
              ]),
              message:
                'infra/ chỉ được phụ thuộc common/ và config/ (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/integrations/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns(['auth', 'messaging', 'modules', 'testing']),
              message:
                'integrations/ chỉ được phụ thuộc common/, config/, infra/ (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/auth/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns([
                'integrations',
                'messaging',
                'modules',
                'testing',
              ]),
              message:
                'auth/ chỉ được phụ thuộc common/, config/, infra/ (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/messaging/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: layerPatterns([
                'auth',
                'integrations',
                'modules',
                'testing',
              ]),
              message:
                'messaging/ chỉ được phụ thuộc common/, config/, infra/ (docs/ke-hoach-tai-cau-truc-core-api.md §3.1).',
            },
          ],
        },
      ],
    },
  },
  ...ALL_MODULES.map((mod) => ({
    files: [`src/modules/${mod}/**/*.ts`],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbiddenModulePatterns(mod),
              message: `modules/${mod}/ không được phụ thuộc module ngoài bảng §3.2 (docs/ke-hoach-tai-cau-truc-core-api.md §3.2).`,
            },
          ],
        },
      ],
    },
  })),
);
