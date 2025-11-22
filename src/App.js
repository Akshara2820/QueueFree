import './App.css';
import Home from './pages/Home';

function App() {
  // Attempt to load RouterProvider and router at runtime. If react-router-dom
  // or the router factory is missing, fall back to a simple Home UI so the app
  // doesn't render a blank screen.
  let RouterProvider = null;
  let router = null;

  try {
    // Use require to avoid top-level import errors when dependency missing.
    // eslint-disable-next-line global-require
    const rrd = require('react-router-dom');
    RouterProvider = rrd && rrd.RouterProvider;
    // eslint-disable-next-line global-require
    const makeRouter = require('./router').default;
    if (RouterProvider && typeof makeRouter === 'function') {
      router = makeRouter();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Router not available; rendering fallback Home. ', err && err.message);
  }

  if (RouterProvider && router) {
    const RP = RouterProvider;
    return <RP router={router} />;
  }

  // Fallback visible Home page (no router required)
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 p-3 rounded-md bg-yellow-50 border">Router not available — showing fallback Home.</div>
        <Home />
      </div>
    </div>
  );
}

export default App;
