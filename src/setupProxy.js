const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );

  app.use(
    '/cv',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );

  app.use(
    '/ats',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );

  app.use(
    '/applications',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );

  app.use(
    '/reports',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );

  app.use(
    '/admin',
    createProxyMiddleware({
      target: 'https://techcareerfit-backend.onrender.com',
      changeOrigin: true,
      secure: true,
    })
  );
};
