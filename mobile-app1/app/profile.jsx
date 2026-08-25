import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import Logo from '../components/Logo';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
};

export default function ProfileScreen() {
  const { user, logout, hydrating } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'digitalid', 'photos'
  const [loading, setLoading] = useState(false);

  // Profile Arena State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    contact: '',
    altContact: '',
    gender: '',
    age: '',
    emailVerified: false,
    contactVerified: false,
  });
  const [emailOTP, setEmailOTP] = useState('');
  const [contactOTP, setContactOTP] = useState('');
  const [showEmailOTPSheet, setShowEmailOTPSheet] = useState(false);
  const [showContactOTPSheet, setShowContactOTPSheet] = useState(false);

  // Digital ID State
  const [digitalId, setDigitalId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [digitalIdForm, setDigitalIdForm] = useState({
    email: '',
    name: '',
    contactInfo: '',
    kyc: 'aadhaar',
    aadhaarNumber: '',
    passportCountry: '',
    passportNumber: '',
    emergencyContacts: [
      { name: '', email: '', contact: '', relation: '' },
      { name: '', email: '', contact: '', relation: '' },
    ],
  });

  // Panic Photos State
  const [panicPhotos, setPanicPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Fetch all profile details
  const fetchProfileData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // 1. Fetch Basic Profile
      try {
        const profRes = await api.get('/profile');
        if (profRes.data) {
          setProfileForm({
            name: profRes.data.name || '',
            email: profRes.data.email || user.email,
            contact: profRes.data.contact || '',
            altContact: profRes.data.altContact || '',
            gender: profRes.data.gender || '',
            age: profRes.data.age ? String(profRes.data.age) : '',
            emailVerified: profRes.data.emailVerified || false,
            contactVerified: profRes.data.contactVerified || false,
          });
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          // Profile not saved yet, populate email
          setProfileForm((prev) => ({ ...prev, email: user.email }));
        } else {
          console.warn('Error fetching basic profile:', err);
        }
      }

      // 2. Fetch Digital ID
      try {
        const idRes = await api.get('/digitalid/digital-id', {
          params: { email: user.email },
        });
        const idData = Array.isArray(idRes.data) ? idRes.data[0] : null;
        setDigitalId(idData);
        if (idData) {
          setDigitalIdForm({
            email: idData.email || user.email,
            name: idData.name || '',
            contactInfo: idData.contactInfo || '',
            kyc: idData.kyc || 'aadhaar',
            aadhaarNumber: idData.aadhaarNumber || '',
            passportCountry: idData.passportCountry || '',
            passportNumber: idData.passportNumber || '',
            emergencyContacts: idData.emergencyContacts?.length >= 2 
              ? idData.emergencyContacts 
              : [
                  { name: '', email: '', contact: '', relation: '' },
                  { name: '', email: '', contact: '', relation: '' },
                ],
          });
        } else {
          setDigitalIdForm((prev) => ({ ...prev, email: user.email }));
        }
      } catch (err) {
        console.warn('Error fetching Digital ID:', err);
      }

      // 3. Fetch Panic Photos
      try {
        const photoRes = await api.get('/digitalid/panic-photos', {
          params: { email: user.email },
        });
        setPanicPhotos(photoRes.data?.data || []);
      } catch (err) {
        console.warn('Error fetching panic photos:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (hydrating) return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.navy} />;
  if (!user) return <Redirect href="/login" />;

  // Basic Profile Actions
  const handleSendEmailOTP = async () => {
    if (!profileForm.email) return Alert.alert('Error', 'Please enter email address');
    try {
      setLoading(true);
      await api.post('/send-email-otp', { email: profileForm.email });
      setShowEmailOTPSheet(true);
      Alert.alert('OTP Sent', 'Email verification code logged in backend console / sent successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send email verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOTP) return Alert.alert('Error', 'Please enter the OTP');
    try {
      setLoading(true);
      await api.post('/verify-email-otp', { email: profileForm.email, otp: emailOTP });
      setProfileForm((prev) => ({ ...prev, emailVerified: true }));
      setShowEmailOTPSheet(false);
      setEmailOTP('');
      Alert.alert('Success', 'Email verified successfully!');
    } catch (err) {
      Alert.alert('Verification Failed', err?.response?.data?.error || 'Invalid email OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSendContactOTP = async () => {
    if (!profileForm.contact) return Alert.alert('Error', 'Please enter contact number');
    try {
      setLoading(true);
      await api.post('/send-contact-otp', { email: profileForm.email, contact: profileForm.contact });
      setShowContactOTPSheet(true);
      Alert.alert('OTP Sent', 'Contact verification code logged in backend console / sent successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send contact OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyContactOTP = async () => {
    if (!contactOTP) return Alert.alert('Error', 'Please enter the OTP');
    try {
      setLoading(true);
      await api.post('/verify-contact-otp', { 
        email: profileForm.email, 
        contact: profileForm.contact, 
        otp: contactOTP 
      });
      setProfileForm((prev) => ({ ...prev, contactVerified: true }));
      setShowContactOTPSheet(false);
      setContactOTP('');
      Alert.alert('Success', 'Contact verified successfully!');
    } catch (err) {
      Alert.alert('Verification Failed', err?.response?.data?.error || 'Invalid contact OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.emailVerified || !profileForm.contactVerified) {
      return Alert.alert('Validation Error', 'Please verify both Email and Contact number first');
    }
    const ageNum = Number(profileForm.age);
    if (!profileForm.name.trim()) return Alert.alert('Error', 'Name is required');
    if (isNaN(ageNum) || ageNum < 18) return Alert.alert('Error', 'Age must be 18 or above');

    try {
      setLoading(true);
      await api.post('/profile', {
        name: profileForm.name,
        contact: profileForm.contact,
        altContact: profileForm.altContact,
        gender: profileForm.gender,
        age: ageNum,
      });
      Alert.alert('Success', 'Profile saved successfully!');
      fetchProfileData();
    } catch (err) {
      Alert.alert('Save Failed', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Digital ID Actions
  const handleSaveDigitalId = async () => {
    // Validations
    if (!digitalIdForm.name.trim()) return Alert.alert('Error', 'Digital ID Name is required');
    if (!/^[A-Za-z\s]+$/.test(digitalIdForm.name)) return Alert.alert('Error', 'Name must contain only letters');
    if (!digitalIdForm.contactInfo.trim() || !/^\d+$/.test(digitalIdForm.contactInfo)) {
      return Alert.alert('Error', 'Contact info must be numeric');
    }

    if (digitalIdForm.kyc === 'aadhaar') {
      if (!/^\d{12}$/.test(digitalIdForm.aadhaarNumber)) {
        return Alert.alert('Error', 'Aadhaar must be a 12-digit number');
      }
    } else {
      if (!digitalIdForm.passportCountry.trim() || !/^[A-Za-z\s]+$/.test(digitalIdForm.passportCountry)) {
        return Alert.alert('Error', 'Passport Country must contain only letters');
      }
      if (!/^[A-Za-z0-9]+$/.test(digitalIdForm.passportNumber)) {
        return Alert.alert('Error', 'Passport number must be alphanumeric');
      }
    }

    // Emergency Contacts validation
    for (let i = 0; i < 2; i++) {
      const c = digitalIdForm.emergencyContacts[i];
      if (!c.name.trim() || !c.email.trim() || !c.contact.trim() || !c.relation.trim()) {
        return Alert.alert('Error', `Emergency Contact #${i + 1} details are incomplete`);
      }
      if (!/^[A-Za-z\s]+$/.test(c.name)) {
        return Alert.alert('Error', `Contact #${i + 1} Name must be letters only`);
      }
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(c.email)) {
        return Alert.alert('Error', `Contact #${i + 1} Email is invalid`);
      }
      if (!/^\d+$/.test(c.contact)) {
        return Alert.alert('Error', `Contact #${i + 1} Phone must be numeric`);
      }
      if (!/^[A-Za-z\s]+$/.test(c.relation)) {
        return Alert.alert('Error', `Contact #${i + 1} Relation must be letters only`);
      }
    }

    try {
      setLoading(true);
      
      // Request permissions & location coordinates to link to the ID
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lastKnownLocation = null;
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lastKnownLocation = {
          type: 'Point',
          coordinates: [pos.coords.longitude, pos.coords.latitude],
        };
      } else {
        return Alert.alert('Location Required', 'Please enable location permissions to register/update your Digital ID.');
      }

      const payload = {
        ...digitalIdForm,
        lastKnownLocation,
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
      };

      if (digitalId) {
        // Edit Mode
        const res = await api.put('/digitalid/digital-id', payload);
        Alert.alert('Success', 'Digital ID updated successfully!');
      } else {
        // Create Mode
        const res = await api.post('/digitalid/digital-id', payload);
        Alert.alert('Success', 'Digital ID created successfully!');
      }
      setEditMode(false);
      fetchProfileData();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save Digital ID');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardDigitalId = () => {
    Alert.alert(
      'Discard ID',
      'Are you sure you want to delete your Digital ID? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete('/digitalid/digital-id', { data: { email: user.email } });
              setDigitalId(null);
              setDigitalIdForm({
                email: user.email,
                name: '',
                contactInfo: '',
                kyc: 'aadhaar',
                aadhaarNumber: '',
                passportCountry: '',
                passportNumber: '',
                emergencyContacts: [
                  { name: '', email: '', contact: '', relation: '' },
                  { name: '', email: '', contact: '', relation: '' },
                ],
              });
              Alert.alert('Success', 'Digital ID deleted successfully');
              fetchProfileData();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || 'Failed to delete Digital ID');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={44} />
          <Text style={styles.title}>TravelGuard AI</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.navy} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { id: 'profile', label: 'Profile Arena', icon: 'person' },
          { id: 'digitalid', label: 'Digital ID', icon: 'card' },
          { id: 'photos', label: 'Panic Photos', icon: 'images' },
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

        {/* PROFILE ARENA TAB */}
        {activeTab === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Verification</Text>
            <Text style={styles.subtitle}>Verify details to unlock safety features.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Full Name"
                value={profileForm.name}
                onChangeText={(t) => setProfileForm((prev) => ({ ...prev, name: t }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputVerifyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Enter Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={profileForm.email}
                  editable={!profileForm.emailVerified}
                  onChangeText={(t) => setProfileForm((prev) => ({ ...prev, email: t }))}
                />
                {profileForm.emailVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                    <Text style={[styles.verifiedText, { color: COLORS.emerald }]}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleSendEmailOTP}>
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showEmailOTPSheet && (
              <View style={styles.otpCard}>
                <Text style={styles.otpTitle}>Enter Email OTP</Text>
                <View style={styles.inputVerifyRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Enter Code"
                    keyboardType="number-pad"
                    value={emailOTP}
                    onChangeText={setEmailOTP}
                  />
                  <TouchableOpacity style={styles.verifySubmitBtn} onPress={handleVerifyEmailOTP}>
                    <Text style={styles.verifySubmitBtnText}>Verify Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <View style={styles.inputVerifyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Enter Contact Number"
                  keyboardType="phone-pad"
                  value={profileForm.contact}
                  editable={!profileForm.contactVerified}
                  onChangeText={(t) => setProfileForm((prev) => ({ ...prev, contact: t }))}
                />
                {profileForm.contactVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                    <Text style={[styles.verifiedText, { color: COLORS.emerald }]}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleSendContactOTP}>
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showContactOTPSheet && (
              <View style={styles.otpCard}>
                <Text style={styles.otpTitle}>Enter Contact OTP</Text>
                <View style={styles.inputVerifyRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Enter Code"
                    keyboardType="number-pad"
                    value={contactOTP}
                    onChangeText={setContactOTP}
                  />
                  <TouchableOpacity style={styles.verifySubmitBtn} onPress={handleVerifyContactOTP}>
                    <Text style={styles.verifySubmitBtnText}>Verify Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Alternate Contact Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Alternate Contact"
                keyboardType="phone-pad"
                value={profileForm.altContact}
                onChangeText={(t) => setProfileForm((prev) => ({ ...prev, altContact: t }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      profileForm.gender === g ? styles.genderButtonActive : null,
                    ]}
                    onPress={() => setProfileForm((prev) => ({ ...prev, gender: g }))}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        profileForm.gender === g ? styles.genderTextActive : null,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age (Must be 18+)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Age"
                keyboardType="number-pad"
                value={profileForm.age}
                onChangeText={(t) => setProfileForm((prev) => ({ ...prev, age: t }))}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Profile Info</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DIGITAL ID TAB */}
        {activeTab === 'digitalid' && (
          <View>
            {/* Show badge if ID exists and NOT in edit mode */}
            {digitalId && !editMode ? (
              <View>
                {/* Visual Identity Badge Card */}
                <View style={styles.idCard}>
                  <View style={styles.idCardHeader}>
                    <Logo size={32} />
                    <View>
                      <Text style={styles.idCardHeaderTitle}>TRAVELGUARD SECURITY ID</Text>
                      <Text style={styles.idCardHeaderSub}>DEPT. OF DIGITAL SAFETY</Text>
                    </View>
                  </View>
                  <View style={styles.idCardDivider} />
                  
                  <View style={styles.idCardBody}>
                    <View style={styles.idCardFields}>
                      <Text style={styles.idCardLabel}>NAME</Text>
                      <Text style={styles.idCardValue}>{digitalId.name}</Text>

                      <Text style={styles.idCardLabel}>EMAIL</Text>
                      <Text style={styles.idCardValue}>{digitalId.email}</Text>

                      <Text style={styles.idCardLabel}>CONTACT</Text>
                      <Text style={styles.idCardValue}>{digitalId.contactInfo}</Text>

                      <Text style={styles.idCardLabel}>KYC RECORD ({digitalId.kyc?.toUpperCase()})</Text>
                      <Text style={styles.idCardValue}>
                        {digitalId.kyc === 'aadhaar'
                          ? `Aadhaar: XXXX-XXXX-${digitalId.aadhaarNumber?.slice(-4)}`
                          : `Passport (${digitalId.passportCountry}): ${digitalId.passportNumber}`}
                      </Text>
                    </View>
                    <View style={styles.idCardStatusContainer}>
                      <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>ACTIVE</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Emergency Contacts inside ID */}
                <View style={[styles.card, { marginTop: 12 }]}>
                  <Text style={styles.cardTitle}>Emergency Contacts</Text>
                  {digitalId.emergencyContacts?.map((c, i) => (
                    <View key={i} style={styles.contactItem}>
                      <Ionicons name="call" size={18} color={COLORS.teal} />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{c.name} ({c.relation})</Text>
                        <Text style={styles.contactPhone}>{c.contact} • {c.email}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.idActionRow}>
                    <TouchableOpacity style={styles.editIdBtn} onPress={() => setEditMode(true)}>
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.editIdText}>Edit Digital ID</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteIdBtn} onPress={handleDiscardDigitalId}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.deleteIdText}>Discard ID</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // ID Creation / Editing Form
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{digitalId ? 'Edit Digital ID' : 'Register Digital ID'}</Text>
                <Text style={styles.subtitle}>Setup secure identity credentials to link emergency alerts.</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>KYC Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="As shown in KYC documents"
                    value={digitalIdForm.name}
                    onChangeText={(t) => setDigitalIdForm((prev) => ({ ...prev, name: t }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>ID Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={digitalIdForm.contactInfo}
                    onChangeText={(t) => setDigitalIdForm((prev) => ({ ...prev, contactInfo: t }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Select KYC Verification Document</Text>
                  <View style={styles.kycSelectionRow}>
                    {['aadhaar', 'passport'].map((k) => (
                      <TouchableOpacity
                        key={k}
                        style={[
                          styles.kycButton,
                          digitalIdForm.kyc === k ? styles.kycButtonActive : null,
                        ]}
                        onPress={() => setDigitalIdForm((prev) => ({ ...prev, kyc: k }))}
                      >
                        <Text
                          style={[
                            styles.kycText,
                            digitalIdForm.kyc === k ? styles.kycTextActive : null,
                          ]}
                        >
                          {k.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {digitalIdForm.kyc === 'aadhaar' ? (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Aadhaar Number (12 Digits)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 12 digit Aadhaar"
                      keyboardType="number-pad"
                      maxLength={12}
                      value={digitalIdForm.aadhaarNumber}
                      onChangeText={(t) => setDigitalIdForm((prev) => ({ ...prev, aadhaarNumber: t }))}
                    />
                  </View>
                ) : (
                  <View>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Passport Country</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Country"
                        value={digitalIdForm.passportCountry}
                        onChangeText={(t) => setDigitalIdForm((prev) => ({ ...prev, passportCountry: t }))}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Passport Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Passport Number"
                        autoCapitalize="characters"
                        value={digitalIdForm.passportNumber}
                        onChangeText={(t) => setDigitalIdForm((prev) => ({ ...prev, passportNumber: t }))}
                      />
                    </View>
                  </View>
                )}

                {/* Emergency Contacts Sub-form */}
                <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Emergency Contacts (2 Required)</Text>
                {[0, 1].map((idx) => (
                  <View key={idx} style={styles.contactFormContainer}>
                    <Text style={styles.contactFormTitle}>Contact #{idx + 1}</Text>
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholder="Contact Name"
                      value={digitalIdForm.emergencyContacts[idx]?.name}
                      onChangeText={(t) => {
                        const updated = [...digitalIdForm.emergencyContacts];
                        updated[idx].name = t;
                        setDigitalIdForm((prev) => ({ ...prev, emergencyContacts: updated }));
                      }}
                    />
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholder="Email Address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={digitalIdForm.emergencyContacts[idx]?.email}
                      onChangeText={(t) => {
                        const updated = [...digitalIdForm.emergencyContacts];
                        updated[idx].email = t;
                        setDigitalIdForm((prev) => ({ ...prev, emergencyContacts: updated }));
                      }}
                    />
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholder="Phone Contact Number"
                      keyboardType="phone-pad"
                      value={digitalIdForm.emergencyContacts[idx]?.contact}
                      onChangeText={(t) => {
                        const updated = [...digitalIdForm.emergencyContacts];
                        updated[idx].contact = t;
                        setDigitalIdForm((prev) => ({ ...prev, emergencyContacts: updated }));
                      }}
                    />
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholder="Relation (e.g. Spouse, Father)"
                      value={digitalIdForm.emergencyContacts[idx]?.relation}
                      onChangeText={(t) => {
                        const updated = [...digitalIdForm.emergencyContacts];
                        updated[idx].relation = t;
                        setDigitalIdForm((prev) => ({ ...prev, emergencyContacts: updated }));
                      }}
                    />
                  </View>
                ))}

                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginRight: 8 }]} onPress={handleSaveDigitalId}>
                    <Text style={styles.saveBtnText}>Save Digital ID</Text>
                  </TouchableOpacity>
                  {digitalId && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* PANIC PHOTOS TAB */}
        {activeTab === 'photos' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Panic Photo Logs</Text>
            <Text style={styles.subtitle}>Evidence files captured modally during SOS events.</Text>

            {panicPhotos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="image-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No panic photos recorded yet.</Text>
              </View>
            ) : (
              panicPhotos.map((item) => (
                <View key={item._id} style={styles.photoRecordItem}>
                  <View style={styles.recordHeader}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                    <Text style={styles.recordDate}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.recordMeta}>ID: {item.panic_request_id}</Text>
                  
                  <View style={styles.photoGrid}>
                    {item.photo_urls?.map((url, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedPhoto(url)}>
                        <Image source={{ uri: url }} style={styles.gridImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal visible={!!selectedPhoto} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image source={{ uri: selectedPhoto }} style={styles.zoomedImage} resizeMode="contain" />
          )}
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: COLORS.navy, fontWeight: '700', fontSize: 13, marginLeft: 4 },
  
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
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  
  formGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    color: COLORS.text,
  },
  inputVerifyRow: { flexDirection: 'row', alignItems: 'center' },
  
  verifyBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, justifyContent: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#E8F5E9', borderRadius: 8 },
  verifiedText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  
  otpCard: {
    backgroundColor: '#FFFDE7',
    borderWidth: 1,
    borderColor: '#FFF59D',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  otpTitle: { fontSize: 13, fontWeight: '700', color: '#5D4037', marginBottom: 6 },
  verifySubmitBtn: { backgroundColor: COLORS.navy, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, justifyContent: 'center' },
  verifySubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  genderButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#FAFAFA' },
  genderButtonActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  genderText: { fontWeight: '700', color: COLORS.textLight, fontSize: 13 },
  genderTextActive: { color: '#fff' },
  
  saveBtn: { backgroundColor: COLORS.navy, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
  // Digital ID Badge
  idCard: {
    backgroundColor: '#002f5f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  idCardHeader: { flexDirection: 'row', alignItems: 'center' },
  idCardHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginLeft: 10, letterSpacing: 0.5 },
  idCardHeaderSub: { color: COLORS.teal, fontSize: 10, fontWeight: '700', marginLeft: 10 },
  idCardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  idCardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  idCardFields: { flex: 1 },
  idCardLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', marginTop: 6 },
  idCardValue: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2 },
  idCardStatusContainer: { justifyContent: 'flex-end', alignItems: 'flex-end' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,125,50,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald, marginRight: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  // Emergency Contacts info
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  contactInfo: { marginLeft: 12 },
  contactName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  contactPhone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  
  idActionRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  editIdBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.tealDark, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  editIdText: { color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 6 },
  deleteIdBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.danger, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteIdText: { color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 6 },
  
  // KYC form
  kycSelectionRow: { flexDirection: 'row', gap: 8 },
  kycButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#FAFAFA' },
  kycButtonActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  kycText: { fontWeight: '800', color: COLORS.textLight, fontSize: 13 },
  kycTextActive: { color: '#fff' },
  
  sectionHeading: { fontSize: 14, fontWeight: '800', color: COLORS.navy, marginVertical: 10 },
  contactFormContainer: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  contactFormTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textLight, marginBottom: 8 },
  
  actionRow: { flexDirection: 'row', marginTop: 12 },
  cancelBtn: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', marginTop: 12 },
  cancelBtnText: { color: COLORS.textLight, fontWeight: '700' },
  
  // Panic Photos
  emptyContainer: { alignItems: 'center', paddingVertical: 36 },
  emptyText: { color: COLORS.textLight, marginTop: 8, fontSize: 14, fontWeight: '700' },
  
  photoRecordItem: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 16 },
  recordHeader: { flexDirection: 'row', alignItems: 'center' },
  recordDate: { fontSize: 13, fontWeight: '800', color: COLORS.navy, marginLeft: 6 },
  recordMeta: { fontSize: 10, color: COLORS.textLight, marginTop: 2, marginBottom: 8 },
  photoGrid: { flexDirection: 'row', gap: 8 },
  gridImage: { width: (width - 64) / 3, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  
  // Zoom Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  zoomedImage: { width: '90%', height: '80%' },
});
