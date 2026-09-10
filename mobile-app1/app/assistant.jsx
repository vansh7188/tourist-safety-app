import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

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

const COLORS = { navy: '#001F3F', teal: '#39CCCC', bg: '#F4F6F6' };

function Bubble({ text, fromUser }) {
  return (
    <View style={[styles.bubble, fromUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={fromUser ? styles.userText : styles.aiText}>{text}</Text>
    </View>
  );
}

export default function AssistantScreen() {
  const { user, hydrating } = useAuth();
  const [messages, setMessages] = useState([
    { id: 'm1', text: 'Hello! I am your Safety Assistant. Ask me anything about travel safety.', fromUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState('');
  const listRef = useRef(null);

  if (hydrating) return <LoadingSpinner />;
  if (!user) return <Redirect href="/login" />;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = { id: Date.now().toString(), text: input.trim(), fromUser: true };
    setMessages((m) => [...m, msg]);
    setInput('');

    try {
      const res = await api.post('/chat', { message: msg.text, location: null });
      const reply = res?.data?.reply || 'Sorry, I could not find an answer.';
      setMessages((m) => [...m, { id: Date.now()+1, text: reply, fromUser: false }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err) {
      const serverMessage = err?.response?.data?.error || 'Error connecting to assistant.';
      setMessages((m) => [...m, { id: Date.now()+2, text: serverMessage, fromUser: false }]);
    }
  };

  const handleVoiceInput = async () => {
    if (!ExpoSpeechRecognitionModule?.isRecognitionAvailable) return;

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return;

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

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setVoiceDraft('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const spoken = event.results[0]?.transcript || '';
    if (!spoken) return;
    setVoiceDraft(spoken);
    setInput(spoken);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  useEffect(() => {
    return () => {
      if (ExpoSpeechRecognitionModule?.isRecognitionAvailable) {
        void ExpoSpeechRecognitionModule.stop();
      }
    };
  }, []);

  const voiceAvailable = ExpoSpeechRecognitionModule?.isRecognitionAvailable;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { backgroundColor: COLORS.navy }]}>
        <Logo size={36} />
        <Text style={styles.headerTitle}>Safety Assistant</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Bubble text={item.text} fromUser={item.fromUser} />}
      />

      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask the assistant..." />
        {voiceAvailable ? (
          <TouchableOpacity style={[styles.mic, isListening ? styles.micActive : null]} onPress={handleVoiceInput}>
            <Text style={styles.micText}>{isListening ? '...' : 'Mic'}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.send} onPress={sendMessage}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
      </View>
      {!!voiceDraft && <Text style={styles.voiceDraft}>Heard: {voiceDraft}</Text>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', marginLeft: 12, fontWeight: '800', fontSize: 18 },
  list: { padding: 12, paddingBottom: 100 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginVertical: 6 },
  userBubble: { backgroundColor: COLORS.navy, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e8eef6' },
  userText: { color: '#fff' },
  aiText: { color: '#111' },
  inputRow: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, borderWidth: 1, borderColor: '#e8eef6' },
  mic: { backgroundColor: '#001F3F', width: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  micActive: { backgroundColor: '#0a6f64' },
  micText: { color: '#fff', fontWeight: '700' },
  send: { backgroundColor: COLORS.teal, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
  voiceDraft: { position: 'absolute', bottom: 66, left: 14, right: 14, color: '#31445b', fontWeight: '600' }
});
