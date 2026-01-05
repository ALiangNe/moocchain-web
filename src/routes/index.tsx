import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout';
import Explore from '../pages/explore';
import Login from '../pages/login';
import Register from '../pages/register';
import Home from '../pages/home';
import Courses from '../pages/courses';
import Resources from '../pages/resources';
import Users from '../pages/users';
import Profile from '../pages/profile';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Explore /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/home', element: <Home /> },
      { path: '/courses', element: <Courses /> },
      { path: '/resources', element: <Resources /> },
      { path: '/users', element: <Users /> },
      { path: '/profile', element: <Profile /> },
    ],
  },
]);

