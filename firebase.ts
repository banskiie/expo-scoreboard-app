import { initializeApp } from "firebase/app"
import { getReactNativePersistence, initializeAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"

const firebaseConfig = {
  apiKey: "AIzaSyDCUO0BoI7ORkFgWJeVxc84m5FypaxwM1M",
  authDomain: "cone-badminton.firebaseapp.com",
  projectId: "cone-badminton",
  storageBucket: "cone-badminton.appspot.com",
  messagingSenderId: "662407519313",
  appId: "1:662407519313:web:da32de26c0e4b90878ac70",
}

export const FIREBASE_APP = initializeApp(firebaseConfig)
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
})
export const FIRESTORE_DB = getFirestore(FIREBASE_APP)
