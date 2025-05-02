import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, ScrollView, Keyboard, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Mic, Send, User, Bot, MicOff, Volume2, Volume, VolumeX, ArrowUp, Sparkles, Save, Copy, X, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat } from 'react-native-reanimated';
import { Audio } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';

import AIService, { ChatMessage } from '../lib/AIService';
import UserProfileService from '../lib/UserProfileService';

// Types for chat messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAudioMessage?: boolean;
  isSpeaking?: boolean;
}

export default function AInutritionistScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  
  // Animation values
  const micScale = useSharedValue(1);
  const recordingAnimation = useSharedValue(0);
  
  // Animated styles
  const micButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: micScale.value }]
    };
  });
  
  const recordingIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: recordingAnimation.value,
      transform: [{ scale: 1 + recordingAnimation.value * 0.2 }]
    };
  });
  
  // Initialize chat with greeting
  useEffect(() => {
    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content: 'Здравствуйте! Я ваш персональный нутрициолог. Чем я могу вам помочь сегодня? Вы можете спросить меня о питании, диетах, выборе продуктов или составить план питания.'
        }
      ]);
    }, 500);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Load chat history and user profile
  useEffect(() => {
    loadChatHistory();
    loadUserProfile();
  }, []);
  
  // Load chat history
  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('nutritionist_chat_history');
      if (history) {
        setMessages(JSON.parse(history));
      } else {
        // If history is empty, add a welcome message
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: 'Здравствуйте! Я ваш персональный нутрициолог. Чем я могу вам помочь сегодня? Вы можете спросить меня о питании, диетах, выборе продуктов или составить план питания.'
        };
        setMessages([welcomeMessage]);
        
        // Save welcome message
        await AsyncStorage.setItem('nutritionist_chat_history', JSON.stringify([welcomeMessage]));
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error);
    }
  };
  
  // Load user profile
  const loadUserProfile = async () => {
    try {
      const profile = await UserProfileService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Ошибка загрузки профиля пользователя:', error);
    }
  };
  
  // Simulate starting voice recording
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Доступ к микрофону не предоставлен');
        return;
      }
      
      // Set up audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Start recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка начала записи:', error);
      Alert.alert('Ошибка', 'Не удалось начать запись');
    }
  };
  
  // Simulate stopping voice recording
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (!uri) {
        throw new Error('URI записи не найден');
      }
      
      // Read file and encode to base64
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      setIsLoading(true);
      
      // Send audio for recognition
      const text = await AIService.processVoiceMessage(fileBase64);
      
      // Set recognized text in input field
      setInputText(text);
      
      // If text is successfully recognized, send message
      if (text.trim()) {
        const userMessage: ChatMessage = {
          role: 'user',
          content: text
        };
        
        // Add user message
        setMessages(prev => [...prev, userMessage]);
        
        // Get response from AI
        const response = await AIService.getNutritionAdvice(text, userProfile);
        
        // Add AI response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Ошибка остановки записи:', error);
      Alert.alert('Ошибка', 'Не удалось обработать голосовое сообщение');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send message
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText
    };
    
    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Get response from AI
      const response = await AIService.getNutritionAdvice(userMessage.content, userProfile);
      
      // Add AI response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      Alert.alert('Ошибка', error.message || 'Не удалось получить ответ от нутрициолога');
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle text-to-speech for AI message
  const toggleSpeech = (message: ChatMessage) => {
    if (message.role !== 'assistant') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If already speaking this message, stop it
    if (speakingMessageId === message.id) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    
    // If speaking another message, stop it first
    if (isSpeaking) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      
      // Small delay before starting new speech
      setTimeout(() => {
        setIsSpeaking(true);
        setSpeakingMessageId(message.id);
      }, 300);
    } else {
      // Start speaking this message
      setIsSpeaking(true);
      setSpeakingMessageId(message.id);
    }
    
    // In a real app, use text-to-speech here
  };
  
  // Render individual message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAI = item.role === 'assistant';
    const isCurrentlySpeaking = item.id === speakingMessageId;
    
    return (
      <View style={[
        styles.messageContainer,
        isAI ? styles.aiMessageContainer : styles.userMessageContainer
      ]}>
        <View style={styles.messageHeader}>
          <View style={[
            styles.avatarContainer,
            isAI 
              ? { backgroundColor: `${theme.colors.primary}20` } 
              : { backgroundColor: `${theme.colors.secondary}20` }
          ]}>
            {isAI 
              ? <Bot size={16} color={theme.colors.primary} /> 
              : <User size={16} color={theme.colors.secondary} />
            }
          </View>
          
          <Text style={[
            styles.senderName,
            { color: theme.colors.textSecondary }
          ]}>
            {isAI ? 'AI Нутрициолог' : 'Вы'}
          </Text>
          
          <Text style={[
            styles.messageTime,
            { color: theme.colors.textSecondary }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
          
          {isAI && (
            <TouchableOpacity 
              style={styles.speakButton}
              onPress={() => toggleSpeech(item)}
            >
              {isCurrentlySpeaking 
                ? <Volume2 size={16} color={theme.colors.primary} /> 
                : <Volume size={16} color={theme.colors.textSecondary} />
              }
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[
          styles.messageBubble,
          isAI 
            ? [styles.aiMessageBubble, { backgroundColor: theme.colors.card }] 
            : [styles.userMessageBubble, { backgroundColor: theme.colors.primary }]
        ]}>
          <Text style={[
            styles.messageText,
            isAI 
              ? { color: theme.colors.text } 
              : { color: '#FFFFFF' }
          ]}>
            {item.content}
          </Text>
        </View>
        
        {isAI && (
          <View style={styles.messageActions}>
            <TouchableOpacity 
              style={styles.messageActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // In a real app, copy text to clipboard
                alert('Текст скопирован');
              }}
            >
              <Copy size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.messageActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // In a real app, save to favorites/notes
                alert('Сохранено в избранное');
              }}
            >
              <Save size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          AI-Нутрициолог
        </Text>
        
        <View style={styles.spacer} />
      </View>
      
      <View style={[styles.content, { backgroundColor: isRecording ? `${theme.colors.primary}10` : 'transparent' }]}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles size={48} color={`${theme.colors.primary}50`} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              AI-нутрициолог
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Задайте вопрос о питании или запросите персональный план питания
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: `${theme.colors.card}90` }]}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              AI обрабатывает ваш вопрос...
            </Text>
          </View>
        )}
        
        {isRecording && (
          <Animated.View style={[styles.recordingIndicator, recordingIndicatorStyle]}>
            <View style={[styles.recordingInner, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Text style={[styles.recordingText, { color: theme.colors.primary }]}>
                Говорите...
              </Text>
              <TouchableOpacity
                style={styles.cancelRecordingButton}
                onPress={() => stopRecording()}
              >
                <X size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
        style={styles.inputContainer}
      >
        <View style={[styles.inputWrapper, { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Введите вопрос о питании..."
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            blurOnSubmit={true}
          />
          
          {inputText.length > 0 ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => sendMessage()}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <Animated.View style={micButtonStyle}>
              <TouchableOpacity
                style={[styles.micButton, { 
                  backgroundColor: isRecording ? theme.colors.danger : theme.colors.primary 
                }]}
                onPress={isRecording ? () => stopRecording() : startRecording}
              >
                {isRecording ? (
                  <MicOff size={20} color="#FFFFFF" />
                ) : (
                  <Mic size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.suggestionContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionScroll}
          >
            <TouchableOpacity
              style={[styles.suggestionButton, { backgroundColor: `${theme.colors.primary}15` }]}
              onPress={() => {
                setInputText('Как рассчитать дневную норму калорий?');
                inputRef.current?.focus();
              }}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                Расчет калорий
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.suggestionButton, { backgroundColor: `${theme.colors.primary}15` }]}
              onPress={() => {
                setInputText('Составь план питания на неделю для похудения');
                inputRef.current?.focus();
              }}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                План питания
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.suggestionButton, { backgroundColor: `${theme.colors.primary}15` }]}
              onPress={() => {
                setInputText('Сколько белка мне нужно в день?');
                inputRef.current?.focus();
              }}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                Норма белка
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.suggestionButton, { backgroundColor: `${theme.colors.primary}15` }]}
              onPress={() => {
                setInputText('Какие продукты богаты витамином D?');
                inputRef.current?.focus();
              }}
            >
              <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                Источники витамина D
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  spacer: {
    width: 50,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 40,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '100%',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  senderName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginRight: 8,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  speakButton: {
    padding: 4,
    marginLeft: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 14,
  },
  aiMessageBubble: {
    borderTopLeftRadius: 4,
  },
  userMessageBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  messageActionButton: {
    padding: 4,
    marginRight: 12,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 12,
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  recordingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  recordingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  cancelRecordingButton: {
    marginLeft: 12,
    padding: 4,
  },
  suggestionContainer: {
    marginTop: 8,
  },
  suggestionScroll: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  suggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
}); 