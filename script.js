// DOM Elements
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const studentForm = document.getElementById("student-form");
const studentList = document.getElementById("student-list");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

// Current user tracking
let currentUser = null;

// Register form submission
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Validate password match
  if (registerForm.password.value !== registerForm.confirmPassword.value) {
    alert("Passwords don't match!");
    return;
  }

  const formData = new FormData(registerForm);
  const user = Object.fromEntries(formData.entries());

  const photoFile = formData.get("userPhoto");
  if (photoFile && photoFile.size > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      user.photo = reader.result;
      saveUser(user);
    };
    reader.readAsDataURL(photoFile);
  } else {
    saveUser(user);
  }
});

function saveUser(user) {
  localStorage.setItem(user.email, JSON.stringify(user));
  alert("Registration successful! Please login.");
  showLoginPage();
  registerForm.reset();
}

// Login form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  const user = JSON.parse(localStorage.getItem(email));

  if (user && user.password === password) {
    currentUser = user;
    document.getElementById("userName").textContent = user.fullName;
    if (user.photo) {
      document.getElementById("userPhotoDisplay").src = user.photo;
    }
    document.getElementById("logoutIcon").style.display = "block";
    showDashboard();
  } else {
    alert("Invalid login credentials.");
  }
});

// Logout function
function logout() {
  currentUser = null;
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("logoutIcon").style.display = "none";
  showLoginPage();
}

// Student form submission
studentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(studentForm);
  const student = Object.fromEntries(formData.entries());
  
  // Calculate total marks
  const total = parseInt(student.math) + parseInt(student.science) + 
                parseInt(student.english) + parseInt(student.history) + 
                parseInt(student.computer);
  student.total = total;

  const photoFile = formData.get("studentPhoto");
  const isEditing = studentForm.dataset.editingIndex !== undefined;

  const processStudent = (studentData) => {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    
    if (isEditing) {
      // Update existing student
      const index = parseInt(studentForm.dataset.editingIndex);
      students[index] = studentData;
      delete studentForm.dataset.editingIndex;
      showToast("Student updated successfully!");
    } else {
      // Add new student
      students.push(studentData);
      showToast("Student added successfully!");
    }
    
    localStorage.setItem("students", JSON.stringify(students));
    displayStudents(students);
    studentForm.reset();
    studentForm.querySelector('button[type="submit"]').textContent = "Add Student";
  };

  if (photoFile && photoFile.size > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      student.photo = reader.result;
      processStudent(student);
    };
    reader.readAsDataURL(photoFile);
  } else if (isEditing) {
    // Keep existing photo if editing and no new photo is provided
    const students = JSON.parse(localStorage.getItem("students")) || [];
    const index = parseInt(studentForm.dataset.editingIndex);
    student.photo = students[index].photo;
    processStudent(student);
  } else {
    // New student with no photo
    processStudent(student);
  }
});

// Display students in the list
function displayStudents(students) {
  studentList.innerHTML = "";
  
  if (students.length === 0) {
    studentList.innerHTML = "<li class='no-students'>No students found</li>";
    return;
  }

  students.forEach((student, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${student.photo ? `<img src="${student.photo}" class="student-photo" alt="Student Photo">` : 
       '<div class="student-photo"><i class="fas fa-user-graduate"></i></div>'}
      <div class="student-info">
        <div class="student-name">${student.studentName}</div>
        <div class="student-details">
          Age: ${student.studentAge} | Class: ${student.studentGrade}
        </div>
        <div class="student-marks">
          <span class="mark-item">Math: ${student.math}</span>
          <span class="mark-item">Science: ${student.science}</span>
          <span class="mark-item">English: ${student.english}</span>
          <span class="mark-item">History: ${student.history}</span>
          <span class="mark-item">Computer: ${student.computer}</span>
          <span class="mark-item total-marks">Total: ${student.total}</span>
        </div>
      </div>
      <div class="student-actions">
        <button class="edit-btn" data-index="${index}"><i class="fas fa-edit"></i> Edit</button>
        <button class="delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
      <div style="clear: both;"></div>
    `;
    studentList.appendChild(li);
  });

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      editStudent(parseInt(e.target.closest('button').dataset.index));
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deleteStudent(parseInt(e.target.closest('button').dataset.index));
    });
  });
}

// Edit student function
function editStudent(index) {
  const students = JSON.parse(localStorage.getItem("students")) || [];
  const student = students[index];
  
  // Fill the form with student data
  studentForm.studentName.value = student.studentName;
  studentForm.studentAge.value = student.studentAge;
  studentForm.studentGrade.value = student.studentGrade;
  studentForm.math.value = student.math;
  studentForm.science.value = student.science;
  studentForm.english.value = student.english;
  studentForm.history.value = student.history;
  studentForm.computer.value = student.computer;
  
  // Change the button text
  studentForm.querySelector('button[type="submit"]').textContent = "Update Student";
  
  // Store the index being edited
  studentForm.dataset.editingIndex = index;
  
  // Scroll to the form
  studentForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete student function
function deleteStudent(index) {
  if (confirm("Are you sure you want to delete this student?")) {
    const students = JSON.parse(localStorage.getItem("students")) || [];
    students.splice(index, 1);
    localStorage.setItem("students", JSON.stringify(students));
    displayStudents(students);
    showToast("Student deleted successfully!");
  }
}

// Search functionality
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const students = JSON.parse(localStorage.getItem("students")) || [];
  const filtered = students.filter(s => 
    s.studentName.toLowerCase().includes(query) ||
    s.studentGrade.toLowerCase().includes(query) ||
    String(s.studentAge).includes(query)
  );
  displayStudents(filtered);
});

// Sort functionality
sortSelect.addEventListener("change", () => {
  const key = sortSelect.value;
  const students = JSON.parse(localStorage.getItem("students")) || [];
  
  if (!key) {
    displayStudents(students);
    return;
  }

  students.sort((a, b) => {
    if (key === 'name') return a.studentName.localeCompare(b.studentName);
    if (key === 'name-desc') return b.studentName.localeCompare(a.studentName);
    if (key === 'grade') return a.studentGrade.localeCompare(b.studentGrade);
    if (key === 'grade-desc') return b.studentGrade.localeCompare(a.studentGrade);
    if (key === 'age') return a.studentAge - b.studentAge;
    if (key === 'age-desc') return b.studentAge - a.studentAge;
    if (key === 'total') return b.total - a.total;
    return 0;
  });
  
  displayStudents(students);
});

// Toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Page navigation functions
function showLoginPage() {
  document.getElementById("register-page").style.display = "none";
  document.getElementById("login-page").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  loginForm.reset();
}

function showRegisterPage() {
  document.getElementById("register-page").style.display = "block";
  document.getElementById("login-page").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  registerForm.reset();
}

function showDashboard() {
  document.getElementById("register-page").style.display = "none";
  document.getElementById("login-page").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  displayStudents(JSON.parse(localStorage.getItem("students")) || []);
}


// Initialize the app
window.onload = () => {
  showLoginPage();
  
  // Check if there's a logged in user in session
  const loggedInUser = localStorage.getItem("currentUser");
  if (loggedInUser) {
    currentUser = JSON.parse(loggedInUser);
    document.getElementById("userName").textContent = currentUser.fullName;
    if (currentUser.photo) {
      document.getElementById("userPhotoDisplay").src = currentUser.photo;
    }
    document.getElementById("logoutIcon").style.display = "block";
    showDashboard();
  }
};
// Save current user to localStorage on logout
window.addEventListener("beforeunload", () => {
  if (currentUser) {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  } else {
    localStorage.removeItem("currentUser");
  }
});

