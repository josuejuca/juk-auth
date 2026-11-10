module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // em produção, remove console.* (evita vazar qualquer dado em logs do aparelho)
      production: { plugins: ['transform-remove-console'] },
    },
  };
};
