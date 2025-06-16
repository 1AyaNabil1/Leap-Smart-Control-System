import { initAdminAuthCheck } from '../src/js/firebase/adminAuthCheck.js';
initAdminAuthCheck();
import { fetchAnalyticsData } from './src/data/analyticsData.js';
import { db, auth } from "../src/js/firebase/firebaseConfig.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
// DOM Elements
const menuToggle = document.querySelector(".menu-toggle");
const closeMenu = document.querySelector(".close-menu");
const sidebar = document.querySelector(".sidebar");

// Toggle menu with error handling
menuToggle?.addEventListener("click", () => {
  try {
    sidebar.classList.add("active");
    menuToggle.style.display = "none";
  } catch (error) {
    console.error("Error toggling menu:", error);
  }
});

// Close menu with error handling
closeMenu?.addEventListener("click", () => {
  try {
    sidebar.classList.remove("active");
    menuToggle.style.display = "flex";
  } catch (error) {
    console.error("Error closing menu:", error);
  }
});

// Mock admin data with fallback image
const admin = {
  userName: "Mohamed Hassan",
  image: "Img/mo.jpg",
  fallbackImage: "https://via.placeholder.com/45x45",
};

// Helper function to get first name
function getFirstName(fullName) {
  return fullName?.split(" ")[0] || "User";
}

async function getCurrentAdminData() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        unsubscribe();
        reject(new Error('No user logged in'));
        return;
      }
      try {
        // First check if user is an admin
        const adminsRef = collection(db, 'admins');
        const adminQuery = query(
          adminsRef,
          where('email', '==', user.email),
          where('userID', '==', user.uid)
        );
        const adminSnapshot = await getDocs(adminQuery);
        if (adminSnapshot.empty) {
          unsubscribe();
          reject(new Error('No admin data found'));
          return;
        }
        // Then get user data from users collection
        const usersRef = collection(db, 'users');
        const userQuery = query(
          usersRef,
          where('email', '==', user.email)
        );
        const userSnapshot = await getDocs(userQuery);
        let userData = {};
        if (!userSnapshot.empty) {
          userData = userSnapshot.docs[0].data();
        }
        unsubscribe();
        resolve({
          userName: userData.fullName || user.displayName || 'Admin',
          image: userData.profilePicture || user.photoURL || 'https://i.ibb.co/277hTSg8/generic-profile.jpg',
          firstName: userData.firstName || getFirstName(userData.fullName || user.displayName || 'Admin')
        });
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    });
  });
}

// Memoized format functions for better performance
const memoizedFormatCurrency = (() => {
  const cache = new Map();
  return (number) => {
    if (cache.has(number)) return cache.get(number);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
    cache.set(number, formatted);
    return formatted;
  };
})();

const memoizedFormatNumber = (() => {
  const cache = new Map();
  return (number) => {
    if (cache.has(number)) return cache.get(number);
    const formatted = number >= 1000 ? (number / 1000).toFixed(1) + "k" : number.toString();
    cache.set(number, formatted);
    return formatted;
  };
})();

const memoizedFormatRatio = (() => {
  const cache = new Map();
  return (ratio) => {
    if (cache.has(ratio)) return cache.get(ratio);
    const formatted = (ratio * 100).toFixed(1) + "%";
    cache.set(ratio, formatted);
    return formatted;
  };
})();

// Display the dashboard content with error handling
const displayDashboard = async function () {
  try {
    const mainContent = document.querySelector(".main-content");
    if (!mainContent) {
      throw new Error("Main content container not found");
    }

    // Fetch admin info
    let admin = {
      userName: "Admin",
      image: "https://i.ibb.co/277hTSg8/generic-profile.jpg",
      firstName: "Admin"
    };
    try {
      admin = await getCurrentAdminData();
    } catch (e) {
      // fallback to default admin
    }

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData();

    // Create a DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const container = document.createElement("div");

    container.innerHTML = `
      <header class="dashboard-header">
        <div class="profile">
          <h2>Welcome, <span>${admin.firstName}</span></h2>
        </div>
        <div class="admin-info">
          <img src="${admin.image}" alt="Admin" onerror="this.onerror=null;this.src='https://i.ibb.co/277hTSg8/generic-profile.jpg';" />
          <span>${admin.userName}</span>
        </div>
      </header>
      
      <div class="analytics-container">
        <div class="analytics-grid">
          <!-- Users Section -->
          <div class="analytics-card">
            <div class="analytics-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="analytics-details">
              <h3>Total Users</h3>
              <div class="analytics-value">${memoizedFormatNumber(analyticsData.users.total)}</div>
              <div class="analytics-subdetails">
                <div>Phone Activated: ${memoizedFormatNumber(analyticsData.users.activated)}</div>
                <div>With Orders: ${memoizedFormatNumber(analyticsData.users.withOrders)}</div>
                <div>With Issues: ${memoizedFormatNumber(analyticsData.users.withIssues)}</div>
                <div class="users-issue-ratio-container">
                  <span class="users-issue-ratio-label">Users with Issues:</span>
                  <span class="users-issue-ratio-value">
                    ${(
                      analyticsData.users.total > 0
                        ? ((analyticsData.users.withIssues / analyticsData.users.total) * 100).toFixed(1)
                        : '0.0'
                    )}%
                  </span>
                  <span class="users-issue-ratio-explanation">
                    (users who reported at least one issue)
                  </span>
                  <span class="users-issue-ratio-label">Users without Issues:</span>
                  <span class="users-issue-ratio-value">
                    ${(
                      analyticsData.users.total > 0
                        ? (((analyticsData.users.total - analyticsData.users.withIssues) / analyticsData.users.total) * 100).toFixed(1)
                        : '0.0'
                    )}%
                  </span>
                  <span class="users-issue-ratio-explanation">
                    (users who never reported an issue)
                  </span>
                </div>
                <div class="users-pie-chart-container">
                  <svg class="users-pie-chart" width="80" height="80" viewBox="0 0 32 32">
                    ${(() => {
                      const total = analyticsData.users.withIssues + (analyticsData.users.total - analyticsData.users.withIssues);
                      const withIssues = analyticsData.users.withIssues;
                      const withoutIssues = analyticsData.users.total - analyticsData.users.withIssues;
                      const withIssuesAngle = (withIssues / total) * 360;
                      const withoutIssuesAngle = 360 - withIssuesAngle;
                      // Pie chart arc calculation
                      const describeArc = (cx, cy, r, startAngle, endAngle, color) => {
                        const start = polarToCartesian(cx, cy, r, endAngle);
                        const end = polarToCartesian(cx, cy, r, startAngle);
                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                        const d = [
                          "M", cx, cy,
                          "L", start.x, start.y,
                          "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
                          "Z"
                        ].join(" ");
                        return `<path d='${d}' fill='${color}'></path>`;
                      };
                      function polarToCartesian(cx, cy, r, angle) {
                        const rad = (angle - 90) * Math.PI / 180.0;
                        return {
                          x: cx + (r * Math.cos(rad)),
                          y: cy + (r * Math.sin(rad))
                        };
                      }
                      // With Issues slice (orange)
                      const withIssuesPath = describeArc(16, 16, 16, 0, withIssuesAngle, '#d4821e');
                      // Without Issues slice (green)
                      const withoutIssuesPath = describeArc(16, 16, 16, withIssuesAngle, 360, '#28a745');
                      return withIssuesPath + withoutIssuesPath;
                    })()}
                  </svg>
                  <div class="users-pie-legend">
                    <span><span class="pie-legend-color" style="background:#d4821e;"></span> With Issues</span>
                    <span><span class="pie-legend-color" style="background:#28a745;"></span> Without Issues</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders Section -->
          <div class="analytics-card">
            <div class="analytics-icon">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <div class="analytics-details">
              <h3>Total Orders</h3>
              <div class="analytics-value">${memoizedFormatNumber(analyticsData.orders.total)}</div>
              <div class="analytics-subdetails">
                <div>Completed: ${memoizedFormatNumber(analyticsData.orders.completed)}</div>
                <div>Pending: ${memoizedFormatNumber(analyticsData.orders.pending)}</div>
                <div>Canceled: ${memoizedFormatNumber(analyticsData.orders.canceled)}</div>
                <div class="order-ratio-container">
                  <span class="order-ratio-label">Order Ratio:</span>
                  <span class="order-ratio-value">
                    ${(
                      analyticsData.orders.total > 0
                        ? `${((analyticsData.orders.completed / analyticsData.orders.total) * 100).toFixed(1)}% : ${((analyticsData.orders.pending / analyticsData.orders.total) * 100).toFixed(1)}% : ${((analyticsData.orders.canceled / analyticsData.orders.total) * 100).toFixed(1)}%`
                        : 'N/A'
                    )}
                  </span>
                  <span class="order-ratio-explanation" title="Ratio of completed, pending, and canceled orders (completed:pending:canceled)">
                    (completed : pending : canceled)
                  </span>
                </div>
                <div class="orders-pie-chart-container">
                  <svg class="orders-pie-chart" width="80" height="80" viewBox="0 0 32 32">
                    ${(() => {
                      const total = analyticsData.orders.total;
                      const completed = analyticsData.orders.completed;
                      const pending = analyticsData.orders.pending;
                      const canceled = analyticsData.orders.canceled;
                      if (total === 0) return '';
                      const completedAngle = (completed / total) * 360;
                      const pendingAngle = (pending / total) * 360;
                      const canceledAngle = (canceled / total) * 360;
                      // Pie chart arc calculation
                      const describeArc = (cx, cy, r, startAngle, endAngle, color) => {
                        const start = polarToCartesian(cx, cy, r, endAngle);
                        const end = polarToCartesian(cx, cy, r, startAngle);
                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                        const d = [
                          "M", cx, cy,
                          "L", start.x, start.y,
                          "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
                          "Z"
                        ].join(" ");
                        return `<path d='${d}' fill='${color}'></path>`;
                      };
                      function polarToCartesian(cx, cy, r, angle) {
                        const rad = (angle - 90) * Math.PI / 180.0;
                        return {
                          x: cx + (r * Math.cos(rad)),
                          y: cy + (r * Math.sin(rad))
                        };
                      }
                      let start = 0;
                      const completedPath = describeArc(16, 16, 16, start, start + completedAngle, '#28a745');
                      start += completedAngle;
                      const pendingPath = describeArc(16, 16, 16, start, start + pendingAngle, '#d4821e');
                      start += pendingAngle;
                      const canceledPath = describeArc(16, 16, 16, start, start + canceledAngle, '#dc3545');
                      return completedPath + pendingPath + canceledPath;
                    })()}
                  </svg>
                  <div class="orders-pie-legend">
                    <span><span class="pie-legend-color" style="background:#28a745;"></span> Completed</span>
                    <span><span class="pie-legend-color" style="background:#d4821e;"></span> Pending</span>
                    </div>
                    <br>
                    <div>
                    <span><span class="pie-legend-color" style="background:#dc3545;"></span> Canceled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Issues Section -->
          <div class="analytics-card">
            <div class="analytics-icon">
              <i class="fas fa-triangle-exclamation"></i>
            </div>
            <div class="analytics-details">
              <h3>Total Issues</h3>
              <div class="analytics-value">${memoizedFormatNumber(analyticsData.issues.total)}</div>
              <div class="analytics-subdetails">
                <div>Pending: ${memoizedFormatNumber(analyticsData.issues.pending)}</div>
                <div>Closed: ${memoizedFormatNumber(analyticsData.issues.closed)}</div>
                <div>Open: ${memoizedFormatNumber(analyticsData.issues.open)}</div>
                <div class="issues-ratio-container">
                  <span class="issues-ratio-label">Issue Ratio:</span>
                  <span class="issues-ratio-value">
                    ${(
                      analyticsData.issues.total > 0
                        ? `${((analyticsData.issues.open / analyticsData.issues.total) * 100).toFixed(1)}% : ${((analyticsData.issues.pending / analyticsData.issues.total) * 100).toFixed(1)}% : ${((analyticsData.issues.closed / analyticsData.issues.total) * 100).toFixed(1)}%`
                        : 'N/A'
                    )}
                  </span>
                  <span class="issues-ratio-explanation" title="Ratio of open, pending, and closed issues (open:pending:closed)">
                    (open : pending : closed)
                  </span>
                </div>
                <div class="issues-pie-chart-container">
                  <svg class="issues-pie-chart" width="80" height="80" viewBox="0 0 32 32">
                    ${(() => {
                      const total = analyticsData.issues.total;
                      const open = analyticsData.issues.open;
                      const pending = analyticsData.issues.pending;
                      const closed = analyticsData.issues.closed;
                      if (total === 0) return '';
                      const openAngle = (open / total) * 360;
                      const pendingAngle = (pending / total) * 360;
                      const closedAngle = (closed / total) * 360;
                      // Pie chart arc calculation
                      const describeArc = (cx, cy, r, startAngle, endAngle, color) => {
                        const start = polarToCartesian(cx, cy, r, endAngle);
                        const end = polarToCartesian(cx, cy, r, startAngle);
                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                        const d = [
                          "M", cx, cy,
                          "L", start.x, start.y,
                          "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
                          "Z"
                        ].join(" ");
                        return `<path d='${d}' fill='${color}'></path>`;
                      };
                      function polarToCartesian(cx, cy, r, angle) {
                        const rad = (angle - 90) * Math.PI / 180.0;
                        return {
                          x: cx + (r * Math.cos(rad)),
                          y: cy + (r * Math.sin(rad))
                        };
                      }
                      let start = 0;
                      const openPath = describeArc(16, 16, 16, start, start + openAngle, '#2196f3');
                      start += openAngle;
                      const pendingPath = describeArc(16, 16, 16, start, start + pendingAngle, '#d4821e');
                      start += pendingAngle;
                      const closedPath = describeArc(16, 16, 16, start, start + closedAngle, '#28a745');
                      return openPath + pendingPath + closedPath;
                    })()}
                  </svg>
                  <div class="issues-pie-legend">
                    <span><span class="pie-legend-color" style="background:#2196f3;"></span> Open</span>
                    <span><span class="pie-legend-color" style="background:#d4821e;"></span> Pending</span>
                    <span><span class="pie-legend-color" style="background:#28a745;"></span> Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Products Section -->
          <div class="analytics-card">
            <div class="analytics-icon">
              <i class="fas fa-box"></i>
            </div>
            <div class="analytics-details">
              <h3>Total Products</h3>
              <div class="analytics-value">${memoizedFormatNumber(analyticsData.products.total)}</div>
              <div class="analytics-subdetails">
                <div>Most Selling: ${analyticsData.products.mostSelling ? analyticsData.products.mostSelling.name : 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Parts Section -->
          <div class="analytics-card">
            <div class="analytics-icon">
              <i class="fa-solid fa-warehouse"></i>
            </div>
            <div class="analytics-details">
              <h3>Total Parts</h3>
              <div class="analytics-value">${memoizedFormatNumber(analyticsData.parts.total)}</div>
              <div class="analytics-subdetails">
                <div>Most Reordered: ${analyticsData.parts.mostReordered ? analyticsData.parts.mostReordered.name : 'N/A'}</div>
                <div>Reorder Count: ${analyticsData.parts.mostReordered ? memoizedFormatNumber(analyticsData.parts.mostReordered.count) : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    fragment.appendChild(container);
    mainContent.innerHTML = "";
    mainContent.appendChild(fragment);
    // Hide loading overlay after dashboard loads
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  } catch (error) {
    console.error("Error displaying dashboard:", error);
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="color: rgb(212, 130, 30); padding: 20px; text-align: center;">
          <h2><span style="filter: invert(9%) sepia(80%) saturate(3916%) hue-rotate(313deg) brightness(82%) contrast(94%);">🔜</span> Coming Soon <span style="filter: invert(9%) sepia(80%) saturate(3916%) hue-rotate(313deg) brightness(82%) contrast(94%);">🔜</span></h2>
        </div>
      `;
    }
  }
};

// Initialize the page with error handling
document.addEventListener("DOMContentLoaded", () => {
  try {
    displayDashboard();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
});

// Add window resize handler for responsive charts
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    try {
      displayDashboard();
    } catch (error) {
      console.error("Error resizing dashboard:", error);
    }
  }, 250);
});
