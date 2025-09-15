import React, { useState, useEffect } from 'react';
import { X, User, Camera, Upload, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { UserProfile, ProfileChangeRestriction } from '../types/user';
import { ProfileService } from '../services/ProfileService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onProfileUpdate: (profile: UserProfile) => void;
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
  'Australia', 'Japan', 'South Korea', 'China', 'India', 'Brazil', 'Mexico', 'Other'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Other'
];

const ETHNICITIES = [
  'Asian', 'Black or African American', 'Hispanic or Latino', 'Native American',
  'Pacific Islander', 'White', 'Mixed Race', 'Other', 'Prefer not to say'
];

const RELIGIONS = [
  'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Sikhism',
  'Atheist', 'Agnostic', 'Spiritual', 'Other', 'Prefer not to say'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userId, onProfileUpdate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restrictions, setRestrictions] = useState<ProfileChangeRestriction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'photos' | 'privacy'>('basic');

  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
      loadRestrictions();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await ProfileService.getUserProfile(userId);
      if (profileData) {
        setProfile(profileData);
        setFormData(profileData);
        setSelectedLanguages(profileData.languages || []);
        setSelectedHobbies(profileData.hobbies || []);
      } else {
        // Create initial profile
        const initialProfile = {
          user_id: userId,
          display_name: '',
          bio: '',
          hobbies: [],
          languages: [],
          additional_photos: [],
          profile_visibility: 'public' as const,
          email_visibility: 'private' as const,
          photo_privacy: {
            profile_picture: 'public' as const,
            additional_photos: 'public' as const
          }
        };
        setFormData(initialProfile);
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRestrictions = async () => {
    try {
      const restrictionData = await ProfileService.getProfileChangeRestrictions(userId);
      setRestrictions(restrictionData);
    } catch (error) {
      console.error('Failed to load restrictions:', error);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLanguageToggle = (language: string) => {
    const updated = selectedLanguages.includes(language)
      ? selectedLanguages.filter(l => l !== language)
      : [...selectedLanguages, language];
    setSelectedLanguages(updated);
    handleInputChange('languages', updated);
  };

  const handleAddHobby = () => {
    if (newHobby.trim() && !selectedHobbies.includes(newHobby.trim())) {
      const updated = [...selectedHobbies, newHobby.trim()];
      setSelectedHobbies(updated);
      handleInputChange('hobbies', updated);
      setNewHobby('');
    }
  };

  const handleRemoveHobby = (hobby: string) => {
    const updated = selectedHobbies.filter(h => h !== hobby);
    setSelectedHobbies(updated);
    handleInputChange('hobbies', updated);
  };

  const handleProfilePictureUpload = async (file: File) => {
    try {
      setIsSaving(true);
      const url = await ProfileService.uploadProfilePicture(userId, file);
      handleInputChange('profile_picture_url', url);
      setSuccess('Profile picture uploaded successfully');
    } catch (error) {
      setError('Failed to upload profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdditionalPhotoUpload = async (file: File) => {
    try {
      setIsSaving(true);
      const url = await ProfileService.uploadAdditionalPhoto(userId, file);
      const currentPhotos = formData.additional_photos || [];
      handleInputChange('additional_photos', [...currentPhotos, url]);
      setSuccess('Photo uploaded successfully');
    } catch (error) {
      setError('Failed to upload photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    const currentPhotos = formData.additional_photos || [];
    handleInputChange('additional_photos', currentPhotos.filter(url => url !== photoUrl));
  };

  const handleSave = async () => {
    if (!formData.display_name?.trim()) {
      setError('Display name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let savedProfile;
      if (profile) {
        savedProfile = await ProfileService.updateUserProfile(userId, formData);
      } else {
        savedProfile = await ProfileService.createUserProfile(formData);
      }

      if (savedProfile) {
        setProfile(savedProfile);
        onProfileUpdate(savedProfile);
        setSuccess('Profile updated successfully');
        await loadRestrictions(); // Reload restrictions after update
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getNextChangeDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
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
            onClick={() => setActiveTab('basic')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'basic'
                ? 'bg-purple-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Basic Info</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'photos'
                ? 'bg-purple-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'privacy'
                ? 'bg-purple-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Privacy</span>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-200">{success}</span>
          </div>
        )}

        <div className="overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Display Name *
                  {restrictions && !restrictions.canChangeName && (
                    <span className="text-yellow-400 text-xs ml-2">
                      (Can change again on {getNextChangeDate(restrictions.nameChangeAvailableAt)})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  disabled={restrictions && !restrictions.canChangeName}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  placeholder="Enter your display name"
                  maxLength={50}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Age
                  {restrictions && !restrictions.canChangeAge && (
                    <span className="text-yellow-400 text-xs ml-2">
                      (Can change again on {getNextChangeDate(restrictions.ageChangeAvailableAt)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                  disabled={restrictions && !restrictions.canChangeAge}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  placeholder="Enter your age"
                  min="13"
                  max="120"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-right text-xs text-white/50 mt-1">
                  {(formData.bio || '').length}/1000
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Country</label>
                <select
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country} className="bg-gray-800">
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ethnicity */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Ethnicity</label>
                <select
                  value={formData.ethnicity || ''}
                  onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Select your ethnicity</option>
                  {ETHNICITIES.map(ethnicity => (
                    <option key={ethnicity} value={ethnicity} className="bg-gray-800">
                      {ethnicity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Religion</label>
                <select
                  value={formData.religion || ''}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Select your religion</option>
                  {RELIGIONS.map(religion => (
                    <option key={religion} value={religion} className="bg-gray-800">
                      {religion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Languages</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LANGUAGES.map(language => (
                    <label key={language} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                      />
                      <span className="text-white/80 text-sm">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Hobbies</label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Add a hobby"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
                  />
                  <button
                    onClick={handleAddHobby}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedHobbies.map(hobby => (
                    <span
                      key={hobby}
                      className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-sm text-white"
                    >
                      {hobby}
                      <button
                        onClick={() => handleRemoveHobby(hobby)}
                        className="ml-2 text-white/60 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center space-x-4">
                  {formData.profile_picture_url ? (
                    <img
                      src={formData.profile_picture_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                      <User className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleProfilePictureUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Photos */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Additional Photos</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {(formData.additional_photos || []).map((photoUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photoUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemovePhoto(photoUrl)}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(formData.additional_photos || []).length < 6 && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleAdditionalPhotoUpload(e.target.files[0])}
                        className="hidden"
                      />
                      <div className="w-full h-32 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 transition-colors">
                        <Upload className="w-6 h-6 text-white/50 mb-2" />
                        <span className="text-white/50 text-sm">Add Photo</span>
                      </div>
                    </label>
                  )}
                </div>
                <p className="text-white/60 text-sm">
                  You can upload up to 6 additional photos. Maximum file size: 5MB each.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Profile Visibility */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Profile Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value="public"
                      checked={formData.profile_visibility === 'public'}
                      onChange={(e) => handleInputChange('profile_visibility', e.target.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-white font-medium">Public</div>
                      <div className="text-white/60 text-sm">Anyone can view your profile</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value="private"
                      checked={formData.profile_visibility === 'private'}
                      onChange={(e) => handleInputChange('profile_visibility', e.target.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-white font-medium">Private</div>
                      <div className="text-white/60 text-sm">Only you can view your profile</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email Visibility */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Email Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="email_visibility"
                      value="public"
                      checked={formData.email_visibility === 'public'}
                      onChange={(e) => handleInputChange('email_visibility', e.target.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-white font-medium">Public</div>
                      <div className="text-white/60 text-sm">Others can see your email address</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="email_visibility"
                      value="private"
                      checked={formData.email_visibility === 'private'}
                      onChange={(e) => handleInputChange('email_visibility', e.target.value)}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-white font-medium">Private</div>
                      <div className="text-white/60 text-sm">Keep your email address private</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Photo Privacy */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Photo Privacy</label>
                <div className="space-y-4">
                  <div>
                    <div className="text-white/80 text-sm mb-2">Profile Picture</div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="profile_picture_privacy"
                          value="public"
                          checked={formData.photo_privacy?.profile_picture === 'public'}
                          onChange={(e) => handleInputChange('photo_privacy', {
                            ...formData.photo_privacy,
                            profile_picture: e.target.value
                          })}
                          className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                        />
                        <span className="text-white/80">Public</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="profile_picture_privacy"
                          value="private"
                          checked={formData.photo_privacy?.profile_picture === 'private'}
                          onChange={(e) => handleInputChange('photo_privacy', {
                            ...formData.photo_privacy,
                            profile_picture: e.target.value
                          })}
                          className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                        />
                        <span className="text-white/80">Private</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="text-white/80 text-sm mb-2">Additional Photos</div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="additional_photos_privacy"
                          value="public"
                          checked={formData.photo_privacy?.additional_photos === 'public'}
                          onChange={(e) => handleInputChange('photo_privacy', {
                            ...formData.photo_privacy,
                            additional_photos: e.target.value
                          })}
                          className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                        />
                        <span className="text-white/80">Public</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="additional_photos_privacy"
                          value="private"
                          checked={formData.photo_privacy?.additional_photos === 'private'}
                          onChange={(e) => handleInputChange('photo_privacy', {
                            ...formData.photo_privacy,
                            additional_photos: e.target.value
                          })}
                          className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 focus:ring-purple-500"
                        />
                        <span className="text-white/80">Private</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};