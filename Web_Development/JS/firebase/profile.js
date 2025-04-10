// profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyleQHWfKDxUmmduFYCXUpmSTkWlC-EgU",
  authDomain: "leap-authentication.firebaseapp.com",
  projectId: "leap-authentication",
  storageBucket: "leap-authentication.firebasestorage.app",
  messagingSenderId: "817139255207",
  appId: "1:817139255207:web:786c6d9a3d28e9411c9882"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, fetch their document from the "users" collection
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

	const usernameP = document.querySelector('#username');
	usernameP.innerText = '#' + userData.username;

	const emailInput = document.querySelector('#email');
	emailInput.value = userData.email;
	emailInput.setAttribute('disabled', true);

	const phoneInput = document.querySelector('#phone');
	phoneInput.value = userData.phone;
        phoneInput.setAttribute('disabled', 'true');
      } else {
//        console.log("No user data found!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // If no user is logged in, redirect to the login page (or index)
    window.location.href = "./index.html";
  }
});

