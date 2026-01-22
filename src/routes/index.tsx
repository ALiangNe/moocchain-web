import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Explore from '@/pages/explore/Explore';
import Login from '@/pages/login/Login';
import Register from '@/pages/register/Register';
import Home from '@/pages/home/Home';
import CourseLearn from '@/pages/courseLearn/CourseLearn';
import CourseLearnId from '@/pages/courseLearn/CourseLearnId';
import CourseLearnResourceId from '@/pages/courseLearn/CourseLearnResourceId';
import CourseMgmt from '@/pages/courseMgmt/CourseMgmt';
import CourseMgmtId from '@/pages/courseMgmt/CourseMgmtId';
import CourseMgmtResourceId from '@/pages/courseMgmt/CourseMgmtResourceId';
import User from '@/pages/user/User';
import Profile from '@/pages/profile/Profile';
import TeacherApply from '@/pages/teacherApply/TeacherApply';
import Audit from '@/pages/audit/Audit';
import NotFound from '@/pages/notfound/NotFound';
import LearningHistory from '@/pages/learningHistory/LearningHistory';
import CertificateTemplate from '@/pages/certificateTemplate/CertificateTemplate';
import CourseCertificate from '@/pages/courseCertificate/courseCertificate';
import CourseCertificateId from '@/pages/courseCertificate/courseCertificateId';
import TokenRule from '@/pages/tokenRule/tokenRule';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Explore /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/home', element: <Home /> },
      { path: '/courselearn', element: <CourseLearn /> },
      { path: '/courselearn/:courseId', element: <CourseLearnId /> },
      { path: '/courselearn/:courseId/resource/:resourceId', element: <CourseLearnResourceId /> },
      { path: '/coursemgmt', element: <CourseMgmt /> },
      { path: '/coursemgmt/:courseId', element: <CourseMgmtId /> },
      { path: '/coursemgmt/:courseId/resource/:resourceId', element: <CourseMgmtResourceId /> },
      { path: '/learningHistory', element: <LearningHistory /> },
      { path: '/coursecertificate', element: <CourseCertificate /> },
      { path: '/coursecertificate/:certificateId', element: <CourseCertificateId /> },
      { path: '/user', element: <User /> },
      { path: '/profile', element: <Profile /> },
      { path: '/teacherApply', element: <TeacherApply /> },
      { path: '/audit', element: <Audit /> },
      { path: '/certificateTemplate', element: <CertificateTemplate /> },
      { path: '/tokenRule', element: <TokenRule /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

