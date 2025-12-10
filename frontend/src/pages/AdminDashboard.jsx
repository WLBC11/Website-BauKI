import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin email list
const ADMIN_EMAILS = [
  'weiss.jonathan1107@outlook.com',
  'lukas.lust11@gmail.com'
];

const AdminDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state
  const [selectedRange, setSelectedRange] = useState('7'); // 'today', '7', '14', '30', 'custom'
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Check if user is admin
  const isAdmin = isAuthenticated && user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchStats();
    fetchFeedback();
  }, [isAuthenticated, isAdmin, navigate, startDate, endDate, authLoading]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/stats`, {
        params: {
          start_date: startOfDay(startDate).toISOString(),
          end_date: endOfDay(endDate).toISOString()
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFeedbackList(response.data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    console.log('🔴 handleDeleteFeedback called with ID:', feedbackId);
    
    // Check if confirm dialog works
    let shouldDelete = false;
    try {
      shouldDelete = window.confirm('Möchten Sie dieses Feedback wirklich löschen?');
      console.log('User confirmed deletion:', shouldDelete);
    } catch (confirmError) {
      console.error('Error with window.confirm:', confirmError);
      shouldDelete = true; // Proceed anyway if confirm fails
    }
    
    if (!shouldDelete) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('Proceeding with deletion...');
    try {
      const token = localStorage.getItem('token');
      console.log('=== DELETE FEEDBACK DEBUG ===');
      console.log('Feedback ID to delete:', feedbackId);
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      console.log('API URL:', `${API}/admin/feedback/${feedbackId}`);
      console.log('Current feedback list length:', feedbackList.length);
      
      const response = await axios.delete(`${API}/admin/feedback/${feedbackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Delete successful!', response.data);
      console.log('Filtering out feedback with ID:', feedbackId);
      
      const newList = feedbackList.filter(f => {
        console.log(`Comparing: ${f.id} !== ${feedbackId} = ${f.id !== feedbackId}`);
        return f.id !== feedbackId;
      });
      
      console.log('New feedback list length:', newList.length);
      setFeedbackList(newList);
      
      alert('✅ Feedback erfolgreich gelöscht!');
      
      // Force re-fetch to ensure sync
      await fetchFeedback();
      
    } catch (err) {
      console.error('❌ DELETE FAILED:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      
      let errorMsg = 'Unbekannter Fehler';
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(`❌ Fehler beim Löschen: ${errorMsg}\n\nBitte öffnen Sie die Browser-Console (F12) für Details.`);
    }
  };

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    setShowDatePicker(false);
    
    const end = new Date();
    let start;
    
    switch(range) {
      case 'today':
        start = new Date();
        break;
      case '7':
        start = subDays(end, 7);
        break;
      case '14':
        start = subDays(end, 14);
        break;
      case '30':
        start = subDays(end, 30);
        break;
      case 'custom':
        setShowDatePicker(true);
        return;
      default:
        start = subDays(end, 7);
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-white text-xl">Laden...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-white text-xl">Daten werden geladen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button - Mobile optimized */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 md:mb-4 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zum Chat
          </button>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-gray-400">BauKI - Verwaltung & Statistiken</p>
        </div>

        {/* Date Range Selector - Mobile optimized */}
        <div className="bg-[#2f2f2f] rounded-lg p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4 flex-wrap">
            <span className="text-gray-300 font-medium text-sm md:text-base">Zeitraum:</span>
            <button
              onClick={() => handleRangeChange('today')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                selectedRange === 'today' 
                  ? 'bg-white text-black' 
                  : 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => handleRangeChange('7')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                selectedRange === '7' 
                  ? 'bg-white text-black' 
                  : 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
              }`}
            >
              7 Tage
            </button>
            <button
              onClick={() => handleRangeChange('14')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                selectedRange === '14' 
                  ? 'bg-white text-black' 
                  : 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
              }`}
            >
              14 Tage
            </button>
            <button
              onClick={() => handleRangeChange('30')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                selectedRange === '30' 
                  ? 'bg-white text-black' 
                  : 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
              }`}
            >
              30 Tage
            </button>
            <button
              onClick={() => handleRangeChange('custom')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                selectedRange === 'custom' 
                  ? 'bg-white text-black' 
                  : 'bg-[#3f3f3f] text-gray-300 hover:bg-[#4f4f4f]'
              }`}
            >
              <span className="hidden sm:inline">Benutzerdefiniert</span>
              <span className="sm:hidden">Custom</span>
            </button>
          </div>

          {/* Custom Date Picker */}
          {showDatePicker && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Von:</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  dateFormat="dd.MM.yyyy"
                  locale={de}
                  className="bg-[#3f3f3f] text-white px-3 py-2 rounded-lg border border-[#4f4f4f]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Bis:</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="dd.MM.yyyy"
                  locale={de}
                  className="bg-[#3f3f3f] text-white px-3 py-2 rounded-lg border border-[#4f4f4f]"
                />
              </div>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anwenden
              </button>
            </div>
          )}

          {/* Selected Range Display */}
          <div className="text-gray-400 text-sm mt-4">
            Gewählter Zeitraum: {format(startDate, 'dd.MM.yyyy', { locale: de })} - {format(endDate, 'dd.MM.yyyy', { locale: de })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Gesamt Nutzer</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.total_users || 0}</p>
            <p className="text-gray-500 text-xs mt-1">All Time</p>
          </div>

          {/* New Users in Period */}
          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Neue Nutzer</h3>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.new_users_in_period || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Im gewählten Zeitraum</p>
          </div>

          {/* Active Users Today */}
          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Aktive Heute</h3>
              <span className="text-2xl">🔥</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.active_users_today || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Mit KI gechattet</p>
          </div>

          {/* Active Users in Period */}
          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-medium">Aktive im Zeitraum</h3>
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.active_users_in_period || 0}</p>
            <p className="text-gray-500 text-xs mt-1">Mit KI gechattet</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#2f2f2f] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">📈 Trend-Analyse</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stats?.chart_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f3f" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#2f2f2f', 
                  border: '1px solid #3f3f3f',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="new_users" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Neue Registrierungen"
                dot={{ fill: '#8b5cf6' }}
              />
              <Line 
                type="monotone" 
                dataKey="active_users" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Aktive Nutzer"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-3">💬 Chat-Statistiken</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Gesamt Chats:</span>
                <span className="text-white font-semibold">{stats?.total_conversations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Gesamt Nachrichten:</span>
                <span className="text-white font-semibold">{stats?.total_messages || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Ø Nachrichten/Chat:</span>
                <span className="text-white font-semibold">
                  {stats?.avg_messages_per_chat ? stats.avg_messages_per_chat.toFixed(1) : '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-3">🏆 Top Bundesländer</h3>
            <div className="space-y-2">
              {stats?.top_bundeslaender?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300 text-sm">{item.bundesland || 'Nicht gewählt'}:</span>
                  <span className="text-white font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#2f2f2f] rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium mb-3">📊 Aktivitäts-Rate</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Registrierte Nutzer:</span>
                <span className="text-white font-semibold">{stats?.total_users || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Haben gechattet:</span>
                <span className="text-white font-semibold">{stats?.users_with_chats || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Aktivitäts-Rate:</span>
                <span className="text-white font-semibold">
                  {stats?.total_users && stats.users_with_chats 
                    ? ((stats.users_with_chats / stats.total_users) * 100).toFixed(1) 
                    : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 bg-[#2f2f2f] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              💬 Nutzer-Feedback
              {feedbackList.length > 0 && (
                <span className="text-sm bg-[#3f3f3f] px-2 py-1 rounded-full">
                  {feedbackList.length}
                </span>
              )}
            </h2>
            <button
              onClick={fetchFeedback}
              className="px-3 py-1 text-sm bg-[#3f3f3f] text-gray-300 rounded-lg hover:bg-[#4f4f4f] transition-colors"
            >
              Aktualisieren
            </button>
          </div>

          {feedbackLoading ? (
            <div className="text-center py-8 text-gray-400">Lade Feedback...</div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Noch kein Feedback vorhanden
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-[#1f1f1f] rounded-lg p-4 border border-[#3f3f3f]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {feedback.user_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{feedback.user_name}</p>
                          <p className="text-gray-400 text-xs truncate">{feedback.user_email}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2 break-words">{feedback.message}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(feedback.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
