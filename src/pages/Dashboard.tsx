import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';

import {
  Star, Users, ClipboardList, Trophy, Zap, MapPin, Calendar, Edit, Sun, Moon
} from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || 'Sarah Johnson');
  const [userPhone, setUserPhone] = useState(localStorage.getItem('user_phone') || '+1XXXXXXXXXX');
  const [joinDate] = useState(localStorage.getItem('join_date') || new Date().toISOString());
  const formattedJoinDate = new Date(joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const referralCode = `UPLAUD${userPhone.slice(-4)}`;
  const [activeTab, setActiveTab] = useState('Overview');
  const [darkMode, setDarkMode] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) navigate('/login');
  }, [navigate]);

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Reviews',
      data: [10, 20, 15, 30, 25],
      backgroundColor: '#a855f7',
    }],
  };

  const pieData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [70, 20, 10],
      backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
    }],
  };

  const saveSettings = () => {
    localStorage.setItem('user_name', userName);
    localStorage.setItem('user_phone', userPhone);
    setEditingSettings(false);
  };

  const bgColor = darkMode ? 'bg-[#0f172a]' : 'bg-[#f9f6ff]';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const cardColor = darkMode ? 'bg-[#1e293b]' : 'bg-white';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bgColor} px-6 py-10 font-sans ${textColor} relative`}>
      <BackButton to="/" label="Back to Home" className="absolute top-6 left-6 z-10" />
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 bg-gray-200 dark:bg-gray-800 text-sm px-4 py-1 rounded-full"
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />} {darkMode ? 'Light' : 'Dark'}
      </button>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className={`${cardColor} shadow-lg rounded-2xl p-6 flex items-center gap-6`}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700">
            {userName.split(' ').map(n => n[0]).join('')}
            <button className="absolute bottom-0 right-0 p-1 bg-purple-600 rounded-full text-white hover:bg-purple-700">
              <Edit size={14} />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {userName} <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1">@sarahfoodie</span>
            </h2>
            <p className={`text-sm flex items-center gap-2 ${secondaryTextColor}`}>
              <Calendar size={16} /> Joined {formattedJoinDate}
              <MapPin size={16} /> Austin, TX
            </p>
            <p className={`text-sm mt-2 ${secondaryTextColor}`}>Food enthusiast and local business advocate. Always hunting for Austin's hidden gems 🌮✨</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatBox icon={<Users />} label="Followers" value="0" color="blue" />
          <StatBox icon={<Users />} label="Following" value="0" color="green" />
          <StatBox icon={<Star />} label="Reviews" value="0" color="yellow" />
          <StatBox icon={<Zap />} label="XP Score" value="0" color="purple" />
          <StatBox icon={<ClipboardList />} label="Referrals" value="0" color="pink" />
        </div>

        {/* Tabs */}
        <div className={`${cardColor} rounded-2xl shadow p-4`}>
          <div className="flex gap-6 border-b mb-4 text-sm">
            {['Overview', 'Reviews', 'Analytics', 'Settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 ${activeTab === tab ? 'border-b-2 border-purple-600 text-purple-600 font-semibold' : 'text-gray-500 hover:text-purple-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">🥇 Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-600 text-white p-4 rounded-xl text-center">🎯 First Review</div>
                <div className="bg-yellow-600 text-white p-4 rounded-xl text-center">👑 Top Reviewer</div>
                <div className="bg-purple-600 text-white p-4 rounded-xl text-center">💬 Community Contributor</div>
              </div>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">📄 Your Reviews</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Trailblazer Travels – "Great experience!"</li>
                <li>SweetSpot Cafe – "Lovely ambiance and food!"</li>
                <li>Elite Fitness Gym – "Very clean and modern."</li>
              </ul>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm mb-1">Monthly Reviews</h4>
                <Bar data={barData} />
              </div>
              <div>
                <h4 className="text-sm mb-1">Sentiment Distribution</h4>
                <Pie data={pieData} />
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="space-y-4">
              {editingSettings ? (
                <>
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Name"
                  />
                  <input
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Phone"
                  />
                  <button
                    onClick={saveSettings}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >Save</button>
                </>
              ) : (
                <button
                  onClick={() => setEditingSettings(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >Edit Profile</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value, color }) => {
  const bg = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  }[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center">
      <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full ${bg}`}>{icon}</div>
      <div className="text-xl font-bold mt-2 text-gray-800 dark:text-white">{value}</div>
      <p className="text-sm text-gray-500 dark:text-gray-300">{label}</p>
    </div>
  );
};

export default Dashboard;
