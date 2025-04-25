
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { appId, apiKey, measurementId, messagingSenderId } from "../env.js";
const uid = localStorage.getItem("uid");

if (uid) {
   window.location.href =  '/pages/index.html'
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "my-todo-list-dd0a0.firebaseapp.com",
  projectId: "my-todo-list-dd0a0",
  storageBucket: "my-todo-list-dd0a0.firebasestorage.app",
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const submitBtn = document.getElementById('submit');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    emailError.innerText = "Please enter a valid email.";
    emailError.classList.add("active");
    isValid = false;
  } else {
    emailError.innerText = "";
    emailError.classList.remove("active");
  }

  if (password.length < 8) {
    passwordError.innerText = "Password must be at least 8 characters.";
    passwordError.classList.add("active");
    isValid = false;
  } else {
    passwordError.innerText = "";
    passwordError.classList.remove("active");
  }

  submitBtn.disabled = !isValid;
}

emailInput.addEventListener("input", validateForm);
passwordInput.addEventListener("input", validateForm);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !submitBtn.disabled) {
    submitBtn.click();
  }
});

const modal = document.getElementById("error-modal");
const modalMessage = document.getElementById("modal-message");
const closeBtn = document.querySelector(".close-btn");

function showModal(message) {
  modalMessage.textContent = message;
  modal.style.display = "block";
}

closeBtn.onclick = function () {
  modal.style.display = "none";
}

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
}


submitBtn.addEventListener("click", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      localStorage.setItem("uid", user.uid);
      window.location.href = "index.html";
    })
    .catch((error) => {
      showModal("Incorrect email password combination.");
      
    });
});

submitBtn.disabled = true;
