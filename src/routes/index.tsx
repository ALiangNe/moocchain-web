import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Explore from '../pages/explore/Explore';
import Login from '../pages/login/Login';
import Register from '../pages/register/Register';
import Home from '../pages/home/Home';
import Courses from '../pages/courses/Courses';
import Resources from '../pages/resources/Resources';
import Users from '../pages/users/Users';
import Profile from '../pages/profile/Profile';
import TeacherApply from '../pages/teacherApply/TeacherApply';
import Audit from '../pages/audit/Audit';

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
      { path: '/teacherApply', element: <TeacherApply /> },
      { path: '/audit', element: <Audit /> },
    ],
  },
]);

