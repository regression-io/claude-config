import { Toaster } from "sonner";
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
