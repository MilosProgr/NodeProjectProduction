// --- GLOBAL STATE ---
let token = localStorage.getItem('token');
let isLoading = false;
let isAuthenticating = false;
let isRegistration = false;
let selectedTab = 'All';
let todos = [];

const apiBase = '/';

// --- DOM ELEMENTS ---
const nav = document.querySelector('nav');
const header = document.querySelector('header');
const main = document.querySelector('main');
const navElements = document.querySelectorAll('.tab-button');
const authContent = document.getElementById('auth');
const error = document.getElementById('error');
const email = document.getElementById('emailInput');
const password = document.getElementById('passwordInput');
const registerBtn = document.getElementById('registerBtn');
const authBtn = document.getElementById('authBtn');
const logoutBtn = document.getElementById('logoutBtn');

// --- FUNCTIONS ---

// Centralna kontrola vidljivosti UI elemenata
function updateAuthUI() {
    if (token) {
        authContent.style.display = 'none';
        nav.style.display = 'block';
        header.style.display = 'flex';
        main.style.display = 'flex';
        logoutBtn.style.display = 'block';
    } else {
        authContent.style.display = 'flex';
        nav.style.display = 'none';
        header.style.display = 'none';
        main.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

async function showAuth() {
    updateAuthUI();
}

async function showDashboard() {
    await fetchTodos();
    updateAuthUI();
}

function updateHeaderText() {
    const todosLength = todos.length;
    header.querySelector('h1').innerText = todosLength === 1
        ? 'You have 1 open task.'
        : `You have ${todosLength} open tasks.`;
}

function updateNavCount() {
    navElements.forEach(ele => {
        const btnText = ele.innerText.split(' ')[0];
        const count = todos.filter(val => {
            if (btnText === 'All') return true;
            return btnText === 'Complete' ? val.completed : !val.completed;
        }).length;
        ele.querySelector('span').innerText = `(${count})`;
    });
}

async function toggleIsRegister() {
    isRegistration = !isRegistration;
    registerBtn.innerText = isRegistration ? 'Sign in' : 'Sign up';
    document.querySelector('#auth > div h2').innerText = isRegistration ? 'Sign Up' : 'Login';
    document.querySelector('.register-content p').innerText = isRegistration ? 'Already have an account?' : "Don't have an account?";
    document.querySelector('.register-content button').innerText = isRegistration ? 'Sign in' : 'Sign up';
}

async function logout() {
    token = null;
    localStorage.removeItem('token');
    showAuth();
}

async function authenticate() {
    const emailVal = email.value;
    const passVal = password.value;

    if (isLoading || isAuthenticating || !emailVal || !passVal || passVal.length < 6 || !emailVal.includes('@')) return;

    error.style.display = 'none';
    isAuthenticating = true;
    authBtn.innerText = 'Authenticating...';

    try {
        let response, data;
        if (isRegistration) {
            response = await fetch(apiBase + 'auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            });
            data = await response.json();
        } else {
            response = await fetch(apiBase + 'auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            });
            data = await response.json();
        }

        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            authBtn.innerText = 'Loading...';
            await fetchTodos();
            showDashboard();
        } else {
            throw new Error('❌ Failed to authenticate...');
        }

    } catch (err) {
        console.log(err.message);
        error.innerText = err.message;
        error.style.display = 'block';
    } finally {
        authBtn.innerText = 'Submit';
        isAuthenticating = false;
    }
}

async function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const task = todoInput.value;
    if (!task) return;

    await fetch(apiBase + 'todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ task })
    });

    todoInput.value = '';
    fetchTodos();
}

function changeTab(tab) {
    selectedTab = tab;
    navElements.forEach(val => val.innerText.includes(tab)
        ? val.classList.add('selected-tab')
        : val.classList.remove('selected-tab'));
    renderTodos();
}

function renderTodos() {
    updateNavCount();
    updateHeaderText();

    let todoList = '';
    todos.filter(todo => {
        return selectedTab === 'All' ? true : selectedTab === 'Complete' ? todo.completed : !todo.completed;
    }).forEach(todo => {
        const todoId = todo.id;
        todoList += `
            <div class="card todo-item">
                <p>${todo.task}</p>
                <div class="todo-buttons">
                    <button onclick="updateTodo(${todoId})" ${todo.completed ? 'disabled' : ''}>
                        <h6>Done</h6>
                    </button>
                    <button onclick="deleteTodo(${todoId})">
                        <h6>Delete</h6>
                    </button>
                </div>
            </div>
        `;
    });

    todoList += `
        <div class="input-container">
            <input id="todoInput" placeholder="Add task" />
            <button onclick="addTodo()">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    `;
    main.innerHTML = todoList;
}

// --- CRUD LOGIC ---
async function fetchTodos() {
    isLoading = true;
    const response = await fetch(apiBase + 'todos', {
        headers: { 'Authorization': token }
    });
    todos = await response.json();
    isLoading = false;
    renderTodos();
}

async function updateTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    await fetch(apiBase + 'todos/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ task: todo.task, completed: 1 })
    });
    fetchTodos();
}

async function deleteTodo(id) {
    await fetch(apiBase + 'todos/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': token },
    });
    fetchTodos();
}

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    if (token) {
        (async () => { await fetchTodos(); })();
    } else {
        showAuth();
    }
});
