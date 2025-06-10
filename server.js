const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const fs = require('fs');
const menuHelpers = require('./menuHelpers');
const orderHelpers = require('./orderHelpers');
const chatRouter = require('./chatRouter');

// Load knowledge base and other data
const knowledgeBase = JSON.parse(fs.readFileSync('./knowledgeBase.json', 'utf-8'));
const menuData = JSON.parse(fs.readFileSync('./menu.json', 'utf-8'));
const orderFlows = JSON.parse(fs.readFileSync('./order.json', 'utf-8')).order_flows;
const basicReplies = JSON.parse(fs.readFileSync('./basic_replies.json', 'utf-8'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Data structures for table management and context
const tableQueue = new Map();
const activeTables = new Map();
const customerInfo = new Map();
const conversationContext = new Map();

// In-memory order state per user
const userOrders = new Map();

// Find the best matching intent from the knowledge base
function findBestIntent(message) {
  if (!message) return null;
  const lowerMsg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const intent of knowledgeBase.intents) {
    for (const pattern of intent.patterns) {
      if (lowerMsg.includes(pattern.toLowerCase())) {
        if (pattern.length > bestScore) {
          bestScore = pattern.length;
          bestMatch = intent;
        }
      }
    }
  }
  return bestMatch;
}

// Context-aware, structured response generator
function getResponse(intent, userId, context, message) {
  // Order context
  let order = userOrders.get(userId) || { id: null, items: [] };
  let type = 'text';
  let menu = null;
  let orderSummary = null;
  let quickReplies = [];
  let responseText = '';

  // Menu item lookup
  const menuItem = menuHelpers.findMenuItemByName(message);

  // Order flow: if user is in the middle of ordering
  if (context.ordering) {
    if (menuItem) {
      // Add item to order
      order = orderHelpers.addItemToOrder(order, menuItem, 1);
      userOrders.set(userId, order);
      responseText = `Added ${menuItem} to your order.`;
      orderSummary = orderHelpers.formatOrderSummary(order);
      quickReplies = ["Add Another Item", "View Order", "Checkout", "Cancel Order"];
      type = 'order_update';
    } else if (/checkout|pay|complete/i.test(message)) {
      responseText = "Ready to checkout! Here's your order summary:";
      orderSummary = orderHelpers.formatOrderSummary(order);
      quickReplies = ["Pay with Card", "Pay with Cash", "Cancel Order"];
      type = 'order_checkout';
      context.ordering = false;
    } else if (/cancel/i.test(message)) {
      userOrders.delete(userId);
      responseText = "Your order has been cancelled.";
      quickReplies = ["Start New Order", "View Menu"];
      type = 'order_cancel';
      context.ordering = false;
      } else {
      responseText = "What would you like to add to your order? You can say the name of any menu item.";
      quickReplies = ["Show Menu", "Complete Order", "Cancel Order"];
      type = 'order_prompt';
    }
    return { response: responseText, quickReplies, type, orderSummary };
  }

  // Intent-based logic
  if (intent) {
    switch (intent.tag) {
    case 'menu':
        menu = menuHelpers.formatMenuResponse();
        responseText = "Here's our menu:";
        quickReplies = ["Order Drinks", "Order Snacks", "View Hot Drinks", "View Cold Drinks", "View Food", "Browse Full Menu (DoorDash)"];
        type = 'menu';
      break;
      case 'order':
      case 'start_order':
        context.ordering = true;
        order = { id: orderHelpers.generateOrderId(), items: [] };
        userOrders.set(userId, order);
        responseText = "Great! Let's start your order. What would you like to add?";
        quickReplies = ["Show Menu", "Hot Drinks", "Cold Drinks", "Food", "Signature Drinks"];
        type = 'order_start';
      break;
      case 'view_order':
        orderSummary = orderHelpers.formatOrderSummary(order);
        responseText = "Here's your current order:";
        quickReplies = ["Add Another Item", "Checkout", "Cancel Order", "Show Menu"];
        type = 'order_view';
      break;
      case 'signature_drinks':
        responseText = orderFlows.signature_drinks.response;
        quickReplies = orderFlows.signature_drinks.quickReplies;
        type = 'signature_drinks';
      break;
    default:
        // Default: respond with intent response
        responseText = intent.responses[Math.floor(Math.random() * intent.responses.length)];
        quickReplies = ["Menu", "Order", "Hours", "Location", "Contact Us"];
        type = 'text';
    }
    return { response: responseText, quickReplies, type, menu, orderSummary };
  }

  // Fallback: menu item lookup
  if (menuItem) {
    responseText = `Yes, we have ${menuItem} on our menu! Would you like to add it to your order?`;
    quickReplies = ["Add to Order", "Show Menu", "Order Something Else"];
    type = 'menu_item';
    return { response: responseText, quickReplies, type };
  }

  // Fallback: unknown
  return {
    response: "I'm not sure I understand. Could you please rephrase or ask something else?",
    quickReplies: ["Menu", "Order", "Hours", "Location", "Contact Us"],
    type: 'text'
  };
}

// API Routes
app.use('/api', chatRouter);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ... keep the rest of your chatbot helper functions ... 