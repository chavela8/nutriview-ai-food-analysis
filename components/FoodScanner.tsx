import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera as CameraIcon, Image as ImageIcon, X, Check } from 'lucide-react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

import FoodRecognitionService from '../lib/FoodRecognitionService';
import FoodDatabaseAPI
