import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';

interface NewApp {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform: string;
}

interface NewAppPromptProps {
  visible: boolean;
  apps: NewApp[];
  onConfirm: (selectedApps: string[]) => void;
  onDismiss: () => void;
}

export default function NewAppPrompt({ visible, apps, onConfirm, onDismiss }: NewAppPromptProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    // whenever modal opens, default to selecting every discovered app
    if (visible) {
      setSelected(new Set(apps.map((app) => app.packageName)));
    }
  }, [visible, apps]);

  const toggleApp = (packageName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(packageName)) {
        next.delete(packageName);
      } else {
        next.add(packageName);
      }
      return next;
    });
  };

  if (!visible || apps.length === 0) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    setSelected(new Set());
  };

  const handleDismiss = () => {
    setSelected(new Set());
    onDismiss();
  };

  const renderApp = ({ item }: { item: NewApp }) => {
    const isSelected = selected.has(item.packageName);

    return (
      <TouchableOpacity style={styles.appItem} onPress={() => toggleApp(item.packageName)}>
        <View style={styles.appInfo}>
          {item.appIcon ? (
            <Image source={{ uri: item.appIcon }} style={styles.appIcon} />
          ) : (
            <View style={styles.appIconFallback}>
              <Text style={styles.appIconInitial}>{item.appName[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.appMeta}>Tap to toggle visibility</Text>
          </View>
        </View>
        <View style={[styles.togglePill, isSelected ? styles.toggleActive : styles.toggleInactive]}>
          <Text style={isSelected ? styles.toggleActiveText : styles.toggleInactiveText}>
            {isSelected ? 'Visible' : 'Hidden'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>New Apps Detected</Text>
          <Text style={styles.subtitle}>Choose which apps to show on your profile.</Text>

          <FlatList
            data={apps}
            renderItem={renderApp}
            keyExtractor={(item) => item.packageName}
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ paddingVertical: 8 }}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleDismiss}>
              <Text style={styles.buttonSecondaryText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleConfirm}>
              <Text style={styles.buttonPrimaryText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1A3D',
  },
  subtitle: {
    fontSize: 13,
    color: '#7B7AA4',
    marginTop: 4,
    marginBottom: 12,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F8',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  appIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E4E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconInitial: {
    fontWeight: '700',
    color: '#5D4CE0',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1A3D',
  },
  appMeta: {
    fontSize: 12,
    color: '#8B89B2',
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleActive: {
    borderWidth: 1,
    borderColor: '#5D4CE0',
    backgroundColor: '#F2EFFF',
  },
  toggleInactive: {
    borderWidth: 1,
    borderColor: '#E1E0F0',
    backgroundColor: '#fff',
  },
  toggleActiveText: {
    color: '#5D4CE0',
    fontWeight: '700',
  },
  toggleInactiveText: {
    color: '#8B89B2',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#5D4CE0',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#DAD8F2',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#665DA7',
    fontWeight: '600',
  },
});
