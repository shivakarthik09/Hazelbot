const express = require('express');
const router = express.Router();
const fs = require('fs');
const menuHelpers = require('./menuHelpers');
const orderHelpers = require('./orderHelpers');
const axios = require('axios');

// Load knowledge base and other data
const knowledgeBase = JSON.parse(fs.readFileSync('./knowledgeBase.json', 'utf-8'));
const menuData = JSON.parse(fs.readFileSync('./menu.json', 'utf-8'));
const orderFlows = JSON.parse(fs.readFileSync('./order.json', 'utf-8')).order_flows;

// LLM API configuration
const LLM_API_KEY = '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';
const LLM_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Data structures for context management
const conversationContext = new Map();
const userOrders = new Map();

// Customer profile tracking
const customerProfiles = new Map();

// Enhanced order tracking
const orderDetails = new Map();

// Specials tracking
const currentSpecials = {
  drinks: [
    { name: "Lavender Latte", price: 4.50, validUntil: "2024-03-31" },
    { name: "Nitro Cold Brew", price: 4.00, validUntil: "2024-03-31" }
  ],
  food: [
    { name: "Avocado Toast", price: 8.50, validUntil: "2024-03-31" },
    { name: "Breakfast Sandwich", price: 7.50, validUntil: "2024-03-31" }
  ]
};

// Allergen information
const allergenInfo = {
  "Lavender Latte": ["milk", "soy"],
  "Nitro Cold Brew": [],
  "Avocado Toast": ["gluten", "dairy"],
  "Breakfast Sandwich": ["gluten", "dairy", "eggs"]
};

// Nutritional information
const nutritionalInfo = {
  "Lavender Latte": { calories: 180, protein: 8, carbs: 22, fat: 7 },
  "Nitro Cold Brew": { calories: 5, protein: 0, carbs: 1, fat: 0 },
  "Avocado Toast": { calories: 320, protein: 12, carbs: 35, fat: 18 }
};

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
// Generate natural response using LLM
async function generateNaturalResponse(message, context, intent, order, customerProfile) {
  try {
    const prompt = `You are Hazel, a friendly barista at Common Good Harlem. Keep responses warm and engaging.
Current context: ${JSON.stringify(context)}
User message: ${message}
Detected intent: ${intent ? intent.tag : 'unknown'}
Current order: ${order ? JSON.stringify(order) : 'none'}
Customer profile: ${customerProfile ? JSON.stringify(customerProfile) : 'new customer'}

Respond naturally as a barista, incorporating the context and intent. Be friendly, helpful, and engaging.`;

    const response = await axios.post(LLM_API_URL, {
      model: "nousresearch/deephermes-3-mistral-24b-preview:free",
      messages: [
        {
          role: "system",
          content: `You are Hazel, a friendly and helpful barista at Common Good Harlem. 
You assist customers with warm, concise answers using the shop's capabilities.
Capabilities you support:
- Displaying menu and item details
- Starting or modifying orders
- Providing store hours, contact, or location info
- Answering nutritional and allergen info
- Supporting order actions like 'add item', 'checkout', 'cancel'
- Asking for customer name if unknown
- Responding with clarity and friendliness

ALWAYS include only relevant info. If unsure, ask the user to clarify politely.`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Common Good Harlem Chatbot'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('LLM API error:', error);
    return null;
  }
}


// Enhanced response generator
async function getResponse(intent, userId, context, message) {
  // Get or create customer profile
  let customerProfile = customerProfiles.get(userId) || {
    name: null,
    visitHistory: [],
    loyaltyId: null,
    dietaryPreferences: [],
    preferredName: null
  };

  // Order context
  let order = userOrders.get(userId) || { id: null, items: [], status: 'pending', table: null, dineMode: null };
  let type = 'text';
  let title = '';
  let text = '';
  let menu = null;
  let orderSummary = null;
  let options = [];

  // Handle dietary/allergen questions
  if (message.toLowerCase().includes('calories') || message.toLowerCase().includes('nutrition')) {
    const item = Object.keys(nutritionalInfo).find(key => 
      message.toLowerCase().includes(key.toLowerCase())
    );
    if (item) {
      const info = nutritionalInfo[item];
      text = `Here's the nutritional information for ${item}:\n` +
        `Calories: ${info.calories}\n` +
        `Protein: ${info.protein}g\n` +
        `Carbs: ${info.carbs}g\n` +
        `Fat: ${info.fat}g`;
      options = ["Menu", "Order", "Allergen Info"];
      return { type: 'nutrition', title: 'Nutrition Info', text, options };
    }
  }

  if (message.toLowerCase().includes('allergen') || message.toLowerCase().includes('allergy')) {
    const item = Object.keys(allergenInfo).find(key => 
      message.toLowerCase().includes(key.toLowerCase())
    );
    if (item) {
      const allergens = allergenInfo[item];
      text = `Allergen information for ${item}:\n` +
        (allergens.length > 0 ? 
          `Contains: ${allergens.join(', ')}` : 
          'No common allergens');
      options = ["Menu", "Order", "Nutrition Info"];
      return { type: 'allergen', title: 'Allergen Info', text, options };
    }
  }

  // Menu item lookup
  const menuItem = menuHelpers.findMenuItemByName(message);

  // Order flow: if user is in the middle of ordering
  if (context.ordering) {
    if (menuItem) {
      // Add item to order
      order = orderHelpers.addItemToOrder(order, menuItem, 1);
      userOrders.set(userId, order);
      orderDetails.set(order.id, {
        ...order,
        customerId: userId,
        timestamp: new Date(),
        status: 'pending',
        specialRequests: []
      });
      
      text = `Added ${menuItem} to your order! Would you like to customize it?`;
      orderSummary = orderHelpers.formatOrderSummary(order);
      options = ["Add Another Item", "View Order", "Checkout", "Cancel Order"];
      type = 'order_update';
    } else if (/checkout|pay|complete/i.test(message)) {
      text = "Ready to checkout! Here's your order summary:";
      orderSummary = orderHelpers.formatOrderSummary(order);
      options = ["Pay with Card", "Pay with Cash", "Cancel Order"];
      type = 'order_checkout';
      context.ordering = false;
    } else if (/cancel/i.test(message)) {
      userOrders.delete(userId);
      orderDetails.delete(order.id);
      text = "Order cancelled. Would you like to start a new one?";
      options = ["Start New Order", "View Menu"];
      type = 'order_cancel';
      context.ordering = false;
    } else {
      text = "What would you like to add to your order?";
      options = ["Show Menu", "Complete Order", "Cancel Order"];
      type = 'order_prompt';
    }
    return { type, title, text, options, menu, orderSummary };
  }

  // Intent-based logic
  if (intent) {
    const naturalResponse = await generateNaturalResponse(message, context, intent, order, customerProfile);
    
    switch (intent.tag) {
      case 'menu':
        menu = menuHelpers.formatMenuResponse();
        title = "Menu";
        text = naturalResponse || "Here's our menu:";
        options = ["Order Drinks", "Order Snacks", "View Hot Drinks", "View Cold Drinks", "View Food"];
        type = 'menu';
        break;
      case 'order':
      case 'start_order':
        context.ordering = true;
        order = { 
          id: orderHelpers.generateOrderId(), 
          items: [],
          status: 'pending',
          table: null,
          dineMode: null
        };
        userOrders.set(userId, order);
        title = "Start Order";
        text = naturalResponse || "What would you like to order?";
        options = ["Show Menu", "Hot Drinks", "Cold Drinks", "Food"];
        type = 'order_start';
        break;
      case 'view_order':
        orderSummary = orderHelpers.formatOrderSummary(order);
        title = "Your Order";
        text = naturalResponse || "Current order:";
        options = ["Add Item", "Checkout", "Cancel Order"];
        type = 'order_view';
        break;
      case 'hours':
        title = "Hours";
        text = naturalResponse || Object.entries(knowledgeBase.storeInfo.hours)
          .map(([day, hours]) => `${day}: ${hours}`)
          .join('\n');
        options = ["Menu", "Order", "Location"];
        type = 'hours';
        break;
      case 'location':
        title = "Location";
        text = naturalResponse || `${knowledgeBase.storeInfo.location}\nPhone: ${knowledgeBase.storeInfo.contact.phone}`;
        options = ["Menu", "Hours", "Contact"];
        type = 'location';
        break;
      case 'contact':
        title = "Contact";
        text = naturalResponse || `Phone: ${knowledgeBase.storeInfo.contact.phone}\nWebsite: ${knowledgeBase.storeInfo.contact.website}`;
        options = ["Menu", "Hours", "Location"];
        type = 'contact';
        break;
      case 'greeting':
        if (!customerProfile.preferredName) {
          text = naturalResponse || "Hi! I'm Hazel. What's your name?";
          type = 'get_name';
        } else {
          text = naturalResponse || `Welcome back, ${customerProfile.preferredName}! How can I help you today?`;
          options = ["Menu", "Order", "Hours", "Location"];
          type = 'greeting';
        }
        break;
      default:
        text = naturalResponse || intent.responses[Math.floor(Math.random() * intent.responses.length)];
        options = ["Menu", "Order", "Hours", "Location"];
        type = 'text';
    }
    return { type, title, text, options, menu, orderSummary };
  }

  // Handle name capture
  if (context.waitingForName) {
    customerProfile.preferredName = message;
    customerProfiles.set(userId, customerProfile);
    context.waitingForName = false;
    return {
      type: 'greeting',
      title: 'Welcome',
      text: `Nice to meet you, ${message}! How can I help you today?`,
      options: ["Menu", "Order", "Hours", "Location"]
    };
  }

  // Fallback: menu item lookup
  if (menuItem) {
    const naturalResponse = await generateNaturalResponse(message, context, intent, order, customerProfile);
    title = "Menu Item";
    text = naturalResponse || `Yes, we have ${menuItem}. Would you like to add it to your order?`;
    options = ["Add to Order", "Show Menu"];
    type = 'menu_item';
    return { type, title, text, options };
  }

  // Fallback: unknown
  const naturalResponse = await generateNaturalResponse(message, context, intent, order, customerProfile);
  return {
    type: 'text',
    title: 'Not Sure',
    text: naturalResponse || "I'm not sure I understand. Could you please rephrase?",
    options: ["Menu", "Order", "Hours", "Location"]
  };
}

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.body.userId || 'guest';
    console.log('Incoming message:', message, 'from user:', userId);

    // Get user context
    let context = conversationContext.get(userId) || {
      currentIntent: null,
      previousMessages: [],
      userPreferences: {},
      ordering: false
    };

    // Find best matching intent
    const intent = findBestIntent(message);
    context.currentIntent = intent;
    console.log('Matched intent:', intent ? intent.tag : null);

    // Get response
    const response = await getResponse(intent, userId, context, message);
    console.log('Response:', response);

    // Update context
    context.previousMessages.push({
      message,
      response,
      timestamp: new Date()
    });

    // Keep only last 10 messages
    if (context.previousMessages.length > 10) {
      context.previousMessages = context.previousMessages.slice(-10);
    }

    conversationContext.set(userId, context);

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      type: 'error',
      title: 'Error',
      text: 'Sorry, I encountered an error processing your message.',
      options: ["Menu", "Order", "Hours", "Location", "Contact Us"]
    });
  }
});

module.exports = router; 