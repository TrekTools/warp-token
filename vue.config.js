const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    module: {
      rules: [
        {
          test: /gif\.worker\.js$/,
          use: ['worker-loader']
        }
      ]
    }
  },
  devServer: {
    proxy: {
      '/streamable': {
        target: 'https://api.streamable.com',
        changeOrigin: true,
        pathRewrite: {
          '^/streamable': ''
        }
      }
    }
  }
})
