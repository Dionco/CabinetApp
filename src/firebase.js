// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpwnh8-b1ymMAKGt9hN9UXPvKO2w4akcU",
  authDomain: "student-house-finance.firebaseapp.com",
  projectId: "student-house-finance",
  storageBucket: "student-house-finance.firebasestorage.app",
  messagingSenderId: "220363199264",
  appId: "1:220363199264:web:ba6d8090ce0fc1f0b5bd45",
  measurementId: "G-YZ0RW97G5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Commented out as it's not used
const db = getFirestore(app);


export { db };
