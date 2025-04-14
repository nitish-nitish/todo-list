import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { appId, apiKey, measurementId, messagingSenderId } from "../env";


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
const db = getFirestore(app);
const auth = getAuth(app);

const inputBox = document.getElementById("inputBox");
const descriptionBox = document.getElementById("descriptionBox");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");

let currentUser = null;
let editTodo = null;
let editTodoId = null;

// Create and render a todo item in the DOM
const createTodoElement = (text, id, description = "") => {
  const li = document.createElement("li");
  li.setAttribute("data-id", id);

  const taskText = document.createElement("p");
  taskText.classList.add("task-text");
  taskText.innerText = text;
  li.appendChild(taskText);

  const desc = document.createElement("p");
  desc.classList.add("description");
  desc.innerText = description;
  li.appendChild(desc);

  const actionsDiv = document.createElement("div");
  actionsDiv.classList.add("actions");

  const editBtn = document.createElement("button");
  editBtn.innerText = "Edit";
  editBtn.classList.add("btn", "editBtn");
  actionsDiv.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Remove";
  deleteBtn.classList.add("btn", "deleteBtn");
  actionsDiv.appendChild(deleteBtn);

  li.appendChild(actionsDiv);
  todoList.appendChild(li);
};

// Add or update a todo
const addTodo = async () => {
  const inputText = inputBox.value.trim();
  const descriptionText = descriptionBox.value.trim();

  if (!inputText) {
    alert("You must write something in your to-do");
    return;
  }

  if (addBtn.value === "Edit" && editTodo && editTodoId) {
    await updateDoc(doc(db, "todos", editTodoId), {
      task: inputText,
      description: descriptionText,
    });

    const li = editTodo.target.closest("li");
    li.querySelector(".task-text").innerText = inputText;
    li.querySelector(".description").innerText = descriptionText;

    // Reset state
    addBtn.value = "Add";
    inputBox.value = "";
    descriptionBox.value = "";
    editTodo = null;
    editTodoId = null;
  } else {
    try {
      const docRef = await addDoc(collection(db, "todos"), {
        task: inputText,
        description: descriptionText,
        uid: currentUser.uid,
        timestamp: new Date(),
      });
      createTodoElement(inputText, docRef.id, descriptionText);
      inputBox.value = "";
      descriptionBox.value = "";
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
};

// Load user-specific todos
const getUserTodos = async () => {
  todoList.innerHTML = "";
  try {
    const q = query(
      collection(db, "todos"),
      where("uid", "==", currentUser.uid),
      orderBy("timestamp")
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      createTodoElement(data.task, docSnap.id, data.description || "");
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
};

// Handle edit and delete actions
const handleTodoActions = async (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const todoId = li.getAttribute("data-id");

  if (e.target.classList.contains("deleteBtn")) {
    await deleteDoc(doc(db, "todos", todoId));
    li.remove();
  }

  if (e.target.classList.contains("editBtn")) {
    const taskText = li.querySelector(".task-text").innerText;
    const taskDesc = li.querySelector(".description").innerText;

    inputBox.value = taskText;
    descriptionBox.value = taskDesc;
    inputBox.focus();
    addBtn.value = "Edit";
    editTodo = e;
    editTodoId = todoId;
  }
};

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    getUserTodos();
  } else {
    window.location.href = "login.html";
  }
});

addBtn.addEventListener("click", addTodo);
todoList.addEventListener("click", handleTodoActions);
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
    localStorage.setItem("uid", "")
  });
});

const datetimeDisplay = document.getElementById("datetimeDisplay");

const updateDateTime = () => {
  const now = new Date();
  const formatted = now.toLocaleString();
  datetimeDisplay.innerText = `Current Date & Time: ${formatted}`;
};

setInterval(updateDateTime, 1000);

updateDateTime();
