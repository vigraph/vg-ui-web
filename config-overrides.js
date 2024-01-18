const webpack = require('webpack')

module.exports = function override(config, env) {
  config.plugins.push(new webpack.ProvidePlugin({
    process: 'process/browser',
    Buffer: ['buffer', 'Buffer'],
  }))

  config.resolve = {
    ...config.resolve,
    extensions: ['.ts', '.js', '.jsx', '.tsx'],
    fallback: {
      fs: false,
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url/"),
      "zlib": require.resolve("browserify-zlib"),
      "path": require.resolve("path-browserify"),
      "assert": require.resolve("assert"),
      "util": require.resolve("util"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  }

  config.externals = ['tls', 'net', 'fs']

  // Hack the issuer out of the SVGR rule, which breaks the loader in
  // WebPack 5.0
  console.log("Deleting issuer from SVGR webpack rule");
  const rules = config.module.rules;
  for(const rule of rules)
  {
    if (rule.oneOf)
    {
      for(const subrule of rule.oneOf)
        delete subrule.issuer;  // The SVG rule is the only one that has one
    }
  }

  return config;
}
