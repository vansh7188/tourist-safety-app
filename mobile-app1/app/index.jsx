import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, Image } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import useLocation from '../hooks/useLocation';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = () => {};
if (Constants.appOwnership !== 'expo') {
  try {
    const SpeechRecognition = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = SpeechRecognition.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = SpeechRecognition.useSpeechRecognitionEvent;
  } catch (err) {
    console.warn('Speech recognition is unavailable in this native build:', err.message);
  }
}

const COLORS = {
  navy: '#001F3F',
  teal: '#39CCCC',
  bg: '#F4F6F6',
  danger: '#D32F2F'
};

export default function Dashboard() {
  const { user, hydrating } = useAuth();
  const router = useRouter();
  const { requestLocation, loading: locLoading } = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [highCrime, setHighCrime] = useState(false);
  const [panicQuery, setPanicQuery] = useState('');
  const [digitalId, setDigitalId] = useState(null);
  const [sendingPanic, setSendingPanic] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pendingVoiceTriggerRef = useRef(false);

  useEffect(() => {
    // placeholder: fetch safety data from backend
    const fetchData = async () => {
      try {
        // const res = await api.get('/safety/nearby');
        // setAlerts(res.data.alerts);
        // stub data
        setAlerts([
          { id: 'a1', severity: 'High', text: 'Robbery reported', distance: 0.02, rating: 4.2 },
        ]);
        setHighCrime(true);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const voiceAvailable = useMemo(
    () => ExpoSpeechRecognitionModule && ExpoSpeechRecognitionModule.isRecognitionAvailable,
    []
  );

  useSpeechRecognitionEvent('result', (event) => {
    const nextTranscript = event.results[0]?.transcript || '';
    if (!nextTranscript) return;

    setTranscript(nextTranscript);
    const lower = nextTranscript.toLowerCase();
    const commandDetected = lower.includes('panic') || lower.includes('help') || lower.includes('sos');

    if (commandDetected && !pendingVoiceTriggerRef.current) {
      pendingVoiceTriggerRef.current = true;
      void handleSOS(nextTranscript, { skipCamera: true }).finally(() => {
        pendingVoiceTriggerRef.current = false;
      });
    }
  });

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    Alert.alert('Voice', event?.error || 'Voice recognition failed.');
  });

  useEffect(() => {
    const loadDigitalId = async () => {
      if (!user?.email) return;

      try {
        const response = await api.get('/digitalid/digital-id', {
          params: { email: user.email },
        });
        const data = Array.isArray(response?.data) ? response.data[0] : null;
        setDigitalId(data || null);
      } catch (error) {
        console.error('Failed to load digital ID:', error);
        setDigitalId(null);
      }
    };

    loadDigitalId();
  }, [user?.email]);

  const transformLocation = (loc) => {
    if (!loc?.coords) return null;
    return {
      coordinates: {
        type: 'Point',
        coordinates: [loc.coords.longitude, loc.coords.latitude],
      },
      type: 'current',
      detailed_address: 'Emergency Triggered via Mobile App',
    };
  };

  const requestCameraCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Camera', 'Camera permission is required to capture panic evidence.');
      return [];
    }

    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.65,
      base64: true,
      allowsEditing: false,
    });

    if (shot.canceled || !shot.assets?.length) return [];

    const asset = shot.assets[0];
    if (!asset.base64) return [];

    const mimeType = asset.mimeType || 'image/jpeg';
    return [`data:${mimeType};base64,${asset.base64}`];
  };

  const readPendingQueue = async () => {
    try {
      const raw = await AsyncStorage.getItem('pendingPanicQueue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writePendingQueue = async (queue) => {
    try {
      await AsyncStorage.setItem('pendingPanicQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save pending panic queue:', error);
    }
  };

  const queuePanicRequest = async (payload, photos = []) => {
    const queue = await readPendingQueue();
    const queuedAt = new Date().toISOString();
    const queuedItem = {
      panicPayload: {
        ...payload,
        delivery_source: 'offline_queue',
        queued_at: queuedAt,
      },
      capturedPhotos: photos,
      queuedAt,
      attempts: 0,
    };
    queue.push(queuedItem);
    await writePendingQueue(queue);
    return queue.length;
  };

  const syncPendingPanicRequests = async () => {
    const queue = await readPendingQueue();
    if (!queue.length) return;

    console.log(`Syncing ${queue.length} pending panic requests...`);
    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const payload = {
          ...item.panicPayload,
          synced_at: new Date().toISOString(),
        };

        // Attempt sending panic
        await api.post('/digitalid/panic', payload);

        // Attempt sending photos
        if (item.capturedPhotos?.length) {
          await api.post('/digitalid/panic-photos', {
            panic_request_id: payload.panic_request_id,
            email: payload.email,
            contact_number: payload.contact_number,
            panic_photos: item.capturedPhotos,
          });
        }
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync panic item:', err);
        remaining.push({
          ...item,
          attempts: (item.attempts || 0) + 1,
        });
      }
    }

    await writePendingQueue(remaining);
    if (syncedCount > 0) {
      Alert.alert('Sync Complete', `Successfully synced ${syncedCount} offline panic alert(s).`);
    }
  };

  useEffect(() => {
    if (user?.email) {
      syncPendingPanicRequests();
    }
  }, [user?.email]);

  const handleSOS = async (voiceQuery = '', options = {}) => {
    try {
      if (sendingPanic) return;
      setSendingPanic(true);

      // Try to sync any previous offline items first
      await syncPendingPanicRequests();

      const loc = await requestLocation();
      if (!loc) return Alert.alert('Location', 'Permission required');

      if (!digitalId) {
        Alert.alert('Digital ID', 'Create your Digital ID before using SOS.');
        return;
      }

      const panicRequestId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const transformedContacts = (digitalId.emergencyContacts || []).map((contact) => ({
        name: contact.name,
        email: contact.email,
        phone: contact.contact,
        relation: contact.relation,
      }));

      const panicText = String(voiceQuery || panicQuery || transcript || '').trim();
      const photoData = options.skipCamera ? [] : await requestCameraCapture();
      
      const payload = {
        panic_request_id: panicRequestId,
        email: user.email,
        name: digitalId.name || user.name || 'Anonymous User',
        contact_number: digitalId.contactInfo,
        panic_query: panicText,
        delivery_source: 'direct',
        client_triggered_at: new Date().toISOString(),
        queued_at: null,
        synced_at: null,
        kyc: {
          aadhaar: { number: digitalId.aadhaarNumber || null },
          passport: {
            number: digitalId.passportNumber || null,
            country: digitalId.passportCountry || null,
          },
        },
        emergency_contacts: transformedContacts,
        locations: transformLocation(loc) ? [transformLocation(loc)] : [],
      };

      try {
        await api.post('/digitalid/panic', payload);

        if (photoData.length) {
          await api.post('/digitalid/panic-photos', {
            panic_request_id: panicRequestId,
            email: user.email,
            contact_number: digitalId.contactInfo,
            panic_photos: photoData,
          });
        }

        setPanicQuery('');
        setTranscript('');
        Alert.alert('Emergency', 'Alert sent. Help is on the way.');
      } catch (postErr) {
        console.warn('Network request failed, queuing panic alert offline:', postErr);
        const queuedCount = await queuePanicRequest(payload, photoData);
        setPanicQuery('');
        setTranscript('');
        Alert.alert(
          'Offline Alert Queued',
          `Panic alert saved offline (${queuedCount} pending). It will sync automatically when network is restored.`
        );
      }
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Failed to send emergency';
      Alert.alert('Error', message);
    } finally {
      setSendingPanic(false);
    }
  };

  const handleVoiceCommand = async () => {
    if (!voiceAvailable) {
      Alert.alert('Voice', 'Voice recognition is not available on this device.');
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone', 'Microphone permission is required for voice command.');
      return;
    }

    if (isListening) {
      await ExpoSpeechRecognitionModule.stop();
      return;
    }

    await ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  if (hydrating) return <LoadingSpinner />;
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}> 
      <View style={[styles.header, { backgroundColor: COLORS.navy }]}> 
        <View style={styles.headerLeft}>
          <Logo size={36} />
          <Text style={styles.title}>TravelGuard AI</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: COLORS.teal }]}> 
            <Text style={styles.badgeText}>Live Monitoring</Text>
          </View>
          {highCrime && (
            <View style={[styles.alertPill, { backgroundColor: COLORS.danger }]}> 
              <Text style={styles.alertText}>High Crime Area</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/profile')} activeOpacity={0.9}>
        <View style={styles.digitalIdHeader}>
          <Logo size={30} />
          <View style={styles.digitalIdHeading}>
            <Text style={styles.cardTitle}>Digital ID</Text>
            <Text style={styles.digitalIdStatus}>{digitalId ? 'ACTIVE' : 'NOT REGISTERED'}</Text>
          </View>
        </View>
        {digitalId ? (
          <View style={styles.digitalIdBody}>
            {digitalId.profileImage ? (
              <Image source={{ uri: digitalId.profileImage }} style={styles.digitalIdImage} />
            ) : null}
            <View style={styles.digitalIdField}>
              <Text style={styles.digitalIdLabel}>ID NUMBER</Text>
              <Text style={styles.digitalIdValue}>{digitalId.digitalIdNumber}</Text>
            </View>
            <View style={styles.digitalIdField}>
              <Text style={styles.digitalIdLabel}>NAME</Text>
              <Text style={styles.digitalIdValue}>{digitalId.name}</Text>
            </View>
            <View style={styles.digitalIdField}>
              <Text style={styles.digitalIdLabel}>CONTACT</Text>
              <Text style={styles.digitalIdValue}>{digitalId.contactInfo}</Text>
            </View>
            <View style={styles.digitalIdField}>
              <Text style={styles.digitalIdLabel}>KYC</Text>
              <Text style={styles.digitalIdValue}>{digitalId.kyc?.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.digitalIdPrompt}>Create your Digital ID to keep emergency details ready.</Text>
        )}
        <Text style={styles.digitalIdAction}>{digitalId ? 'Open Digital ID' : 'Set up Digital ID'}  ›</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smart Area Alerts</Text>
        {alerts.map((a) => (
          <View key={a.id} style={styles.alertRow}>
            <View style={[styles.severity, { backgroundColor: a.severity === 'High' ? COLORS.danger : COLORS.teal }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{a.text}</Text>
              <Text style={styles.alertMeta}>{`${a.distance} km • Area Rating ${a.rating}/5`}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Panic Command</Text>
        <TextInput
          style={styles.queryInput}
          placeholder="Describe the emergency (optional)"
          value={panicQuery}
          onChangeText={setPanicQuery}
          placeholderTextColor="#8a9bb0"
        />
        <TouchableOpacity
          style={[styles.voiceButton, isListening ? styles.voiceButtonActive : null]}
          onPress={handleVoiceCommand}
          activeOpacity={0.85}
        >
          <Text style={styles.voiceButtonText}>{isListening ? 'Listening...' : 'Voice Command'}</Text>
        </TouchableOpacity>
        {!!transcript && <Text style={styles.transcriptText}>Heard: {transcript}</Text>}
      </View>

      <TouchableOpacity style={styles.sosContainer} onPress={() => handleSOS()} activeOpacity={0.9}>
        <View style={styles.sosPulse} />
        <View style={[styles.sosButton, sendingPanic ? styles.sosBusy : null]}>
          <Text style={styles.sosText}>{sendingPanic ? 'SENDING' : 'SOS'}</Text>
        </View>
      </TouchableOpacity>

      {(locLoading) && <LoadingSpinner />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 18, marginLeft: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  alertPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  alertText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  card: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  digitalIdHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  digitalIdHeading: { marginLeft: 10, flex: 1 },
  digitalIdStatus: { color: '#0a6f64', fontSize: 11, fontWeight: '800', marginTop: 2 },
  digitalIdBody: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e8eef3', paddingTop: 10 },
  digitalIdImage: { width: 48, height: 48, borderRadius: 24, marginRight: 10, borderWidth: 2, borderColor: '#39CCCC' },
  digitalIdField: { flex: 1 },
  digitalIdLabel: { color: '#718096', fontSize: 10, fontWeight: '800', marginBottom: 3 },
  digitalIdValue: { color: '#1f2937', fontWeight: '700' },
  digitalIdPrompt: { color: '#52616b', marginBottom: 10 },
  digitalIdAction: { color: '#001F3F', fontWeight: '800', marginTop: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f2f4' },
  severity: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  alertTitle: { fontWeight: '700' },
  alertMeta: { color: '#666', marginTop: 4 },
  queryInput: { borderWidth: 1, borderColor: '#dce4ee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  voiceButton: { marginTop: 10, backgroundColor: '#001F3F', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  voiceButtonActive: { backgroundColor: '#0a6f64' },
  voiceButtonText: { color: '#fff', fontWeight: '700' },
  transcriptText: { marginTop: 8, color: '#31445b', fontWeight: '600' },
  sosContainer: { position: 'absolute', alignSelf: 'center', bottom: 28, alignItems: 'center', justifyContent: 'center' },
  sosPulse: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(211,47,47,0.15)' },
  sosButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  sosBusy: { backgroundColor: '#8d1e1e' },
  sosText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 }
});
