
import app from './app';

const port = 3000;


app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
  console.log(`📋 API available at http://localhost:${port}/api`);
});
