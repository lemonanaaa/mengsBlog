const { createProxyMiddleware } = require('http-proxy-middleware');

// 开发环境下，将前端(3000)的 /uploads 静态资源请求代理到后端(3001)。
// 这样博客内容里存的相对路径 /uploads/blogs/xxx.png 在本地也能正常显示，
// 生产环境同源部署时该路径天然可用，无需改动内容。
module.exports = function (app) {
  const target = process.env.REACT_APP_BACKEND_ORIGIN || 'http://localhost:3001';
  app.use(
    '/uploads',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
