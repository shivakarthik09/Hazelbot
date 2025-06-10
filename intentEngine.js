const knowledgeBase = require('./knowledgeBase.json');
const menuHelpers = require('./menuHelpers');
const orderHelpers = require('./orderHelpers');
const fetch = require('node-fetch');
require('dotenv').config();

const userOrders = new Map();
const conversationContext = new Map();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SITE_URL = "http://localhost:3000";
const SITE_TITLE = "Silicon Harlem Chatbot";

console.log("OpenRouter API Key: ", OPENROUTER_API_KEY ? "Loaded" : "Not Loaded");
console.log("OpenRouter URL: ", OPENROUTER_URL);

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

function generateQuickReplies(type, context, intentTag) {
  // Modular quick reply logic
  switch (type) {
    case 'intro':
      return ["Menu", "Order", "Events", "Hours", "Location"];
    case 'menu':
      return ["Order Drinks", "Order Snacks", "View Hot Drinks", "View Cold Drinks", "View Food", "Browse Full Menu (DoorDash)"];
    case 'order_start':
      return ["Show Menu", "Hot Drinks", "Cold Drinks", "Food", "Signature Drinks"];
    case 'order_update':
      return ["Add Another Item", "View Order", "Checkout", "Cancel Order"];
    case 'order_checkout':
      return ["Pay with Card", "Pay with Cash", "Cancel Order"];
    case 'order_cancel':
      return ["Start New Order", "View Menu"];
    case 'order_prompt':
      return ["Show Menu", "Complete Order", "Cancel Order"];
    case 'order_view':
      return ["Add Another Item", "Checkout", "Cancel Order", "Show Menu"];
    case 'events':
      return ["Register", "More Events", "Menu", "Hours"];
    case 'location':
      return ["Menu", "Events", "Hours", "Contact Us"];
    case 'contact':
      return ["Menu", "Order", "Hours", "Location"];
    case 'recommendation':
      return ["Order Recommended", "Menu", "Something Else"];
    default:
      return ["Menu", "Order", "Events", "Hours", "Location"];
  }
}

function recommendItems(context) {
  // Simple rule-based recommendation (can be replaced with LLM)
  // Recommend based on time of day, previous orders, etc.
  const hour = new Date().getHours();
  if (hour < 12) return ["Latte", "Croissant", "Iced Coffee"];
  if (hour < 17) return ["Sandwich", "Cappuccino", "Frappuccino"];
  return ["Iced Coffee", "Sandwich", "Croissant"];
}

async function callOpenRouterLLM(message, context) {
  const headers = {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_TITLE
  };
  const messagesPayload = [
    { role: "system", content: "You are a helpful, friendly, and concise virtual assistant for a coffee shop. Respond in a structured, clear, and inviting way." },
    { role: "user", content: message }
  ];
  const body = JSON.stringify({
    model: "openai/gpt-4o",
    messages: messagesPayload,
    max_tokens: 500
  });
  console.log("Calling OpenRouter LLM...");
  console.log("LLM Request Body:", body);
  try {
    const response = await fetch(OPENROUTER_URL, { method: 'POST', headers, body });
    const data = await response.json();
    console.log("LLM Raw Response:", JSON.stringify(data, null, 2));
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    }
    console.error("LLM API Error or unexpected response format:", data);
    return "I'm not sure how to help with that, but I'm always learning!";
  } catch (err) {
    console.error("LLM Fetch Error:", err);
    return "Sorry, I'm having trouble thinking right now! (LLM error)";
  }
}

async function callOpenRouterLLMSuggestions(message, context, llmText) {
  // First check if we have predefined suggestions in our knowledge base
  const lowerMessage = message.toLowerCase();
  
  // Check for menu items
  for (const category of ['hotDrinks', 'coldDrinks', 'food']) {
    for (const item in knowledgeBase.menu[category]) {
      if (lowerMessage.includes(item.toLowerCase())) {
        return knowledgeBase.getMenuSuggestions(category, item);
      }
    }
  }

  // Check for FAQs
  for (const category of ['general', 'menu', 'policies']) {
    const faqResult = knowledgeBase.getFAQAnswer(category, message);
    if (faqResult) {
      return faqResult.suggestions;
    }
  }

  // If no predefined suggestions found, use LLM
  const headers = {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_TITLE
  };

  // Determine the category based on the message and context
  let category = 'general';
  if (context.currentIntent?.tag === 'menu' || lowerMessage.includes('menu') || lowerMessage.includes('drink') || lowerMessage.includes('food')) {
    category = 'menu';
  } else if (lowerMessage.includes('policy') || lowerMessage.includes('return') || lowerMessage.includes('reservation')) {
    category = 'faq';
  }

  // Get context-aware suggestions from knowledge base
  const baseSuggestions = knowledgeBase.generateSuggestions(context, message, category);

  const messagesPayload = [
    { 
      role: "system", 
      content: "You are a helpful, friendly, and concise virtual assistant for a coffee shop. Given the conversation and the last bot message, suggest 2-3 short, natural, and highly relevant follow-up questions or actions a friendly coffee shop waiter might ask next. Return only the suggestions as a JSON array of strings. Consider the context and previous suggestions." 
    },
    { 
      role: "user", 
      content: `Conversation so far: ${JSON.stringify(context.previousMessages)}\nLast user message: ${message}\nBot's last response: ${llmText}\nPrevious suggestions: ${JSON.stringify(baseSuggestions)}` 
    }
  ];

  const body = JSON.stringify({
    model: "openai/gpt-4o",
    messages: messagesPayload,
    max_tokens: 100
  });

  console.log("Calling OpenRouter LLM for suggestions...");
  console.log("Suggestions Request Body:", body);

  try {
    const response = await fetch(OPENROUTER_URL, { method: 'POST', headers, body });
    const data = await response.json();
    console.log("Suggestions Raw Response:", JSON.stringify(data, null, 2));
    
    let suggestions = [];
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      try {
        suggestions = JSON.parse(data.choices[0].message.content);
        console.log("Parsed LLM Suggestions:", suggestions);
      } catch (e) {
        console.warn("Failed to parse LLM suggestions as JSON, falling back to line extraction:", e);
        suggestions = data.choices[0].message.content.split('\n').filter(Boolean);
      }
    }

    // Combine LLM suggestions with base suggestions, removing duplicates
    const allSuggestions = [...new Set([...baseSuggestions, ...suggestions])];
    return allSuggestions.slice(0, 3); // Return top 3 suggestions
  } catch (err) {
    console.error("LLM Suggestions Fetch Error:", err);
    return baseSuggestions; // Fallback to base suggestions if LLM fails
  }
}

async function getChatResponse(message, userId) {
  let context = conversationContext.get(userId) || { currentIntent: null, previousMessages: [], userPreferences: {}, ordering: false };
  let order = userOrders.get(userId) || { id: null, items: [] };
  const intent = findBestIntent(message);
  context.currentIntent = intent;
  let type = 'text';
  let title = '';
  let text = '';
  let links = [];
  let options = [];
  let menu = null;
  let orderSummary = null;
  let structured = {};

  // First check intent-based responses from knowledge base
  if (intent) {
    const intentResponse = knowledgeBase.getIntentResponse(intent.tag, message);
    if (intentResponse) {
      type = intent.tag;
      title = intent.tag.charAt(0).toUpperCase() + intent.tag.slice(1);
      text = intentResponse.response;
      options = intentResponse.suggestions;
      structured = { type, title, text, options };
      conversationContext.set(userId, context);
      return structured;
    }
  }

  // Check PDF information if available
  const pdfResults = knowledgeBase.pdfInfo.searchPDFContent(message);
  if (pdfResults.length > 0) {
    type = 'pdf_info';
    title = 'Information';
    // Format the PDF content for better readability
    text = pdfResults[0]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
    
    // Generate context-aware suggestions based on the PDF content
    const pdfSuggestions = [
      "Would you like to know more about this topic?",
      "Would you like to see related information?",
      "Would you like to explore other aspects of this subject?"
    ];
    
    options = pdfSuggestions;
    structured = { type, title, text, options };
    conversationContext.set(userId, context);
    return structured;
  }

  // Check knowledge base for common questions
  const lowerMessage = message.toLowerCase();
  for (const category of ['general', 'menu', 'policies']) {
    const faqResult = knowledgeBase.getFAQAnswer(category, message);
    if (faqResult) {
      type = 'faq';
      title = 'FAQ';
      text = faqResult.answer;
      options = faqResult.suggestions;
      structured = { type, title, text, options };
      conversationContext.set(userId, context);
      return structured;
    }
  }

  // Menu item lookup with detailed information
  const menuItem = menuHelpers.findMenuItemByName(message);
  if (menuItem) {
    // Find the item in our knowledge base
    let itemDetails = null;
    for (const category of ['hotDrinks', 'coldDrinks', 'food']) {
      const details = knowledgeBase.getItemDetails(category, menuItem.toLowerCase());
      if (details) {
        itemDetails = details;
        break;
      }
    }

    if (itemDetails) {
      type = 'menu_item';
      title = menuItem;
      text = `${itemDetails.description}\n\nPrice: ${typeof itemDetails.price === 'object' ? 
        Object.entries(itemDetails.price).map(([size, price]) => `${size}: $${price}`).join(', ') : 
        `$${itemDetails.price}`}\n\nCustomizations: ${itemDetails.customizations?.join(', ') || 'Available'}\n\nPopular Pairings: ${itemDetails.popularPairings?.join(', ') || 'Available'}`;
      options = itemDetails.suggestions;
    } else {
      type = 'menu_item';
      title = 'Menu Item';
      text = `Yes, we have ${menuItem} on our menu! Would you like to add it to your order?`;
      options = ["Add to Order", "Show Menu", "Order Something Else"];
    }
    structured = { type, title, text, options };
    conversationContext.set(userId, context);
    return structured;
  }

  // Order flow
  if (context.ordering) {
    if (menuItem) {
      order = orderHelpers.addItemToOrder(order, menuItem, 1);
      userOrders.set(userId, order);
      type = 'order_update';
      title = 'Order Updated';
      text = `Added ${menuItem} to your order.`;
      orderSummary = orderHelpers.formatOrderSummary(order);
    } else if (/checkout|pay|complete/i.test(message)) {
      type = 'order_checkout';
      title = 'Checkout';
      text = "Ready to checkout! Here's your order summary:";
      orderSummary = orderHelpers.formatOrderSummary(order);
      context.ordering = false;
    } else if (/cancel/i.test(message)) {
      userOrders.delete(userId);
      type = 'order_cancel';
      title = 'Order Cancelled';
      text = "Your order has been cancelled.";
      context.ordering = false;
    } else {
      type = 'order_prompt';
      title = 'Add to Order';
      text = "What would you like to add to your order? You can say the name of any menu item.";
    }
    options = generateQuickReplies(type, context);
    structured = { type, title, text, orderSummary, options };
    conversationContext.set(userId, context);
    return structured;
  }

  // Intent-based logic
  if (intent) {
    switch (intent.tag) {
      case 'greeting':
        type = 'intro';
        title = 'Welcome!';
        text = "Hi! I'm Hazel, your virtual barista ☕ How can I help you today?";
        break;
      case 'menu':
        type = 'menu';
        title = 'Menu';
        text = "Here's our menu:";
        menu = menuHelpers.formatMenuResponse();
        // Get dynamic suggestions from LLM
        const menuSuggestions = await callOpenRouterLLMSuggestions(
          "menu",
          context,
          menu
        );
        options = menuSuggestions.length > 0 ? menuSuggestions : [
          "Order Drinks",
          "Order Snacks",
          "View Hot Drinks",
          "View Cold Drinks",
          "View Food",
          "Browse Full Menu (DoorDash)"
        ];
        break;
      case 'order':
      case 'start_order':
        context.ordering = true;
        order = { id: orderHelpers.generateOrderId(), items: [] };
        userOrders.set(userId, order);
        type = 'order_start';
        title = 'Start Order';
        text = "Great! Let's start your order. What would you like to add?";
        break;
      case 'view_order':
        type = 'order_view';
        title = 'Order Summary';
        text = "Here's your current order:";
        orderSummary = orderHelpers.formatOrderSummary(order);
        break;
      case 'signature_drinks':
        type = 'signature_drinks';
        title = 'Signature Drinks';
        text = "Our signature drinks are: Latte, Cappuccino, Iced Coffee, Frappuccino.";
        break;
      case 'events':
        type = 'events';
        title = 'Upcoming Events';
        text = "🎵 Upcoming Events: - Live Music: Friday 7-9 PM (Jazz Night) - Poetry Night: Saturday 6-8 PM - Community Meetup: Sunday 2-4 PM";
        break;
      case 'location':
        type = 'location';
        title = 'Location';
        text = "We're located at 2801 Frederick Douglass Boulevard, New York, NY 10039";
        links = [
          { label: 'Google Maps', url: 'https://maps.google.com/?q=2801+Frederick+Douglass+Boulevard+New+York+NY+10039' },
          { label: 'Call', url: 'tel:9172616996' }
        ];
        break;
      case 'contact':
        type = 'contact';
        title = 'Contact Us';
        text = "Call Us: (917) 261-6996\nEmail: feedback@commongoodharlem.org\nVisit: 2801 Frederick Douglass Boulevard, New York, NY 10039";
        links = [
          { label: 'Call', url: 'tel:9172616996' },
          { label: 'Email', url: 'mailto:feedback@commongoodharlem.org' }
        ];
        break;
      case 'parking':
        type = 'parking';
        title = 'Parking Information';
        text = "Street parking available on Frederick Douglass Blvd. Metered parking: $2.50/hour. Free parking on Sundays. Nearby garage: 125th St Garage (2 blocks away).";
        break;
      case 'recommendations':
        type = 'recommendation';
        title = 'Recommendations';
        const recs = recommendItems(context);
        text = `Based on your preferences and the time of day, here are some suggestions: ${recs.join(', ')}`;
        options = recs;
        break;
      case 'hours':
        type = 'hours';
        title = 'Hours';
        text = "Here are our hours! 🕒\nMonday: 7:30am - 7:00pm\nTuesday - Wednesday: 7:30am - 6:00pm\nThursday: 7:30am - 7:00pm\nFriday: 7:30am - 10:00pm\nSaturday: 8:30am - 7:00pm\nSunday: 9:00am - 4:00pm\nWe're closed on major holidays.";
        break;
      case 'reservation':
        type = 'reservation';
        title = 'Reservation Info';
        text = "We accept walk-ins only, but I can help you find the best time to visit! 🪑 Our busiest hours are: - Weekday mornings: 8-10 AM - Weekend afternoons: 2-4 PM";
        break;
      default:
        type = 'text';
        title = intent.tag.charAt(0).toUpperCase() + intent.tag.slice(1);
        text = intent.responses[Math.floor(Math.random() * intent.responses.length)];
    }
    options = generateQuickReplies(type, context, intent ? intent.tag : undefined);
    structured = { type, title, text, menu, orderSummary, links, options };
    conversationContext.set(userId, context);
    return structured;
  }

  // LLM/AI fallback
  const llmText = await callOpenRouterLLM(message, context);
  let llmSuggestions = await callOpenRouterLLMSuggestions(message, context, llmText);
  type = 'llm';
  title = 'AI Assistant';
  text = llmText;
  options = Array.isArray(llmSuggestions) && llmSuggestions.length > 0 ? llmSuggestions : generateQuickReplies(type, context);
  structured = { type, title, text, options };
  conversationContext.set(userId, context);
  return structured;
}

module.exports = { getChatResponse }; 