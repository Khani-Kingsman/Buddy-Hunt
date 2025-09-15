import React, { useState } from 'react';
import { X, Video, Users, Lock, Eye, EyeOff } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    type: 'cinema' | 'mansion';
    isPrivate: boolean;
    password?: string;
    description: string;
  }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreateRoom }) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'cinema' | 'mansion'>('cinema');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onCreateRoom({
        name: roomName,
        type: roomType,
        isPrivate,
        password: isPrivate ? password : undefined,
        description
      });
      
      // Reset form
      setRoomName('');
      setRoomType('cinema');
      setIsPrivate(false);
      setPassword('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Create room error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Enter room name"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Room Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoomType('cinema')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all ${
                  roomType === 'cinema'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Cinema</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('mansion')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all ${
                  roomType === 'mansion'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Mansion</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              placeholder="Describe your room..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="private-room"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
            <label htmlFor="private-room" className="text-white/80 text-sm font-medium flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Private Room (Password Protected)
            </label>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Room Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter room password"
                  required={isPrivate}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};