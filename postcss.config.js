// postcss.config.js

// import postcssPresetEnv from 'postcss-preset-env';

// export const plugins = [
//   postcssPresetEnv({
//     autoprefixer: {
//       flexbox: 'no-2009',
//     },
//     stage: 3,
//   }),
// ];
export const plugins = [
  require('tailwindcss'),
  require('autoprefixer'),
];