import { createBrowserRouter } from 'react-router-dom';
import Explore from '../pages/explore';
import Login from '../pages/login';
import Register from '../pages/register';
import Home from '../pages/home';

export const router = createBrowserRouter([
  { path: '/', element: <Explore /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/home', element: <Home /> },
]);

