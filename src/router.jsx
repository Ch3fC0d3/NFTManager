import { 
  createBrowserRouter,
  createRoutesFromElements,
  Route
} from 'react-router-dom';
import HomeNew from './pages/HomeNew';

// Create simplified routes configuration with just the HomeNew component
const routes = createRoutesFromElements(
  <Route path="/" element={<HomeNew />} />
);

// Configure router with future flags to eliminate warnings
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true
  }
});

export default router;
