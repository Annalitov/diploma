import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';
import PpoChoice from './pages/PpoChoice';
import PpoRegister from './pages/PpoRegister';
import PpoLogin from './pages/PpoLogin';
import PpoDashboard from './pages/PpoDashboard';
import AddPpoMember from './pages/AddPpoMember';
import ViewPpoMembers from './pages/ViewPpoMembers';
import PpoPayment from './pages/PpoPayment';

import Deanery from './pages/Deanery';
import DeaneryLogin from './pages/DeaneryLogin';
import DeaneryRegister from './pages/DeaneryRegister';
import DeaneryDashboard from './pages/DeaneryDashboard';
import DeaneryGroupDetail from './pages/DeaneryGroupDetail';
import DeanerySemesterDetail from './pages/DeanerySemesterDetail';
import DeanerySubjectDetail from './pages/DeanerySubjectDetail';
import DeaneryStatistics from './pages/DeaneryStatistics';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Профсоюз */}
        <Route path="/ppo" element={<PpoChoice />} />
        <Route path="/ppo/register" element={<PpoRegister />} />
        <Route path="/ppo/login" element={<PpoLogin />} />
        <Route path="/ppo/dashboard" element={<PpoDashboard />} />
        <Route path="/ppo/add-member" element={<AddPpoMember />} />
        <Route path="/ppo/view-members" element={<ViewPpoMembers />} />
        <Route path="/ppo/payment" element={<PpoPayment />} />

        {/* Деканат */}
        <Route path="/deanery" element={<Deanery />} />
        <Route path="/deanery/login" element={<DeaneryLogin />} />
        <Route path="/deanery/register" element={<DeaneryRegister />} />
        <Route path="/deanery/dashboard" element={<DeaneryDashboard />} />
        <Route path="/deanery/groups/:groupId" element={<DeaneryGroupDetail />} />
        <Route path="/deanery/groups/:groupId/semesters/:semId" element={<DeanerySemesterDetail />} />
        <Route path="/deanery/statistics" element={<DeaneryStatistics />} />
        <Route path="/deanery/groups/:groupId/semesters/:semId/subjects/:subjId" element={<DeanerySubjectDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
