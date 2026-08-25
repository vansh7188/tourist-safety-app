import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import Logo from '../components/Logo';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { io } from 'socket.io-client';
import { AUTH_BASE_URL } from '../config';

const { width } = Dimensions.get('window');
const COLORS = {
  navy: '#001F3F',
  teal: '#39CCCC',
  tealDark: '#0a6f64',
  bg: '#F4F6F6',
  danger: '#D32F2F',
  emerald: '#2E7D32',
  text: '#334155',
  textLight: '#64748B',
  border: '#E2E8F0',
  rose: '#FFE4E6',
  roseDark: '#9F1239',
  sky: '#E0F2FE',
  skyDark: '#0369A1',
  amber: '#FEF3C7',
  amberDark: '#92400E',
};

export default function EmergencyScreen() {
  const { user, hydrating } = useAuth();
  
  const [activeTab, setActiveTab] = useState('post'); // 'post', 'sent', 'received'
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Post Emergency State
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);

  // Sent Requests State
  const [sentPosts, setSentPosts] = useState([]);
  const [sentLoading, setSentLoading] = useState(false);

  // Received Alerts State
  const [receivedAlerts, setReceivedAlerts] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(false);

  // Chat State
  const [chatPost, setChatPost] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [acceptedPostIds, setAcceptedPostIds] = useState([]);

  const socketRef = useRef(null);

  // Setup Sockets
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await api.defaults.headers.common['Authorization']?.replace('Bearer ', '') || '';
        if (!token) return;

        const connection = io(AUTH_BASE_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });

        connection.on('connect', () => {
          console.log('Socket connected successfully');
          connection.emit('presence:register');
        });

        connection.on('emergency:new', (alert) => {
          console.log('Received nearby emergency via socket:', alert);
          setReceivedAlerts((current) => {
            const exists = current.some((item) => item._id === alert.postId);
            if (exists) return current;
            return [
              {
                _id: alert.postId,
                userId: { name: alert.requesterName },
                text: alert.textSnippet,
                mediaUrls: alert.mediaThumbnail ? [alert.mediaThumbnail] : [],
                distanceMeters: alert.distanceMeters,
                status: 'open',
              },
              ...current,
            ];
          });
        });

        connection.on('emergency:resolved', ({ postId }) => {
          console.log('Received resolved emergency via socket:', postId);
          setReceivedAlerts((current) => current.filter((item) => item._id !== postId));
        });

        setSocket(connection);
        socketRef.current = connection;
      } catch (err) {
        console.warn('Socket connection configuration failed:', err);
      }
    };

    if (user) {
      setupSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Fetch Sent Requests
  const fetchSentRequests = useCallback(async () => {
    setSentLoading(true);
    try {
      const res = await api.get('/emergency/mine');
      setSentPosts(res.data?.posts || []);
    } catch (err) {
      console.warn('Failed to load sent requests:', err);
    } finally {
      setSentLoading(false);
    }
  }, []);

  // Fetch Received Alerts
  const fetchReceivedAlerts = useCallback(async () => {
    setReceivedLoading(true);
    try {
      const res = await api.get('/emergency/received');
      setReceivedAlerts(res.data?.posts || []);
    } catch (err) {
      console.warn('Failed to load received alerts:', err);
    } finally {
      setReceivedLoading(false);
    }
  }, []);

  // Load active tab data
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'sent') fetchSentRequests();
    if (activeTab === 'received') fetchReceivedAlerts();
  }, [activeTab, user, fetchSentRequests, fetchReceivedAlerts]);

  if (hydrating) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.navy} />;
  if (!user) return <Redirect href="/login" />;

  // Image Picker Logic
  const handlePickMedia = async (useCamera = false) => {
    if (mediaFiles.length >= 4) {
      return Alert.alert('Limit Reached', 'You can upload up to 4 media files.');
    }

    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return Alert.alert('Permission Denied', `Permission to access ${useCamera ? 'camera' : 'gallery'} is required.`);
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.7,
          allowsMultipleSelection: true,
          selectionLimit: 4 - mediaFiles.length,
        });

    if (!result.canceled && result.assets?.length) {
      setMediaFiles((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Emergency Logic
  const handlePostEmergency = async () => {
    if (!text.trim() && mediaFiles.length === 0) {
      return Alert.alert('Validation Error', 'Please describe the emergency or attach media.');
    }

    try {
      setLoading(true);
      
      // 1. Get Location coordinates
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Location Required', 'Location permission is required to post emergencies.');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 2. Prepare Form Data
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('lat', String(pos.coords.latitude));
      formData.append('lng', String(pos.coords.longitude));
      
      mediaFiles.forEach((file, index) => {
        const uriParts = file.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        formData.append('media', {
          uri: file.uri,
          name: `media-${index}.${fileExtension}`,
          type: file.mimeType || (fileExtension === 'mp4' ? 'video/mp4' : 'image/jpeg'),
        });
      });

      // 3. Post to API
      await api.post('/emergency', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Emergency Posted', 'Request sent to nearby helpers.');
      setText('');
      setMediaFiles([]);
      setActiveTab('sent'); // Switch to sent requests tab
    } catch (err) {
      Alert.alert('Post Failed', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept Emergency Logic
  const handleAcceptEmergency = async (post) => {
    try {
      setLoading(true);
      const res = await api.patch(`/emergency/${post._id}/accept`);
      setAcceptedPostIds((current) => [...current, post._id]);
      
      // Setup room structure for chat
      const roomId = res.data?.roomId || `emergency:${post._id}`;
      setChatPost({
        _id: post._id,
        text: post.text,
        roomId,
      });
      openChatConnection(post._id);
    } catch (err) {
      Alert.alert('Accept Failed', err?.response?.data?.error || 'Unable to accept request.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve Emergency Logic
  const handleResolveEmergency = async (postId) => {
    Alert.alert(
      'Resolve Emergency',
      'Are you sure you want to mark this emergency as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              setLoading(true);
              await api.patch(`/emergency/${postId}/resolve`);
              fetchSentRequests();
            } catch (err) {
              Alert.alert('Resolve Failed', err?.response?.data?.error || 'Failed to resolve emergency.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Chat Connection/Socket logic
  const openChatConnection = async (postId) => {
    setChatLoading(true);
    setChatError('');
    setChatMessages([]);

    try {
      // 1. Fetch message history
      const res = await api.get(`/emergency/${postId}/messages`);
      setMessagesInChat(res.data?.messages || []);

      // 2. Emit Join Room
      if (socketRef.current) {
        socketRef.current.emit('emergency:join', { postId });
      }
    } catch (err) {
      setChatError('Failed to load message history.');
    } finally {
      setChatLoading(false);
    }
  };

  const setMessagesInChat = (msgs) => {
    setChatMessages(msgs);
  };

  // Socket chat messaging listener
  useEffect(() => {
    if (!socket || !chatPost) return;

    const handleNewChatMessage = (message) => {
      if (String(message.postId) === String(chatPost._id)) {
        setChatMessages((current) => [...current, message]);
      }
    };

    socket.on('chat:message', handleNewChatMessage);
    return () => {
      socket.off('chat:message', handleNewChatMessage);
    };
  }, [socket, chatPost]);

  const handleSendChatMessage = () => {
    if (!chatText.trim() || !socket || !chatPost) return;
    socket.emit('chat:message', { postId: chatPost._id, text: chatText.trim() });
    setChatText('');
  };

  const handleCloseChat = () => {
    setChatPost(null);
    setChatMessages([]);
    setChatText('');
    setChatError('');
  };

  const isMyMessage = (msg) => {
    if (!msg?.senderId) return false;
    return msg.senderId.email === user.email;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={44} />
          <Text style={styles.title}>TravelGuard AI</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SOS Network</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { id: 'post', label: 'Raise Alert', icon: 'alert-circle' },
          { id: 'sent', label: 'My Requests', icon: 'navigate' },
          { id: 'received', label: 'Nearby Alerts', icon: 'people' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id ? styles.tabButtonActive : null]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#fff' : COLORS.textLight}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id ? styles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && <ActivityIndicator size="large" color={COLORS.navy} style={{ marginVertical: 12 }} />}

        {/* Tab 1: Raise Alert */}
        {activeTab === 'post' && (
          <View style={[styles.card, { borderColor: COLORS.rose }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: COLORS.roseDark }]}>Emergency Helper</Text>
                <Text style={styles.subtitle}>Reach nearby people who are online and ready to help.</Text>
              </View>
              <View style={styles.networkBadge}>
                <Text style={styles.networkBadgeText}>SOS NETWORK</Text>
              </View>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="What help do you need?"
              multiline={true}
              numberOfLines={4}
              maxLength={2000}
              value={text}
              onChangeText={setText}
            />

            {/* Media selection section */}
            <View style={styles.mediaGridContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {mediaFiles.map((file, i) => (
                  <View key={i} style={styles.mediaItem}>
                    <Image source={{ uri: file.uri }} style={styles.mediaThumbnail} />
                    <TouchableOpacity style={styles.removeMediaBtn} onPress={() => handleRemoveMedia(i)}>
                      <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.mediaPickerRow}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => handlePickMedia(true)}>
                  <Ionicons name="camera" size={20} color={COLORS.navy} />
                  <Text style={styles.pickerBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => handlePickMedia(false)}>
                  <Ionicons name="images" size={20} color={COLORS.navy} />
                  <Text style={styles.pickerBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.postBtn, (!text.trim() && mediaFiles.length === 0) ? styles.postBtnDisabled : null]}
                onPress={handlePostEmergency}
                disabled={!text.trim() && mediaFiles.length === 0}
              >
                <Text style={styles.postBtnText}>Post Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 2: My Requests */}
        {activeTab === 'sent' && (
          <View>
            {sentLoading && <ActivityIndicator size="small" color={COLORS.navy} />}
            {sentPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="navigate-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>You haven't posted any emergency requests yet.</Text>
              </View>
            ) : (
              sentPosts.map((post) => (
                <View key={post._id} style={[styles.card, { borderColor: COLORS.sky }]}>
                  <View style={styles.recordHeader}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                    <Text style={[styles.recordDate, { color: COLORS.skyDark }]}>
                      {new Date(post.createdAt).toLocaleString()}
                    </Text>
                    <View style={[styles.statusBadge, post.status === 'resolved' ? styles.statusBadgeResolved : styles.statusBadgeOpen]}>
                      <Text style={styles.statusBadgeText}>{post.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.postText}>{post.text}</Text>

                  {post.mediaUrls?.length > 0 && (
                    <View style={styles.rowGrid}>
                      {post.mediaUrls.map((url, idx) => (
                        <Image key={idx} source={{ uri: url }} style={styles.gridImage} />
                      ))}
                    </View>
                  )}

                  {/* Responders Accepted Info */}
                  <View style={styles.respondersContainer}>
                    <Text style={styles.respondersTitle}>Responders: {post.respondersAccepted?.length || 0}</Text>
                    {post.respondersAccepted?.map((res, i) => (
                      <Text key={i} style={styles.responderRow}>
                        • {res.name} ({res.contact})
                      </Text>
                    ))}
                  </View>

                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={styles.chatActionBtn}
                      onPress={() => {
                        setChatPost({
                          _id: post._id,
                          text: post.text,
                          roomId: `emergency:${post._id}`,
                        });
                        openChatConnection(post._id);
                      }}
                    >
                      <Ionicons name="chatbubbles-outline" size={16} color="#fff" />
                      <Text style={styles.chatActionBtnText}>Open Coordinator Chat</Text>
                    </TouchableOpacity>
                    {post.status !== 'resolved' && (
                      <TouchableOpacity style={styles.resolveActionBtn} onPress={() => handleResolveEmergency(post._id)}>
                        <Text style={styles.resolveActionBtnText}>Resolve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 3: Received Nearby Alerts */}
        {activeTab === 'received' && (
          <View>
            {receivedLoading && <ActivityIndicator size="small" color={COLORS.navy} />}
            {receivedAlerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No emergency requests nearby right now.</Text>
              </View>
            ) : (
              receivedAlerts.map((post) => {
                const isAccepted = Boolean(post.acceptedByMe) || acceptedPostIds.includes(post._id);
                return (
                  <View key={post._id} style={[styles.card, { borderColor: COLORS.amber }]}>
                    <View style={styles.recordHeader}>
                      <Ionicons name="warning" size={18} color="#D97706" />
                      <Text style={[styles.recordDate, { color: COLORS.amberDark }]}>
                        {post.userId?.name || 'A traveler'} needs help
                      </Text>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>
                          {typeof post.distanceMeters === 'number'
                            ? `${(post.distanceMeters / 1000).toFixed(1)} km away`
                            : 'NEARBY'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postText}>{post.text}</Text>

                    {post.mediaUrls?.length > 0 && (
                      <View style={styles.rowGrid}>
                        {post.mediaUrls.map((url, idx) => (
                          <Image key={idx} source={{ uri: url }} style={styles.gridImage} />
                        ))}
                      </View>
                    )}

                    {isAccepted ? (
                      <TouchableOpacity
                        style={[styles.postBtn, { backgroundColor: COLORS.emerald, width: '100%', marginTop: 12 }]}
                        onPress={() => {
                          setChatPost({
                            _id: post._id,
                            text: post.text,
                            roomId: `emergency:${post._id}`,
                          });
                          openChatConnection(post._id);
                        }}
                      >
                        <Ionicons name="chatbubbles" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.postBtnText}>Accepted | Open Chat</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.postBtn, { backgroundColor: '#D97706', width: '100%', marginTop: 12 }]}
                        onPress={() => handleAcceptEmergency(post)}
                      >
                        <Text style={styles.postBtnText}>Accept and Help</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Real-time Chat Overlay Modal */}
      <Modal visible={!!chatPost} transparent={true} animationType="slide">
        <View style={styles.chatModalBg}>
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <View>
                <Text style={styles.chatHeaderTitle}>SOS Coordinator Chat</Text>
                <Text style={styles.chatHeaderSnippet} numberOfLines={1}>
                  {chatPost?.text || 'Connecting...'}
                </Text>
              </View>
              <TouchableOpacity style={styles.chatCloseBtn} onPress={handleCloseChat}>
                <Ionicons name="close-circle" size={32} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.chatBody}>
              {chatLoading && <ActivityIndicator size="small" color={COLORS.navy} />}
              {chatError && <Text style={styles.chatErrorText}>{chatError}</Text>}
              
              <FlatList
                data={chatMessages}
                keyExtractor={(item) => item._id || `${item.createdAt}-${item.text}`}
                renderItem={({ item }) => {
                  const mine = isMyMessage(item);
                  return (
                    <View style={[styles.bubbleWrapper, mine ? styles.bubbleWrapperMine : styles.bubbleWrapperOther]}>
                      <View style={[styles.chatBubble, mine ? styles.chatBubbleMine : styles.chatBubbleOther]}>
                        {!mine && item.senderId?.name && (
                          <Text style={styles.bubbleSenderName}>{item.senderId.name}</Text>
                        )}
                        <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}>{item.text}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            </View>

            <View style={styles.chatFooter}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                value={chatText}
                onChangeText={chatText => setChatText(chatText)}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !chatText.trim() ? styles.chatSendBtnDisabled : null]}
                onPress={handleSendChatMessage}
                disabled={!chatText.trim()}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { color: COLORS.navy, fontWeight: '900', fontSize: 20, marginLeft: 10 },
  badge: { backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-between',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
  },
  tabButtonActive: {
    backgroundColor: COLORS.navy,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    marginLeft: 6,
  },
  tabLabelActive: {
    color: '#fff',
  },
  
  scrollContent: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  subtitle: { fontSize: 11, color: COLORS.textLight, maxWidth: width * 0.6 },
  
  networkBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  networkBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    color: COLORS.text,
    height: 100,
    textAlignVertical: 'top',
  },
  
  mediaGridContainer: { marginVertical: 12 },
  mediaItem: { position: 'relative', marginRight: 10 },
  mediaThumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  removeMediaBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },
  
  mediaPickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  pickerBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.navy, marginLeft: 6 },
  
  postBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.danger, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyText: { color: COLORS.textLight, marginTop: 10, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  
  recordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  recordDate: { fontSize: 13, fontWeight: '800', marginLeft: 6, flex: 1 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeOpen: { backgroundColor: '#FEF3C7' },
  statusBadgeResolved: { backgroundColor: '#DCFCE7' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.text },
  
  postText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  
  rowGrid: { flexDirection: 'row', gap: 6, marginTop: 10 },
  gridImage: { width: (width - 64) / 4, height: 60, borderRadius: 6, backgroundColor: '#eee' },
  
  respondersContainer: { padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, marginVertical: 10 },
  respondersTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textLight, marginBottom: 4 },
  responderRow: { fontSize: 11, color: COLORS.text, marginVertical: 2 },
  
  actionBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chatActionBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.navy, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chatActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 12, marginLeft: 6 },
  resolveActionBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  resolveActionBtnText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  
  distanceBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  distanceBadgeText: { color: '#92400E', fontSize: 10, fontWeight: '800' },
  
  // Chat Modal
  chatModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { height: '85%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContents: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatHeaderTitle: { fontSize: 16, fontWeight: '900', color: COLORS.navy },
  chatHeaderSnippet: { fontSize: 11, color: COLORS.textLight, marginTop: 2, maxWidth: width * 0.7 },
  chatCloseBtn: { marginLeft: 'auto' },
  
  chatBody: { flex: 1, padding: 12, backgroundColor: COLORS.bg },
  chatErrorText: { color: COLORS.danger, fontWeight: '600', fontSize: 12, textAlign: 'center', marginVertical: 6 },
  
  bubbleWrapper: { width: '100%', flexDirection: 'row', marginVertical: 4 },
  bubbleWrapperMine: { justifyContent: 'flex-end' },
  bubbleWrapperOther: { justifyContent: 'flex-start' },
  
  chatBubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16 },
  chatBubbleMine: { backgroundColor: COLORS.emerald, borderBottomRightRadius: 2 },
  chatBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: COLORS.border },
  
  bubbleSenderName: { fontSize: 10, fontWeight: '800', color: COLORS.skyDark, marginBottom: 2 },
  bubbleTextMine: { color: '#fff', fontSize: 13, lineHeight: 18 },
  bubbleTextOther: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  
  chatFooter: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff', alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, fontSize: 14, backgroundColor: '#FAFAFA' },
  chatSendBtn: { backgroundColor: COLORS.emerald, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chatSendBtnDisabled: { opacity: 0.5 },
});
