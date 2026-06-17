const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 LYM|LYN backend running on http://localhost:${PORT}`);
});

module.exports = app;
