import { db } from '../../../src/js/firebase/firebaseConfig.js';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to fetch all analytics data
export async function fetchAnalyticsData() {
  try {
    // Fetch users data
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch orders data
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch issues data
    const issuesRef = collection(db, 'issues');
    const issuesSnapshot = await getDocs(issuesRef);
    const issues = issuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch products data
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate user metrics
    const totalUsers = users.length;
    const activatedUsers = users.filter(
      user => user.phoneVerified === "true" || user.phoneVerified === true || user.phoneVerified === 1
    ).length;
    const usersWithOrders = [...new Set(orders.map(order => order.userId))].length;
    const usersWithIssues = [...new Set(issues.map(issue => issue.userId))].length;
    const usersWithoutIssues = totalUsers - usersWithIssues;
    const issueRatio = usersWithIssues / (usersWithoutIssues || 1);

    // Calculate order metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const canceledOrders = orders.filter(order => order.status === 'canceled').length;

    // Calculate issue metrics
    const totalIssues = issues.length;
    const pendingIssues = issues.filter(issue => issue.status && issue.status.toLowerCase() === 'pending').length;
    const closedIssues = issues.filter(issue => issue.status && issue.status.toLowerCase() === 'closed').length;
    const openIssues = issues.filter(issue => issue.status && issue.status.toLowerCase() === 'open').length;
    const issueStatusRatio = pendingIssues / (closedIssues || 1);

    // Calculate product metrics
    const totalProducts = products.length;
    
    // Find most selling product
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
      });
    });
    
    const mostSellingProduct = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)[0];
    
    const mostSellingProductData = mostSellingProduct 
      ? products.find(p => p.id === mostSellingProduct[0])
      : null;

    // Fetch all parts for total count
    const partsRef = collection(db, 'parts');
    const partsSnapshot = await getDocs(partsRef);
    const totalParts = partsSnapshot.docs.length;

    // Fetch all reorders for most reordered part
    const reordersRef = collection(db, 'reorders');
    const reordersSnapshot = await getDocs(reordersRef);
    const reorders = reordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const partReorders = {};
    reorders.forEach(reorder => {
      if (typeof reorder.name === 'string') {
        partReorders[reorder.name] = (partReorders[reorder.name] || 0) + 1;
      }
    });
    const mostReorderedPart = Object.entries(partReorders)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      users: {
        total: totalUsers,
        activated: activatedUsers,
        withOrders: usersWithOrders,
        withIssues: usersWithIssues,
        issueRatio: issueRatio
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        canceled: canceledOrders
      },
      issues: {
        total: totalIssues,
        pending: pendingIssues,
        closed: closedIssues,
        open: openIssues,
        statusRatio: issueStatusRatio
      },
      products: {
        total: totalProducts,
        mostSelling: mostSellingProductData ? {
          name: mostSellingProductData.name,
          sales: mostSellingProduct[1]
        } : null
      },
      parts: {
        total: totalParts,
        mostReordered: mostReorderedPart ? {
          name: mostReorderedPart[0],
          count: mostReorderedPart[1]
        } : null
      }
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
} 