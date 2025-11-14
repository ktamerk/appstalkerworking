import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, Image } from 'react-native';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function EditProfileScreen({ navigation }: any) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showApps, setShowApps] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkPlatform, setNewLinkPlatform] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.PROFILE.ME);
      const profile = response.data.profile;
      setDisplayName(profile.displayName);
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setShowApps(profile.showApps);
      setIsPrivate(profile.isPrivate);
      setLinks(profile.links || []);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const selectPhoto = () => {
    // MVP: URL input for cross-platform compatibility
    // Production TODO: Implement expo-image-picker for real photo selection
    // Install: expo install expo-image-picker
    // Then use: ImagePicker.launchImageLibraryAsync() and upload to backend
    Alert.alert(
      'Change Profile Photo',
      'For this MVP, enter a photo URL. In production, this will use your camera/gallery.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Use Generated Avatar',
          onPress: () => {
            // Generate a pastel avatar based on display name
            const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a8b5ff&color=fff&size=200`;
            setAvatarUrl(generatedUrl);
          },
        },
        {
          text: 'Enter Custom URL',
          onPress: () => {
            // For custom image URLs
            const customUrl = prompt('Enter image URL (https://...)') || '';
            if (customUrl && customUrl.startsWith('http')) {
              setAvatarUrl(customUrl);
            }
          },
        },
      ]
    );
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.put(API_ENDPOINTS.PROFILE.UPDATE, {
        displayName,
        bio,
        avatarUrl,
        showApps,
        isPrivate,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }
    try {
      const response = await api.post(API_ENDPOINTS.PROFILE.LINKS, {
        platform: newLinkPlatform || 'url',
        label: newLinkLabel || newLinkPlatform || 'Link',
        url: newLinkUrl.trim(),
      });
      setLinks((prev) => [...prev, response.data.link]);
      setNewLinkLabel('');
      setNewLinkPlatform('');
      setNewLinkUrl('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add link');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await api.delete(API_ENDPOINTS.PROFILE.LINK(linkId));
      setLinks((prev) => prev.filter((link) => link.id !== linkId));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to remove link');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={selectPhoto}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your display name"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us about yourself"
        multiline
        numberOfLines={4}
      />

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={styles.label}>Show Apps</Text>
          <Text style={styles.hint}>Let others see your installed apps</Text>
        </View>
        <Switch value={showApps} onValueChange={setShowApps} />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={styles.label}>Private Profile</Text>
          <Text style={styles.hint}>Only approved followers can see your profile</Text>
        </View>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Bio Links</Text>
      {links.map((link) => (
        <View key={link.id} style={styles.linkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkLabel}>{link.label || link.platform}</Text>
            <Text style={styles.linkUrl}>{link.url}</Text>
          </View>
          <TouchableOpacity onPress={() => handleRemoveLink(link.id)}>
            <Text style={styles.deleteLink}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.linkInputs}>
        <TextInput
          style={styles.input}
          placeholder="Platform (e.g., Instagram)"
          value={newLinkPlatform}
          onChangeText={setNewLinkPlatform}
        />
        <TextInput
          style={styles.input}
          placeholder="Label"
          value={newLinkLabel}
          onChangeText={setNewLinkLabel}
        />
        <TextInput
          style={styles.input}
          placeholder="https://your-link.com"
          value={newLinkUrl}
          onChangeText={setNewLinkUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addLinkButton} onPress={handleAddLink}>
          <Text style={styles.addLinkButtonText}>Add Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  changePhotoText: {
    color: '#6C63FF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 15,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  switchLabel: {
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  linkLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  linkUrl: {
    color: '#666',
    fontSize: 13,
  },
  deleteLink: {
    color: '#FF5C8D',
    fontWeight: '600',
  },
  linkInputs: {
    marginTop: 12,
    gap: 10,
  },
  addLinkButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addLinkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
