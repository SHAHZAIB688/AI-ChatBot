const STORAGE_KEY = "groq_chats_v2";
const SIDEBAR_STATE_KEY = "sidebar_state";
const API_BASE = window.API_BASE || (location.protocol === 'file:' ? 'http://localhost:3000' : '');
const messagesEl = document.getElementById("messages");
const chatListEl = document.getElementById("chatList");
const userInputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const form = document.getElementById("messageForm");
const newChatBtn = document.getElementById("newChat");
const deleteChatsBtn = document.getElementById("deleteChats");
const chatTitleEl = document.getElementById("chatTitle");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const sidebarToggle = document.getElementById("sidebarToggle");
const shell = document.querySelector(".shell");
const sidebarOverlay = document.querySelector(".sidebar-overlay");

let chats = []; 
let activeChatId = null;
let isSending = false;
let typingEl = null;
let serverConfigured = true;
let typewriterActive = false;
let sidebarVisible = true;

// Sidebar state management
const updateSidebarState = (visible) => {
    sidebarVisible = visible;
    if (visible) {
        shell.classList.remove("sidebar-hidden");
    } else {
        shell.classList.add("sidebar-hidden");
    }
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(visible));
};

// Initialize sidebar state
try {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
        sidebarVisible = JSON.parse(savedState);
    } else {
        // Default: show on desktop, hide on mobile
        const isMobile = window.innerWidth <= 960;
        sidebarVisible = !isMobile;
    }
    updateSidebarState(sidebarVisible);
} catch (e) {
    console.warn("Error loading sidebar state", e);
}

// Sidebar toggle event
if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        updateSidebarState(!sidebarVisible);
    });
}

// Close sidebar when clicking overlay (mobile only)
if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
        const isMobile = window.innerWidth <= 960;
        if (isMobile) {
            updateSidebarState(false);
        }
    });
}

// Close sidebar when clicking on a chat item (mobile only)
document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 960;
    if (isMobile && sidebarVisible && e.target.closest('.chat-item')) {
        // Small delay to allow chat selection to process
        setTimeout(() => updateSidebarState(false), 100);
    }
});

// Update sidebar on window resize
window.addEventListener("resize", () => {
    const isMobile = window.innerWidth <= 960;
    // Auto-hide sidebar when switching from desktop to mobile
    if (isMobile && sidebarVisible && window.innerWidth <= 960) {
        // Keep sidebar hidden on mobile by default
        updateSidebarState(false);
    }
});

// hydrate chats defensively
try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
        chats = saved;
        activeChatId = chats[0]?.id || null;
    }
} catch (e) {
    console.warn("Resetting corrupted chat history");
}

const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));

const getActiveChat = () => chats.find((chat) => chat.id === activeChatId) || null;

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const setStatus = (label, state = "online") => {
    statusLabel.textContent = label;
    statusDot.className = `dot ${state}`;
};

const escapeHtml = (text = "") =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const renderContent = (text = "") => escapeHtml(text).replace(/\n/g, "<br>");

const typeText = (el, text, delay = 12) =>
    new Promise((resolve) => {
        let i = 0;
        typewriterActive = true;
        const tick = () => {
            el.innerHTML = renderContent(text.slice(0, i));
            i += 2;
            if (i <= text.length) {
                setTimeout(tick, delay);
            } else {
                el.innerHTML = renderContent(text);
                typewriterActive = false;
                resolve();
            }
        };
        tick();
    });

const renderChatList = () => {
    chatListEl.innerHTML = "";
    const sorted = [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    sorted.forEach((chat) => {
        const li = document.createElement("li");
        li.className = `chat-item${chat.id === activeChatId ? " active" : ""}`;

        const header = document.createElement("div");
        header.className = "chat-item__row";

        const title = document.createElement("p");
        title.className = "chat-item__title";
        title.textContent = chat.title || "Conversation";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "ghost ghost--small";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            chats = chats.filter((c) => c.id !== chat.id);
            if (activeChatId === chat.id) {
                activeChatId = chats[0]?.id || null;
            }
            if (!chats.length) createChat();
            persist();
            renderChatList();
            renderMessages();
        };

        header.appendChild(title);
        header.appendChild(deleteBtn);

        const meta = document.createElement("p");
        meta.className = "chat-item__meta";
        const lastMessage = chat.messages[chat.messages.length - 1];
        meta.textContent = lastMessage ? `${lastMessage.sender === "user" ? "You" : "AI"} · ${lastMessage.text.slice(0, 50)}` : "No messages yet";

        li.appendChild(header);
        li.appendChild(meta);
        li.onclick = () => {
            activeChatId = chat.id;
            renderChatList();
            renderMessages();
        };
        chatListEl.appendChild(li);
    });
};

const renderMessages = () => {
    messagesEl.innerHTML = "";
    const chat = getActiveChat();
    if (!chat) return;

    chat.messages.forEach((msg) => {
        addMessageToUI(msg);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
    chatTitleEl.textContent = chat.title || "New conversation";
};

const addMessageToUI = (msg) => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${msg.sender}${msg.variant ? ` ${msg.variant}` : ""}`;
    const textEl = document.createElement("div");
    textEl.className = "bubble__text";
    textEl.innerHTML = renderContent(msg.text);

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${msg.sender === "user" ? "You" : "AI"} · ${formatTime(msg.timestamp)}`;

    bubble.appendChild(textEl);
    bubble.appendChild(meta);
    messagesEl.appendChild(bubble);
    return bubble;
};

const createChat = (title = "New conversation") => {
    const chat = {
        id: `chat-${Date.now()}`,
        title,
        messages: [],
        updatedAt: Date.now()
    };
    chats.unshift(chat);
    activeChatId = chat.id;
    persist();
    renderChatList();
    renderMessages();
};

const updateChatTitle = (chat, text) => {
    if (chat.title === "New conversation" || !chat.title) {
        chat.title = text.slice(0, 40);
    }
};

const showTypingIndicator = () => {
    typingEl = document.createElement("div");
    typingEl.className = "bubble ai";
    typingEl.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
};

const removeTypingIndicator = () => {
    if (typingEl?.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
};

const sendMessage = async (text) => {
    let chat = getActiveChat();
    if (!chat) {
        createChat();
        chat = getActiveChat();
    }

    const timestamp = Date.now();
    const userMessage = { sender: "user", text, timestamp };
    chat.messages.push(userMessage);
    chat.updatedAt = timestamp;
    updateChatTitle(chat, text);

    renderMessages();
    persist();
    userInputEl.value = "";
    userInputEl.focus();

    setStatus("Thinking...");
    setLoading(true);
    showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            throw new Error("Invalid response from server.");
        }
        if (!response.ok || !data.reply) {
            throw new Error(data.error || "Unexpected response from server.");
        }

        removeTypingIndicator();
        const aiMessage = { sender: "ai", text: data.reply.trim(), timestamp: Date.now() };
        chat.messages.push(aiMessage);
        chat.updatedAt = Date.now();

        renderMessages();
        persist();

        const lastBubble = messagesEl.lastElementChild;
        const textEl = lastBubble?.querySelector(".bubble__text");
        if (textEl) {
            textEl.innerHTML = "";
            await typeText(textEl, aiMessage.text);
        }
    } catch (err) {
        console.error(err);
        const errorMessage = { sender: "ai", text: err.message || "Sorry, something went wrong. Please try again.", timestamp: Date.now(), variant: "error" };
        chat.messages.push(errorMessage);
        renderMessages();
        persist();
        setStatus("Offline", "offline");
        if (err.message?.includes("GROQ_API_KEY")) {
            serverConfigured = false;
        }
    } finally {
        removeTypingIndicator();
        setLoading(false);
        setStatus(serverConfigured ? "Ready" : "Server not configured", serverConfigured ? "online" : "offline");
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
};

const setLoading = (state) => {
    isSending = state;
    sendBtn.disabled = state;
};

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSending) return;

    const text = userInputEl.value.trim();
    if (!text) return;

    await sendMessage(text);
});

userInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
});

newChatBtn.addEventListener("click", () => {
    createChat();
});

deleteChatsBtn.addEventListener("click", () => {
    if (confirm("Delete all chat history?")) {
        chats = [];
        activeChatId = null;
        persist();
        renderChatList();
        messagesEl.innerHTML = "";
        createChat();
    }
});

const autoResize = () => {
    userInputEl.style.height = "auto";
    userInputEl.style.height = `${Math.min(userInputEl.scrollHeight, 180)}px`;
};

userInputEl.addEventListener("input", autoResize);

// Bootstrap
if (!chats.length) {
    createChat();
} else {
    renderChatList();
    renderMessages();
}
autoResize();
