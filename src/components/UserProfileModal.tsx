import React, { useState } from 'react';
import { X, User, Settings, History, Clock, Video, Users } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    avatar: string;
    isPremium: boolean;
  };
}

interface HistoryItem {
  id: string;
  roomName: string;
  roomType: 'cinema' | 'mansion';
  visitedAt: string;
  duration: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onLogout, user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  // Mock history data - in real app, this would come from API
  const visitHistory: HistoryItem[] = [
    {
      id: '1',
      roomName: 'Gaming Cinema 🎮',
      roomType: 'cinema',
      visitedAt: '2024-01-15 14:30',
      duration: '2h 15m'
    },
    {
      id: '2',
      roomName: 'Chill Lounge ✨',
      roomType: 'mansion',
      visitedAt: '2024-01-15 12:00',
      duration: '45m'
    },
    {
      id: '3',
      roomName: 'Study Together 📚',
      roomType: 'mansion',
      visitedAt: '2024-01-14 20:15',
      duration: '3h 20m'
    },
    {
      id: '4',
      roomName: 'Movie Night 🍿',
      roomType: 'cinema',
      visitedAt: '2024-01-14 18:00',
      duration: '1h 55m'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-2xl border border-white/20 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-purple-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-purple-500"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{user.name}</h3>
                  <p className="text-white/70">{user.email}</p>
                  {user.isPremium && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white mt-2">
                      Premium Member
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white">Show Online Status</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white">Allow Friend Requests</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <History className="w-5 h-5 mr-2" />
                Room Visit History
              </h4>
              
              <div className="space-y-3">
                {visitHistory.map((item) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          {item.roomType === 'cinema' ? (
                            <Video className="w-5 h-5 text-white" />
                          ) : (
                            <Users className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-white font-medium">{item.roomName}</h5>
                          <div className="flex items-center space-x-4 text-sm text-white/60">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {item.visitedAt}
                            </span>
                            <span>Duration: {item.duration}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-white/50 capitalize bg-white/10 px-2 py-1 rounded">
                        {item.roomType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};