import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';

const App = () => (
  <>
    <AppRoutes />
    <Toaster position="bottom-right" richColors closeButton duration={3500} />
  </>
);

export default App;
