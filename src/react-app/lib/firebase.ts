import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyA69aIk5OJGKVCbWlsGqT7WWsRtKXDm-OM",
  authDomain: "halpro-dev.firebaseapp.com",
  projectId: "halpro-dev",
  storageBucket: "halpro-dev.firebasestorage.app",
  messagingSenderId: "262185704450",
  appId: "1:262185704450:web:48b66d5685fdaf617e5b1b",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Connect to emulator only in development mode and when running locally
if (import.meta.env.DEV && window.location.hostname === "localhost") {
  console.log("Connecting to emulator");
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
}

export { app as firebase, firestore };
