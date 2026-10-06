/* =======================================================
   inn APP JAVASCRIPT
   State Management, Dynamic Profile Loader, Feed Rendering,
   Nested Comments, Story Viewer, & Support Chat
   ======================================================= */

// LOAD SAVED USER PROFILE OR USE DEFAULT
// LOAD SAVED USER PROFILE OR USE DEFAULT
// LOAD SAVED USER PROFILE OR USE DEFAULT
let savedProfile = JSON.parse(localStorage.getItem('inn_user_profile')) || {};

const CURRENT_USER = {
  id: "usr_000",
  username: savedProfile.username || "Alex_Journey",
  avatar: savedProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  condition: savedProfile.illness || savedProfile.condition || "Lyme Disease & Dysautonomia",
  healthScore: savedProfile.healthScore || 50
};

// Sync Header Profile Pic with Setup Data
function updateUserHeaderAvatar() {
  const avatarImg = document.querySelector('.user-avatar-small img');
  if (avatarImg && CURRENT_USER.avatar) {
    avatarImg.src = CURRENT_USER.avatar;
    avatarImg.title = CURRENT_USER.username;
  }
  
  // Also update story "Your Story" avatar if available
  if (stories && stories[0]) {
    stories[0].avatar = CURRENT_USER.avatar;
    stories[0].username = CURRENT_USER.username;
    stories[0].condition = CURRENT_USER.condition;
  }
}

// MOCK POST DATA
let posts = [
  {
    id: "post_1",
    author: {
      username: "Sarah_M",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      condition: "Stage 2 Lymphoma"
    },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-walking-in-a-forest-41550-large.mp4",
    caption: "Day 4 after chemotherapy. Today was tough, but taking a light 5-minute walk in nature gave me so much peace. Sending strength to everyone fighting today! ❤️",
    symptoms: ["#ChemoJourney", "#LymphomaAwareness", "#BrainFog", "#ChronicFatigue"],
    likes: 142,
    isLiked: false,
    reshares: 29,
    isReshared: false,
    isBookmarked: false,
    comments: [
      {
        id: "c1",
        author: { username: "David_Hope", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", isOriginalAuthor: false },
        text: "Walking outside during chemo days was key for my mental health too! You've got this Sarah! 💪",
        replies: [
          {
            id: "r1",
            author: { username: "Sarah_M", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", isOriginalAuthor: true },
            text: "@David_Hope Thank you so much David! How did you manage the fatigue after the walks?"
          }
        ]
      }
    ]
  },
  {
    id: "post_2",
    author: {
      username: "Marcus_POTS",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      condition: "POTS & Long Covid"
    },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-cup-of-coffee-in-bed-41528-large.mp4",
    caption: "Living with heart rate spikes daily. Here is my daily electrolyte routine that helped lower my resting flare-ups. Hope this helps a fellow POTS warrior!",
    symptoms: ["#POTS", "#LongCovid", "#Dysautonomia", "#HeartRateSpikes"],
    likes: 389,
    isLiked: true,
    reshares: 84,
    isReshared: false,
    isBookmarked: true,
    comments: [
      {
        id: "c2",
        author: { username: "Elena_Wellness", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80", isOriginalAuthor: false },
        text: "Which sodium brand do you use? My doctor suggested increasing salt intake too.",
        replies: []
      }
    ]
  }
];

// STORIES DATA
const stories = [
  { id: "s0", username: "Your Story", avatar: CURRENT_USER.avatar, image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&q=80", condition: CURRENT_USER.condition, caption: "Sharing today's symptom update..." },
  { id: "s1", username: "Elena_W", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80", condition: "Fibromyalgia", caption: "Gentle morning stretching for stiffness 🧘‍♀️" },
  { id: "s2", username: "David_Hope", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&q=80", condition: "Lyme Survivor", caption: "Good blood work results today! 🎉" }
];

// FILTER TAGS
const filterTags = ["All", "#LongCovid", "#ChemoJourney", "#LymeDisease", "#POTS", "#Fibromyalgia", "#ChronicFatigue", "#MentalHealth"];

// STATE VARIABLES
let activePostForComments = null;
let activeReplyParentId = null;
let activeReplyUsername = null;
let storyTimer = null;

// DOM ELEMENTS
const videoFeed = document.getElementById("videoFeed");
const storiesTray = document.getElementById("storiesTray");
const filterTagsContainer = document.getElementById("filterTagsContainer");
const commentsDrawer = document.getElementById("commentsDrawer");
const commentsList = document.getElementById("commentsList");
const commentInput = document.getElementById("commentInput");
const replyTargetBanner = document.getElementById("replyTargetBanner");
const replyingToUser = document.getElementById("replyingToUser");
const cancelReplyBtn = document.getElementById("cancelReplyBtn");

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  updateUserHeaderAvatar();
  renderFilterTags();
  renderStories();
  renderFeed(posts);
  setupEventListeners();
  setupChatSystem();
});

// Sync Header Profile Pic with Setup Data
function updateUserHeaderAvatar() {
  const avatarImg = document.querySelector('.user-avatar-small img');
  if (avatarImg && CURRENT_USER.avatar) {
    avatarImg.src = CURRENT_USER.avatar;
    avatarImg.title = CURRENT_USER.username;
  }
}

// 1. RENDER FILTER TAGS
function renderFilterTags() {
  filterTagsContainer.innerHTML = filterTags.map((tag, index) => `
    <button class="tag-btn ${index === 0 ? 'active' : ''}" onclick="filterFeed('${tag}', this)">
      ${tag}
    </button>
  `).join('');
}

function filterFeed(tag, element) {
  document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');

  if (tag === "All") {
    renderFeed(posts);
  } else {
    const filtered = posts.filter(p => p.symptoms.includes(tag) || p.author.condition.toLowerCase().includes(tag.replace('#','').toLowerCase()));
    renderFeed(filtered);
  }
}

// 2. RENDER STORIES
function renderStories() {
  storiesTray.innerHTML = stories.map(s => `
    <div class="story-item" onclick="openStoryViewer('${s.id}')">
      <div class="story-ring">
        <img src="${s.avatar}" alt="${s.username}" />
      </div>
      <span class="story-username">${s.username}</span>
    </div>
  `).join('');
}

// 3. RENDER VIDEO FEED
function renderFeed(postsToRender) {
  if (postsToRender.length === 0) {
    videoFeed.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No posts found matching this symptom tag.</div>`;
    return;
  }

  videoFeed.innerHTML = postsToRender.map(post => `
    <article class="post-card" id="card-${post.id}">
      <!-- Post Header -->
      <div class="post-header">
        <div class="author-info">
          <img src="${post.author.avatar}" alt="${post.author.username}" />
          <div class="author-details">
            <h4>${post.author.username}</h4>
            <span class="condition-badge">${post.author.condition}</span>
          </div>
        </div>
        <button class="icon-btn" onclick="openChatWith('${post.author.username}', '${post.author.avatar}', '${post.author.condition}')">
          <i class="fa-regular fa-paper-plane"></i>
        </button>
      </div>

      <!-- Video Wrapper -->
      <div class="video-wrapper" ondblclick="handleDoubleTap('${post.id}', event)">
        <video src="${post.videoUrl}" loop playsinline muted onclick="togglePlayPause(this)"></video>
        <i class="fa-solid fa-play video-overlay-play"></i>
        <button class="mute-btn" onclick="toggleMute(this, event)"><i class="fa-solid fa-volume-xmark"></i></button>
      </div>

      <!-- Interaction Bar -->
      <div class="post-actions">
        <div class="action-group">
          <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
            <i class="${post.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
            <span class="action-count">${post.likes}</span>
          </button>
          
          <button class="action-btn" onclick="openCommentsDrawer('${post.id}')">
            <i class="fa-regular fa-comment"></i>
            <span class="action-count">${getTotalCommentsCount(post)}</span>
          </button>

          <button class="action-btn ${post.isReshared ? 'reshared' : ''}" onclick="toggleReshare('${post.id}')">
            <i class="fa-solid fa-arrows-rotate"></i>
            <span class="action-count">${post.reshares}</span>
          </button>
        </div>

        <button class="action-btn ${post.isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark('${post.id}')">
          <i class="${post.isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}"></i>
        </button>
      </div>

      <!-- Post Caption & Symptoms -->
      <div class="post-caption-box">
        <p><strong>${post.author.username}</strong> ${post.caption}</p>
        <div class="symptoms-tags">
          ${post.symptoms.map(symptom => `<span class="symptom-tag">${symptom}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');

  setupIntersectionObserver();
}

function togglePlayPause(video) {
  const wrapper = video.closest('.video-wrapper');
  if (video.paused) {
    video.play();
    wrapper.classList.remove('paused');
  } else {
    video.pause();
    wrapper.classList.add('paused');
  }
}

function toggleMute(btn, e) {
  e.stopPropagation();
  const video = btn.closest('.video-wrapper').querySelector('video');
  video.muted = !video.muted;
  btn.innerHTML = video.muted ? `<i class="fa-solid fa-volume-xmark"></i>` : `<i class="fa-solid fa-volume-high"></i>`;
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      if (video) {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.post-card').forEach(card => observer.observe(card));
}

function handleDoubleTap(postId, event) {
  const wrapper = event.currentTarget;
  const heart = document.createElement('i');
  heart.className = 'fa-solid fa-heart heart-pop';
  wrapper.appendChild(heart);

  setTimeout(() => heart.remove(), 800);

  const post = posts.find(p => p.id === postId);
  if (post && !post.isLiked) {
    toggleLike(postId);
  }
}

function toggleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
    renderFeed(posts);
  }
}

function toggleReshare(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isReshared = !post.isReshared;
    post.reshares += post.isReshared ? 1 : -1;
    renderFeed(posts);
  }
}

function toggleBookmark(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isBookmarked = !post.isBookmarked;
    renderFeed(posts);
  }
}

// 4. COMMENTS & REPLIES
function getTotalCommentsCount(post) {
  let count = post.comments.length;
  post.comments.forEach(c => count += c.replies ? c.replies.length : 0);
  return count;
}

function openCommentsDrawer(postId) {
  activePostForComments = posts.find(p => p.id === postId);
  document.getElementById('commentCountBadge').innerText = `(${getTotalCommentsCount(activePostForComments)})`;
  renderComments();
  commentsDrawer.classList.add('active');
}

function renderComments() {
  if (!activePostForComments) return;

  commentsList.innerHTML = activePostForComments.comments.map(c => `
    <div class="comment-item">
      <img src="${c.author.avatar}" class="comment-avatar" alt="${c.author.username}" />
      <div class="comment-body">
        <div>
          <span class="comment-author">${c.author.username}</span>
          ${c.author.isOriginalAuthor ? `<span class="author-badge">Author</span>` : ''}
        </div>
        <p class="comment-text">${c.text}</p>
        <button class="comment-reply-btn" onclick="initiateReply('${c.id}', '${c.author.username}')">Reply</button>

        ${c.replies && c.replies.length > 0 ? `
          <div class="nested-replies">
            ${c.replies.map(r => `
              <div class="comment-item">
                <img src="${r.author.avatar}" class="comment-avatar" alt="${r.author.username}" />
                <div class="comment-body">
                  <div>
                    <span class="comment-author">${r.author.username}</span>
                    ${r.author.isOriginalAuthor ? `<span class="author-badge">Author</span>` : ''}
                  </div>
                  <p class="comment-text">${r.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function initiateReply(commentId, username) {
  activeReplyParentId = commentId;
  activeReplyUsername = username;
  replyingToUser.innerText = `@${username}`;
  replyTargetBanner.style.display = 'flex';
  commentInput.focus();
}

cancelReplyBtn.addEventListener('click', () => {
  activeReplyParentId = null;
  activeReplyUsername = null;
  replyTargetBanner.style.display = 'none';
});

document.getElementById('commentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text || !activePostForComments) return;

  const newCommentObj = {
    id: "r_" + Date.now(),
    author: {
      username: CURRENT_USER.username,
      avatar: CURRENT_USER.avatar,
      isOriginalAuthor: activePostForComments.author.username === CURRENT_USER.username
    },
    text: activeReplyUsername ? `@${activeReplyUsername} ${text}` : text,
    replies: []
  };

  if (activeReplyParentId) {
    const parent = activePostForComments.comments.find(c => c.id === activeReplyParentId);
    if (parent) parent.replies.push(newCommentObj);
  } else {
    activePostForComments.comments.push(newCommentObj);
  }

  commentInput.value = '';
  cancelReplyBtn.click();
  renderComments();
  renderFeed(posts);
});

// 5. STORY VIEWER SYSTEM
function openStoryViewer(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;

  document.getElementById('storyUserAvatar').src = story.avatar;
  document.getElementById('storyUsername').innerText = story.username;
  document.getElementById('storyConditionTag').innerText = story.condition;
  document.getElementById('storyImageMedia').src = story.image;
  document.getElementById('storyCaptionText').innerText = story.caption;

  const modal = document.getElementById('storyViewerModal');
  const fill = document.getElementById('storyProgressFill');
  modal.classList.add('active');

  fill.style.width = '0%';
  setTimeout(() => fill.style.width = '100%', 10);

  clearTimeout(storyTimer);
  storyTimer = setTimeout(() => closeStoryViewer(), 5000);
}

function closeStoryViewer() {
  document.getElementById('storyViewerModal').classList.remove('active');
  clearTimeout(storyTimer);
}

// 6. DIRECT CHAT SYSTEM
const mockPeers = [
  { username: "Sarah_M", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", condition: "Stage 2 Lymphoma" },
  { username: "Marcus_POTS", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", condition: "POTS & Long Covid" },
  { username: "Elena_Wellness", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80", condition: "Fibromyalgia" }
];

let chatHistory = {
  "Sarah_M": [
    { sender: "Sarah_M", text: "Hi! Thanks for connecting. How are your symptoms today?" },
    { sender: CURRENT_USER.username, text: "Hey Sarah! Managing today step by step. How was chemotherapy?" }
  ]
};

let activeChatPeer = "Sarah_M";

function setupChatSystem() {
  renderPeerList();
  renderChatMessages();

  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    sendChatMessage(msg);
    input.value = '';
  });

  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => sendChatMessage(chip.dataset.msg));
  });
}

function renderPeerList() {
  document.getElementById('peerList').innerHTML = mockPeers.map(peer => `
    <div class="peer-item ${peer.username === activeChatPeer ? 'active' : ''}" onclick="selectPeer('${peer.username}')">
      <img src="${peer.avatar}" alt="${peer.username}" />
      <div>
        <div class="peer-name">${peer.username}</div>
        <div class="peer-condition">${peer.condition}</div>
      </div>
    </div>
  `).join('');
}

function selectPeer(username) {
  activeChatPeer = username;
  const peer = mockPeers.find(p => p.username === username);
  if (peer) {
    document.getElementById('activeChatName').innerText = peer.username;
    document.getElementById('activeChatAvatar').src = peer.avatar;
    document.getElementById('activeChatCondition').innerText = peer.condition;
  }
  renderPeerList();
  renderChatMessages();
}

function openChatWith(username, avatar, condition) {
  if (!chatHistory[username]) {
    chatHistory[username] = [{ sender: username, text: "Hello! Thank you for reaching out on inn." }];
  }
  if (!mockPeers.find(p => p.username === username)) {
    mockPeers.push({ username, avatar, condition });
  }
  selectPeer(username);
  document.getElementById('chatModal').classList.add('active');
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  const msgs = chatHistory[activeChatPeer] || [];

  container.innerHTML = msgs.map(m => `
    <div class="msg-bubble ${m.sender === CURRENT_USER.username ? 'sent' : 'received'}">
      ${m.text}
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage(text) {
  if (!chatHistory[activeChatPeer]) chatHistory[activeChatPeer] = [];
  chatHistory[activeChatPeer].push({ sender: CURRENT_USER.username, text });
  renderChatMessages();

  setTimeout(() => {
    chatHistory[activeChatPeer].push({
      sender: activeChatPeer,
      text: "Thank you so much for your kind words! Sending love back! ❤️"
    });
    renderChatMessages();
  }, 1200);
}

// 7. EVENT LISTENERS
// 7. EVENT LISTENERS
function setupEventListeners() {
  // NEW: Navigate to setup-profile.html when profile picture is clicked
  const profileNavBtn = document.getElementById('profileNavBtn');
  if (profileNavBtn) {
    profileNavBtn.addEventListener('click', () => {
      window.location.href = 'setup-profile.html';
    });
  }

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  document.getElementById('openChatBtn').addEventListener('click', () => {
    document.getElementById('chatModal').classList.add('active');
  });
  
  document.getElementById('closeChatBtn').addEventListener('click', () => {
    document.getElementById('chatModal').classList.remove('active');
  });

  document.getElementById('closeCommentsBtn').addEventListener('click', () => {
    commentsDrawer.classList.remove('active');
  });

  document.getElementById('closeStoryBtn').addEventListener('click', closeStoryViewer);

  document.getElementById('createPostBtn').addEventListener('click', () => {
    document.getElementById('createPostModal').classList.add('active');
  });
  
  document.getElementById('closeCreatePostBtn').addEventListener('click', () => {
    document.getElementById('createPostModal').classList.remove('active');
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderFeed(posts);
      return;
    }
    const filtered = posts.filter(p => 
      p.caption.toLowerCase().includes(query) ||
      p.author.condition.toLowerCase().includes(query) ||
      p.symptoms.some(s => s.toLowerCase().includes(query))
    );
    renderFeed(filtered);
  });

  document.getElementById('newPostForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('postVideoUrl').value;
    const condition = document.getElementById('postCondition').value;
    const symptoms = document.getElementById('postSymptoms').value.split(',').map(s => s.trim().startsWith('#') ? s.trim() : '#' + s.trim());
    const caption = document.getElementById('postCaption').value;

    const newPost = {
      id: "post_" + Date.now(),
      author: {
        username: CURRENT_USER.username,
        avatar: CURRENT_USER.avatar,
        condition: condition
      },
      videoUrl: videoUrl,
      caption: caption,
      symptoms: symptoms,
      likes: 0,
      isLiked: false,
      reshares: 0,
      isReshared: false,
      isBookmarked: false,
      comments: []
    };

    posts.unshift(newPost);
    renderFeed(posts);
    document.getElementById('createPostModal').classList.remove('active');
    e.target.reset();
  });
}