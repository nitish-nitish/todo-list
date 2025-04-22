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
import { appId, apiKey, measurementId, messagingSenderId } from "../env.js";

console.log('hello')
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
const deleteAll = document.getElementById("deleteAll");
const listBtn = document.getElementById("listbtn");
const backBtn = document.getElementById("backbtn");
const todoList = document.getElementById("todoList");

let currentUser = null;
let editTodo = null;
let editTodoId = null;

const toDateTimeString = (timestamp) => {
  if (!timestamp) return "N/A";
  if (timestamp instanceof Date) return timestamp.toLocaleString();
  if (typeof timestamp === "string") return new Date(timestamp).toLocaleString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return "Invalid date";
};

const createTodoElement = (text, id, description = "", createdAt = null, completedAt = null) => {
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

  const createdInfo = document.createElement("p");
  createdInfo.classList.add("timestamp");
  createdInfo.innerText = `Added: ${toDateTimeString(createdAt)}`;
  li.appendChild(createdInfo);

  if (completedAt) {
    const completedInfo = document.createElement("p");
    completedInfo.classList.add("timestamp");
    completedInfo.innerText = `Completed: ${toDateTimeString(completedAt)}`;
    li.appendChild(completedInfo);
  }

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

  const completeBtn = document.createElement("button");
  completeBtn.innerText = "Complete";
  completeBtn.classList.add("btn", "completeBtn");
  actionsDiv.appendChild(completeBtn);

  li.appendChild(actionsDiv);
  todoList.appendChild(li);
};

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

    addBtn.value = "Add";
    inputBox.value = "";
    descriptionBox.value = "";
    editTodo = null;
    editTodoId = null;
  } else {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, "todos"), {
        task: inputText,
        description: descriptionText,
        uid: currentUser.uid,
        createdAt: now,
        completedAt: null,
      });
      createTodoElement(inputText, docRef.id, descriptionText, now, null);
      inputBox.value = "";
      descriptionBox.value = "";
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
};

const getUserTodos = async (filter = "all") => {
  todoList.innerHTML = "";
  try {
    const q = query(
      collection(db, "todos"),
      where("uid", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter logic
      if (
        (filter === "completed" && !data.completedAt) ||
        (filter === "pending" && data.completedAt)
      ) {
        return;
      }

      createTodoElement(
        data.task,
        docSnap.id,
        data.description || "",
        data.createdAt,
        data.completedAt
      );
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
};

const deleteAllTodos = async () => {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, "todos"),
      where("uid", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(q);

    // Delete each document one by one
    const deletePromises = querySnapshot.docs.map((docSnap) => {
      return deleteDoc(doc(db, "todos", docSnap.id));
    });

    await Promise.all(deletePromises);

    // Clear the UI
    todoList.innerHTML = "";
    console.log("All todos deleted successfully!");
  } catch (error) {
    console.error("Error deleting todos:", error);
  }
};

deleteAll.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all your todos?")) {
    deleteAllTodos();
  }
});

if (listBtn) {
  listBtn.addEventListener("click", () => {
    window.location.href = "list.html";
  });

}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

}

document.getElementById("allTab").addEventListener("click", () => {
  setActiveTab("allTab");
  getUserTodos("all");
});

document.getElementById("completedTab").addEventListener("click", () => {
  setActiveTab("completedTab");
  getUserTodos("completed");
});

document.getElementById("pendingTab").addEventListener("click", () => {
  setActiveTab("pendingTab");
  getUserTodos("pending");
});

const setActiveTab = (id) => {
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
};

const handleTodoActions = async (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const todoId = li.getAttribute("data-id");

  if (e.target.classList.contains("deleteBtn")) {
    await deleteDoc(doc(db, "todos", todoId));
    li.remove();
  }

  if (e.target.classList.contains("completeBtn")) {
    const now = new Date();
    await updateDoc(doc(db, "todos", todoId), {
      completedAt: now,
    });
    getUserTodos();
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    getUserTodos();
  } else {
    window.location.href = "login.html";
  }
});

if (addBtn) {
  addBtn.addEventListener("click", addTodo);
}
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
