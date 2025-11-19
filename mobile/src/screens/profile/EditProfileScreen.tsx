import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, Image, ScrollView } from 'react-native';
import { launchCamera, launchImageLibrary, Asset, ImagePickerResponse } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
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

  const buildDataUri = async (asset: Asset): Promise<string | null> => {
    if (asset.base64) {
      const mime = asset.type || 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    }

    if (asset.uri) {
      try {
        const path = asset.uri.startsWith('file://') ? asset.uri.replace('file://', '') : asset.uri;
        const base64Data = await RNFS.readFile(path, 'base64');
        const mime = asset.type || 'image/jpeg';
        return `data:${mime};base64,${base64Data}`;
      } catch (error) {
        console.error('Avatar encode error:', error);
      }
    }

    return null;
  };

  const createImagePickerHandler = async (mode: 'camera' | 'library') => {
    const picker = mode === 'camera' ? launchCamera : launchImageLibrary;
    const response: ImagePickerResponse = await picker({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
      maxHeight: 1024,
      maxWidth: 1024,
    });

    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert('Photo error', response.errorMessage || 'Unable to access selected image.');
      return;
    }

    const asset: Asset | undefined = response.assets?.[0];
    if (!asset) return;

    const dataUri = await buildDataUri(asset);
    if (!dataUri) {
      Alert.alert('Photo error', 'Unable to process the selected photo.');
      return;
    }

    setAvatarUrl(dataUri);
  };

  const selectPhoto = () => {
    Alert.alert('Change photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => createImagePickerHandler('camera') },
      { text: 'Gallery', onPress: () => createImagePickerHandler('library') },
    ]);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if (newLinkUrl.trim()) {
        const response = await api.post(API_ENDPOINTS.PROFILE.LINKS, {
          platform: newLinkPlatform || 'link',
          label: newLinkLabel || newLinkPlatform || 'Link',
          url: newLinkUrl.trim(),
        });
        setLinks((prev) => [...prev, response.data.link]);
        setNewLinkLabel('');
        setNewLinkPlatform('');
        setNewLinkUrl('');
      }

      await api.put(API_ENDPOINTS.PROFILE.UPDATE, {
        displayName,
        bio,
        avatarUrl,
        showApps,
        isPrivate,
      });

      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.avatarContainer} onPress={selectPhoto}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{displayName?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.changePhotoText}>Change photo</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Display Name</Text>
        <View style={styles.inputField}>
          <TextInput
            style={styles.input}
            placeholder="Jordan Lee"
            placeholderTextColor="#9FA0C7"
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bio</Text>
        <View style={[styles.inputField, styles.textArea]}>
          <TextInput
            style={styles.input}
            placeholder="Tell people how you discover apps..."
            placeholderTextColor="#9FA0C7"
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>
      </View>

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleTitle}>Show apps on profile</Text>
          <Text style={styles.toggleSubtitle}>When off, nobody sees your collection.</Text>
        </View>
        <Switch value={showApps} onValueChange={setShowApps} />
      </View>

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleTitle}>Private profile</Text>
          <Text style={styles.toggleSubtitle}>Approve new followers manually.</Text>
        </View>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>

      <View style={styles.linksSection}>
        {links.map((link) => (
          <View key={link.id} style={styles.linkRow}>
            <View>
              <Text style={styles.linkLabel}>{link.label || link.platform}</Text>
              <Text style={styles.linkUrl}>{link.url}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveLink(link.id)}>
              <Text style={styles.linkRemove}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.newLinkRow}>
          <TextInput
            style={styles.newLinkInput}
            placeholder="Platform"
            placeholderTextColor="#B1B0C8"
            value={newLinkPlatform}
            onChangeText={setNewLinkPlatform}
          />
          <TextInput
            style={styles.newLinkInput}
            placeholder="Label"
            placeholderTextColor="#B1B0C8"
            value={newLinkLabel}
            onChangeText={setNewLinkLabel}
          />
          <TextInput
            style={styles.newLinkInputFull}
            placeholder="https://"
            placeholderTextColor="#B1B0C8"
            value={newLinkUrl}
            onChangeText={setNewLinkUrl}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleUpdate} disabled={loading}>
        <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: 24,
    borderRadius: 60,
    padding: 5,
    backgroundColor: '#E6E3FF',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#5D4CE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  changePhotoText: {
    textAlign: 'center',
    color: '#5D4CE0',
    marginTop: 8,
    marginBottom: 20,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B78A8',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  textArea: {
    minHeight: 100,
  },
  input: {
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F1843',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1843',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#8A88AD',
  },
  linksSection: {
    marginTop: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  linkLabel: {
    fontWeight: '600',
    color: '#1F1843',
  },
  linkUrl: {
    color: '#8A88AD',
    fontSize: 12,
  },
  linkRemove: {
    color: '#F45C84',
    fontWeight: '600',
  },
  newLinkRow: {
    marginTop: 8,
    gap: 10,
  },
  newLinkInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F1843',
  },
  newLinkInputFull: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F1843',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#5D4CE0',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A19CD1',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
