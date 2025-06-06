const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const fs = require('fs');
const knowledgeBase = JSON.parse(fs.readFileSync('./knowledgeBase.json', 'utf-8'));
const axios = require('axios');

// Replace with your actual Together AI API key
const TOGETHER_API_KEY = '4af5515c91d95599a7ccb9b81ec3d260933a9c53d3a7be1426ab4625befda622';

// Middleware
app.use(cors());
app.use(express.json());

// Data structures for table management
const tableQueue = new Map();
const activeTables = new Map();
const customerInfo = new Map();
const conversationContext = new Map();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:3000'  // In production, only allow requests from the same origin
    : '*',                     // In development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// API routes
app.use('/api', (req, res, next) => {
  // Log API requests in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Use intents from knowledge base
const intents = knowledgeBase.intents;

// Training data structure
let trainingData = {
  intents: [
    {
      tag: "greeting",
      patterns: ["hi", "hello", "hey", "good morning", "good afternoon"],
      responses: ["Hi there! 👋 I'm HazelBot — your virtual barista at Common Good Harlem. Here to help you with drinks, events, or anything else. What would you like to do?"]
    },
    {
      tag: "location",
      patterns: ["where are you", "location", "address", "directions", "how to get there", "nearest location", "find you", "get directions", "your address"],
      responses: [
        "We're located at 2801 Frederick Douglass Boulevard, New York, NY 10039 📍\n\nYou can find us on Google Maps: https://maps.google.com/?q=2801+Frederick+Douglass+Boulevard+New+York+NY+10039\n\nNeed to call? Just tap: (917) 261-6996\n\nWe're easily accessible by:\n- Subway: A, B, C, D trains to 125th St\n- Bus: M2, M3, M4, M10 to 125th St\n- Parking available nearby"
      ]
    },
    {
      tag: "hours",
      patterns: ["hours", "open", "close", "schedule", "what time", "when do you open", "when do you close", "opening hours", "closing hours", "what are your hours"],
      responses: [
        "Here are our hours! 🕒\n\nMonday: 7:30am - 7:00pm\nTuesday - Wednesday: 7:30am - 6:00pm\nThursday: 7:30am - 7:00pm\nFriday: 7:30am - 10:00pm\nSaturday: 8:30am - 7:00pm\nSunday: 9:00am - 4:00pm\n\nWe're closed on major holidays. Need specific holiday hours?"
      ]
    },
    {
      tag: "menu",
      patterns: ["menu", "drinks", "food", "what do you serve", "coffee", "latte", "cappuccino", "show menu", "menu options", "what can i order", "food menu", "drink menu"],
      responses: [
        "Certainly! Here are some popular options to help you decide:\n\nOrder Drinks or Snacks\n\n☕ Drinks:\n- Hot Coffee, Lattes, Cappuccinos, Matcha ($3.50 - $6.50)\n- Iced Coffee, Cold Brew ($4.00 - $5.50)\n\n🍪 Snacks:\n- Croissants, Avocado Toast, Breakfast Sandwich ($3.50 - $8.00)\n\nFor our complete menu with all options and special items, visit our DoorDash page: https://www.doordash.com/store/common-good-harlem-new-york-24627565/58781546/\n\nReady to start an order or want to know more about a specific item?"
      ]
    },
    {
      tag: "events",
      patterns: ["events", "music", "live", "performances", "what's happening", "calendar", "event info", "upcoming events", "show events", "events happening"],
      responses: [
        "Absolutely! We have some exciting events coming up:\n\n🎵 Upcoming Events:\n- Live Music: Friday 7-9 PM (Jazz Night)\n- Poetry Night: Saturday 6-8 PM\n- Community Meetup: Sunday 2-4 PM\n\nWant to know more or Register for an event?"
      ]
    },
    {
      tag: "reservation",
      patterns: ["reserve", "reservation", "book", "table", "seating"],
      responses: [
        "We accept walk-ins only, but I can help you find the best time to visit! 🪑\n\nOur busiest hours are:\n- Weekday mornings: 8-10 AM\n- Weekend afternoons: 2-4 PM\n\nWould you like to know more about our seating options?"
      ]
    },
    {
      tag: "volunteer",
      patterns: ["volunteer", "help", "community", "give back", "get involved", "volunteer opportunities", "join community", "how to volunteer", "volunteer information", "community involvement"],
      responses: [
        "That's wonderful! Joining our community is a great way to get involved.\n\n💖 Volunteer or Join Our Community:\n- Become a Volunteer: [Link to Volunteer Form Placeholder]\n- Join our Community: [Link to Community Page Placeholder]\n- Connect on WhatsApp: [Link to WhatsApp Group Placeholder]\n\nWe'd love to have you!"
      ]
    },
    {
      tag: "feedback",
      patterns: ["feedback", "complaint", "suggestion", "review", "issue", "problem", "contact", "contact us", "get in touch", "give feedback", "report issue", "speak to someone"],
      responses: [
        "Need to get in touch? Here's how:\n\n📞 Contact Us:\n- Call Us: (917) 261-6996\n- Email Us: feedback@commongoodharlem.org\n- Visit Us: 2801 Frederick Douglass Boulevard, New York, NY 10039\n\nWe're here to help!"
      ]
    },
    {
      tag: "wifi",
      patterns: ["wifi", "internet", "password", "wi-fi", "wireless", "network"],
      responses: [
        "We offer free Wi-Fi for all customers! 📶\n\nNetwork: CommonGood_Guest\nPassword: HarlemCoffee2024\n\nPlease note: Wi-Fi is available during business hours only."
      ]
    },
    {
      tag: "parking",
      patterns: ["parking", "park", "car", "where to park", "parking available"],
      responses: [
        "Parking Information 🚗\n\n- Street parking available on Frederick Douglass Blvd\n- Metered parking: $2.50/hour\n- Free parking on Sundays\n- Nearby parking garage: 125th St Garage (2 blocks away)\n\nNeed directions to the parking garage?"
      ]
    },
    {
      tag: "pets",
      patterns: ["pets", "dogs", "animals", "pet friendly", "bring dog", "service animal"],
      responses: [
        "Pet Policy 🐕\n\n- Service animals are always welcome\n- Well-behaved pets are allowed in our outdoor seating area\n- Please keep pets on a leash\n- Water bowls available upon request\n\nWould you like to know about our outdoor seating options?"
      ]
    },
    {
      tag: "seating",
      patterns: ["seating", "tables", "chairs", "outdoor", "indoor", "sit", "seats"],
      responses: [
        "Seating Options 🪑\n\nIndoor:\n- 12 tables (2-4 people)\n- 4 bar seats\n- 2 lounge areas\n\nOutdoor:\n- 8 tables (2-4 people)\n- Umbrella seating available\n- Pet-friendly area\n\nAll seating is first-come, first-served. Need to know our busiest times?"
      ]
    },
    {
      tag: "specials",
      patterns: ["specials", "deals", "promotions", "discounts", "happy hour", "offers"],
      responses: [
        "Current Specials & Offers 🎉\n\nDaily:\n- Happy Hour: 3-5 PM (20% off all drinks)\n- Student Discount: 10% off with valid ID\n- Bring Your Own Cup: $1 off any drink\n\nWeekly:\n- Monday: Buy 1 Get 1 Free Pastries\n- Wednesday: 50% off Cold Brew\n- Friday: Live Music Night (Free entry)\n\nWould you like to know more about any of these offers?"
      ]
    },
    {
      tag: "seasonal",
      patterns: ["seasonal", "limited", "special drinks", "holiday", "pumpkin", "peppermint"],
      responses: [
        "Seasonal Offerings 🌟\n\nCurrent Seasonal Drinks:\n- Pumpkin Spice Latte ($5.50)\n- Maple Pecan Latte ($5.50)\n- Apple Cider ($4.50)\n\nLimited Time Food:\n- Pumpkin Bread ($4.00)\n- Apple Cinnamon Muffin ($4.00)\n\nThese items are available while supplies last. Would you like to know more about any of these?"
      ]
    },
    {
      tag: "catering",
      patterns: ["catering", "cater", "large order", "group", "party", "event"],
      responses: [
        "Catering Services 🎉\n\nWe offer catering for:\n- Corporate meetings\n- Private parties\n- Community events\n\nOptions include:\n- Coffee & Pastry packages\n- Full breakfast/lunch spreads\n- Custom menu creation\n\nMinimum order: 10 people\nAdvance notice: 48 hours\n\nWould you like to request a catering quote?"
      ]
    },
    {
      tag: "order_status",
      patterns: ["order status", "where is my order", "is my order ready", "order number", "track order", "check order", "my order status"],
      responses: [
        "I can help you check your order status! 📱\n\nPlease provide your order number, and I'll look it up for you.\n\nYou can also check your order status at any time by saying 'check order' followed by your order number."
      ]
    },
    {
      tag: "payment",
      patterns: ["payment", "pay", "checkout", "credit card", "cash", "apple pay", "venmo"],
      responses: [
        "Payment Options 💳\n\nWe accept:\n- Credit/Debit Cards\n- Apple Pay\n- Google Pay\n- Cash\n- Venmo\n\nAll prices include tax. Would you like to proceed with payment?"
      ]
    },
    {
      tag: "delivery",
      patterns: ["delivery", "deliver", "bring to me", "door dash", "uber eats"],
      responses: [
        "Delivery Options 🚚\n\nWe partner with:\n- DoorDash\n- Uber Eats\n\nDelivery times:\n- 15-30 minutes within 2 miles\n- 30-45 minutes within 5 miles\n\nWould you like to place a delivery order?"
      ]
    }
  ],
  context: {
    currentIntent: null,
    previousMessages: [],
    userPreferences: {}
  }
};

// Menu data structure
const menuData = {
  categories: {
    hotDrinks: {
      name: "Hot Drinks",
      items: [
        { 
          id: "espresso", 
          name: "Espresso", 
          basePrice: 3.50, 
          description: "Single shot of espresso",
          sizes: [
            { name: "Single", price: 3.50 },
            { name: "Double", price: 4.50 }
          ],
          allergens: ["milk"],
          customization: {
            extraShots: { price: 1.00 },
            milk: [
              { name: "Whole", price: 0 },
              { name: "Skim", price: 0 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            temperature: [
              { name: "Extra Hot", price: 0 },
              { name: "Regular", price: 0 },
              { name: "Warm", price: 0 }
            ],
            sweeteners: [
              { name: "Sugar", price: 0 },
              { name: "Honey", price: 0.50 },
              { name: "Stevia", price: 0.50 },
              { name: "Splenda", price: 0.50 }
            ]
          }
        },
        { 
          id: "latte", 
          name: "Latte", 
          basePrice: 4.50, 
          description: "Espresso with steamed milk",
          sizes: [
            { name: "Small (12oz)", price: 4.50 },
            { name: "Medium (16oz)", price: 5.50 },
            { name: "Large (20oz)", price: 6.50 }
          ],
          allergens: ["milk"],
          customization: {
            extraShots: { price: 1.00 },
            milk: [
              { name: "Whole", price: 0 },
              { name: "Skim", price: 0 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            flavors: [
              { name: "Vanilla", price: 0.75 },
              { name: "Caramel", price: 0.75 },
              { name: "Hazelnut", price: 0.75 },
              { name: "Mocha", price: 0.75 },
              { name: "Pumpkin Spice", price: 0.75 },
              { name: "Peppermint", price: 0.75 }
            ],
            temperature: [
              { name: "Extra Hot", price: 0 },
              { name: "Regular", price: 0 },
              { name: "Warm", price: 0 }
            ],
            sweeteners: [
              { name: "Sugar", price: 0 },
              { name: "Honey", price: 0.50 },
              { name: "Stevia", price: 0.50 },
              { name: "Splenda", price: 0.50 }
            ],
            toppings: [
              { name: "Whipped Cream", price: 0.50 },
              { name: "Cinnamon", price: 0 },
              { name: "Chocolate Powder", price: 0 },
              { name: "Caramel Drizzle", price: 0.75 }
            ]
          }
        },
        { 
          id: "cappuccino", 
          name: "Cappuccino", 
          basePrice: 4.00, 
          description: "Espresso with steamed milk and foam",
          sizes: [
            { name: "Small (12oz)", price: 4.00 },
            { name: "Medium (16oz)", price: 5.00 },
            { name: "Large (20oz)", price: 6.00 }
          ],
          allergens: ["milk"],
          customization: {
            extraShots: { price: 1.00 },
            milk: [
              { name: "Whole", price: 0 },
              { name: "Skim", price: 0 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ]
          }
        },
        { 
          id: "matcha", 
          name: "Matcha Latte", 
          basePrice: 5.00, 
          description: "Green tea powder with steamed milk",
          sizes: [
            { name: "Small (12oz)", price: 5.00 },
            { name: "Medium (16oz)", price: 6.00 },
            { name: "Large (20oz)", price: 7.00 }
          ],
          allergens: ["milk"],
          customization: {
            milk: [
              { name: "Whole", price: 0 },
              { name: "Skim", price: 0 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            sweetness: [
              { name: "Regular", price: 0 },
              { name: "Less Sweet", price: 0 },
              { name: "No Sweet", price: 0 }
            ]
          }
        }
      ]
    },
    coldDrinks: {
      name: "Cold Drinks",
      items: [
        { 
          id: "iced-coffee", 
          name: "Iced Coffee", 
          basePrice: 4.00, 
          description: "Chilled coffee over ice",
          sizes: [
            { name: "Medium (16oz)", price: 4.00 },
            { name: "Large (24oz)", price: 5.00 }
          ],
          allergens: [],
          customization: {
            milk: [
              { name: "None", price: 0 },
              { name: "Whole", price: 0.50 },
              { name: "Skim", price: 0.50 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            flavors: [
              { name: "Vanilla", price: 0.75 },
              { name: "Caramel", price: 0.75 },
              { name: "Hazelnut", price: 0.75 }
            ]
          }
        },
        { 
          id: "iced-latte", 
          name: "Iced Latte", 
          basePrice: 4.50, 
          description: "Espresso with cold milk over ice",
          sizes: [
            { name: "Medium (16oz)", price: 4.50 },
            { name: "Large (24oz)", price: 5.50 }
          ],
          allergens: ["milk"],
          customization: {
            extraShots: { price: 1.00 },
            milk: [
              { name: "Whole", price: 0 },
              { name: "Skim", price: 0 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            flavors: [
              { name: "Vanilla", price: 0.75 },
              { name: "Caramel", price: 0.75 },
              { name: "Hazelnut", price: 0.75 },
              { name: "Mocha", price: 0.75 }
            ]
          }
        },
        { 
          id: "cold-brew", 
          name: "Cold Brew", 
          basePrice: 4.50, 
          description: "Slow-steeped coffee",
          sizes: [
            { name: "Medium (16oz)", price: 4.50 },
            { name: "Large (24oz)", price: 5.50 }
          ],
          allergens: [],
          customization: {
            milk: [
              { name: "None", price: 0 },
              { name: "Whole", price: 0.50 },
              { name: "Skim", price: 0.50 },
              { name: "Oat", price: 0.75 },
              { name: "Almond", price: 0.75 },
              { name: "Soy", price: 0.75 }
            ],
            flavors: [
              { name: "Vanilla", price: 0.75 },
              { name: "Caramel", price: 0.75 },
              { name: "Hazelnut", price: 0.75 }
            ]
          }
        }
      ]
    },
    food: {
      name: "Food",
      items: [
        { 
          id: "croissant", 
          name: "Croissant", 
          basePrice: 3.50, 
          description: "Buttery, flaky pastry",
          allergens: ["wheat", "milk", "eggs"],
          customization: {
            types: [
              { name: "Plain", price: 3.50 },
              { name: "Chocolate", price: 4.00 },
              { name: "Almond", price: 4.50 }
            ]
          }
        },
        { 
          id: "avocado-toast", 
          name: "Avocado Toast", 
          basePrice: 8.00, 
          description: "Smashed avocado on sourdough",
          allergens: ["wheat", "milk"],
          customization: {
            addons: [
              { name: "Egg", price: 2.00 },
              { name: "Smoked Salmon", price: 3.00 },
              { name: "Feta Cheese", price: 1.50 }
            ]
          }
        },
        { 
          id: "breakfast-sandwich", 
          name: "Breakfast Sandwich", 
          basePrice: 7.00, 
          description: "Egg, cheese, and choice of meat",
          allergens: ["wheat", "milk", "eggs"],
          customization: {
            meat: [
              { name: "Bacon", price: 0 },
              { name: "Sausage", price: 0 },
              { name: "Ham", price: 0 }
            ],
            cheese: [
              { name: "Cheddar", price: 0 },
              { name: "Swiss", price: 0 },
              { name: "No Cheese", price: 0 }
            ]
          }
        }
      ]
    }
  }
};

// Order status tracking
const orderStatuses = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const activeOrders = new Map();

function updateOrderStatus(orderId, status) {
  if (activeOrders.has(orderId)) {
    const order = activeOrders.get(orderId);
    order.status = status;
    order.lastUpdated = new Date();
    activeOrders.set(orderId, order);
    return true;
  }
  return false;
}

function getOrderStatus(orderId) {
  return activeOrders.get(orderId);
}

// Personalized recommendations system
const userPreferences = new Map();

function updateUserPreferences(userId, preferences) {
  userPreferences.set(userId, {
    ...userPreferences.get(userId),
    ...preferences,
    lastUpdated: new Date()
  });
}

function getPersonalizedRecommendations(userId) {
  const preferences = userPreferences.get(userId);
  const recommendations = [];
  
  // Time-based recommendations
  const hour = new Date().getHours();
  if (hour < 11) {
    recommendations.push({
      type: 'breakfast',
      items: ['Breakfast Sandwich', 'Avocado Toast', 'Croissant'],
      message: 'Good morning! How about starting your day with one of our breakfast items?'
    });
  } else if (hour >= 11 && hour < 15) {
    recommendations.push({
      type: 'lunch',
      items: ['Avocado Toast', 'Breakfast Sandwich'],
      message: 'Lunch time! Try one of our popular lunch items.'
    });
  } else {
    recommendations.push({
      type: 'afternoon',
      items: ['Cold Brew', 'Iced Latte', 'Croissant'],
      message: 'Looking for a pick-me-up? Try one of our refreshing afternoon options!'
    });
  }

  // Add popular items if no preferences exist
  if (!preferences || !preferences.favoriteDrinks) {
    recommendations.push({
      type: 'popular',
      items: ['Latte', 'Avocado Toast', 'Cold Brew'],
      message: 'Our most popular items are always a great choice!'
    });
  } else {
    // Preference-based recommendations
    recommendations.push({
      type: 'favorites',
      items: preferences.favoriteDrinks,
      message: 'Based on your favorites, you might enjoy these items!'
    });
  }

  // Seasonal recommendations
  const month = new Date().getMonth();
  if (month >= 8 && month <= 10) { // September to November
    recommendations.push({
      type: 'seasonal',
      items: ['Pumpkin Spice Latte', 'Maple Pecan Latte'],
      message: 'Try our seasonal fall favorites!'
    });
  }

  return recommendations;
}

// Enhanced order flow
function startOrder(userId) {
  const orderId = generateOrderId();
  const order = {
    id: orderId,
    userId: userId,
    items: [],
    status: orderStatuses.PENDING,
    createdAt: new Date(),
    lastUpdated: new Date(),
    total: 0,
    customization: {}
  };
  activeOrders.set(orderId, order);
  return orderId;
}

function addItemToOrder(orderId, item, customization = {}) {
  if (!activeOrders.has(orderId)) return false;
  
  const order = activeOrders.get(orderId);
  const customizedItem = {
    ...item,
    customization,
    price: calculateItemPrice(item, customization)
  };
  
  order.items.push(customizedItem);
  order.total = calculateOrderTotal(order.items);
  order.lastUpdated = new Date();
  
  activeOrders.set(orderId, order);
  return true;
}

function calculateItemPrice(item, customization) {
  let price = item.basePrice;
  
  // Add customization costs
  if (customization.size) {
    const sizeOption = item.sizes.find(s => s.name === customization.size);
    if (sizeOption) price = sizeOption.price;
  }
  
  if (customization.extraShots) {
    price += item.customization.extraShots.price * customization.extraShots;
  }
  
  if (customization.milk) {
    const milkOption = item.customization.milk.find(m => m.name === customization.milk);
    if (milkOption) price += milkOption.price;
  }
  
  if (customization.flavors) {
    customization.flavors.forEach(flavor => {
      const flavorOption = item.customization.flavors.find(f => f.name === flavor);
      if (flavorOption) price += flavorOption.price;
    });
  }
  
  if (customization.toppings) {
    customization.toppings.forEach(topping => {
      const toppingOption = item.customization.toppings.find(t => t.name === topping);
      if (toppingOption) price += toppingOption.price;
    });
  }
  
  return price;
}

// Add new intent for personalized recommendations
trainingData.intents.push({
  tag: "recommendations",
  patterns: [
    "recommend", "suggest", "what should I get", "what's good", "what's popular", 
    "recommend something", "suggestions", "recommendations", "what do you recommend",
    "what would you recommend", "what do you suggest", "what would you suggest",
    "what's your recommendation", "what's your suggestion", "what's good here",
    "what's popular here", "what should I try", "what do you recommend trying"
  ],
  responses: [
    "I'd be happy to recommend something! 🎯\n\nBased on your preferences and the time of day, here are some suggestions:\n\n{recommendations}\n\nWould you like to know more about any of these items?"
  ]
});

// Add new intent for order status
trainingData.intents.push({
  tag: "order_status",
  patterns: ["order status", "where is my order", "is my order ready", "order number", "track order", "check order", "my order status"],
  responses: [
    "I can help you check your order status! 📱\n\n{order_status}\n\nWould you like to know more about your order?"
  ]
});

// Table configuration
const tableConfig = {
  small: { size: 2, count: 8 },  // 8 tables for 2 people
  medium: { size: 4, count: 6 }, // 6 tables for 4 people
  large: { size: 6, count: 4 }   // 4 tables for 6 people
};

// Initialize tables
function initializeTables() {
  let tableId = 1;
  for (let size in tableConfig) {
    for (let i = 0; i < tableConfig[size].count; i++) {
      tableQueue.set(tableId, {
        id: tableId,
        size: tableConfig[size].size,
        status: 'available',
        currentOrder: [],
        customerInfo: null,
        startTime: null
      });
      tableId++;
    }
  }
}

// Initialize tables on server start
initializeTables();

// Function to find available table
function findAvailableTable(partySize) {
  let suitableTables = [];
  for (let [id, table] of tableQueue) {
    if (table.status === 'available' && table.size >= partySize) {
      suitableTables.push(table);
    }
  }
  return suitableTables.length > 0 ? suitableTables[0] : null;
}

// Add new intents for dining experience
trainingData.intents.push(
  {
    tag: "dining_greeting",
    patterns: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
    responses: [
      "Welcome to Common Good Harlem! 👋 I'm your virtual waiter. Would you like to dine in or order to go?",
      "Hello! Welcome to Common Good Harlem! 👋 I'll be your virtual waiter today. Are you dining in or ordering to go?"
    ]
  },
  {
    tag: "dining_in",
    patterns: ["dine in", "sit down", "table", "eat here", "dining"],
    responses: [
      "Great choice! How many people are in your party today?",
      "Perfect! I'll help you get seated. How many guests will be joining us?"
    ]
  },
  {
    tag: "party_size",
    patterns: ["2 people", "2 persons", "2 guests", "2 of us", "just 2", "two"],
    responses: [
      "Perfect! Let me check our available tables for 2. Would you prefer indoor or outdoor seating?"
    ]
  },
  {
    tag: "wait_time",
    patterns: ["how long", "wait time", "waiting time", "queue", "line"],
    responses: [
      "Let me check our current wait times. For a party of {partySize}, the estimated wait is {waitTime} minutes. Would you like to join the waitlist? I can take your name and number to notify you when your table is ready."
    ]
  },
  {
    tag: "table_ready",
    patterns: ["table ready", "seated", "sit down", "take order"],
    responses: [
      "Welcome to your table! 🪑 I'm your virtual waiter. Would you like to start with some drinks? We have:\n\n- Water (still or sparkling)\n- Coffee\n- Tea\n- Fresh juices\n\nOr would you like to see our full menu?"
    ]
  },
  {
    tag: "start_order",
    patterns: ["ready to order", "take order", "order food", "what do you have"],
    responses: [
      "I'll help you with your order. We have several categories:\n\n1. Appetizers\n2. Main Courses\n3. Sides\n4. Desserts\n5. Drinks\n\nWhich category would you like to see first?"
    ]
  },
  {
    tag: "appetizers",
    patterns: ["appetizers", "starters", "begin with", "first course"],
    responses: [
      "Here are our appetizers:\n\n- Avocado Toast ($8.00)\n- House Salad ($7.00)\n- Soup of the Day ($6.00)\n- Charcuterie Board ($12.00)\n\nWould you like to try any of these? Or shall we move on to main courses?"
    ]
  },
  {
    tag: "main_courses",
    patterns: ["main course", "entrees", "main dish", "main meal"],
    responses: [
      "Our main courses include:\n\n- Breakfast Sandwich ($7.00)\n- Avocado Toast ($8.00)\n- Quiche of the Day ($9.00)\n- Breakfast Burrito ($10.00)\n\nWould you like to know more about any of these dishes?"
    ]
  },
  {
    tag: "drinks",
    patterns: ["drinks", "beverages", "something to drink", "coffee", "tea"],
    responses: [
      "Here are our drink options:\n\nHot Drinks:\n- Coffee ($3.50)\n- Latte ($4.50)\n- Cappuccino ($4.00)\n- Tea ($3.00)\n\nCold Drinks:\n- Iced Coffee ($4.00)\n- Fresh Juice ($5.00)\n- Sparkling Water ($3.00)\n\nWhat would you like to try?"
    ]
  },
  {
    tag: "add_to_order",
    patterns: ["add", "order", "get", "want", "would like"],
    responses: [
      "I'll add {item} to your order. Would you like to add anything else? Your current total is ${total}."
    ]
  },
  {
    tag: "check_total",
    patterns: ["total", "bill", "check", "how much", "amount"],
    responses: [
      "Your current total is ${total}. Here's the breakdown:\n\n{orderDetails}\n\nWould you like to add anything else before I prepare your final bill?"
    ]
  },
  {
    tag: "payment_info",
    patterns: ["pay", "payment", "checkout", "bill", "cash", "card"],
    responses: [
      "Your total is ${total}. You can pay at the counter. We accept:\n- Credit/Debit Cards\n- Cash\n- Apple Pay\n- Google Pay\n\nWould you like to leave a tip? The standard is 15-20%."
    ]
  },
  {
    tag: "feedback_request",
    patterns: ["feedback", "review", "experience", "how was it"],
    responses: [
      "Thank you for dining with us! How was your experience today? You can:\n\n1. Rate us on Google/Yelp\n2. Fill out our feedback form\n3. Share your thoughts with our manager\n\nYour feedback helps us improve!"
    ]
  }
);

// Function to generate order ID
function generateOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function findMenuItemById(itemId) {
  for (const categoryKey in menuData.categories) {
    const category = menuData.categories[categoryKey];
    const found = category.items.find(item => item.id === itemId);
    if (found) return found;
  }
  return null;
}

function calculateOrderTotal(items) {
  let total = 0;
  items.forEach(orderItem => {
    const menuItem = findMenuItemById(orderItem.id);
    if (!menuItem) return;
    let itemPrice = menuItem.basePrice;
    // Handle size
    if (orderItem.customization && orderItem.customization.size && menuItem.sizes) {
      const sizeObj = menuItem.sizes.find(s => s.name === orderItem.customization.size);
      if (sizeObj) itemPrice = sizeObj.price;
    }
    // Handle extraShots
    if (orderItem.customization && orderItem.customization.extraShots && menuItem.customization && menuItem.customization.extraShots) {
      itemPrice += menuItem.customization.extraShots.price * orderItem.customization.extraShots;
    }
    // Handle milk
    if (orderItem.customization && orderItem.customization.milk && menuItem.customization && menuItem.customization.milk) {
      const milkObj = menuItem.customization.milk.find(m => m.name === orderItem.customization.milk);
      if (milkObj) itemPrice += milkObj.price;
    }
    // Handle flavors
    if (orderItem.customization && orderItem.customization.flavors && menuItem.customization && menuItem.customization.flavors) {
      orderItem.customization.flavors.forEach(flavor => {
        const flavorObj = menuItem.customization.flavors.find(f => f.name === flavor);
        if (flavorObj) itemPrice += flavorObj.price;
      });
    }
    // Handle toppings
    if (orderItem.customization && orderItem.customization.toppings && menuItem.customization && menuItem.customization.toppings) {
      orderItem.customization.toppings.forEach(topping => {
        const toppingObj = menuItem.customization.toppings.find(t => t.name === topping);
        if (toppingObj) itemPrice += toppingObj.price;
      });
    }
    // Handle addons (for food)
    if (orderItem.customization && orderItem.customization.addons && menuItem.customization && menuItem.customization.addons) {
      orderItem.customization.addons.forEach(addon => {
        const addonObj = menuItem.customization.addons.find(a => a.name === addon);
        if (addonObj) itemPrice += addonObj.price;
      });
    }
    // Handle types (for croissant)
    if (orderItem.customization && orderItem.customization.type && menuItem.customization && menuItem.customization.types) {
      const typeObj = menuItem.customization.types.find(t => t.name === orderItem.customization.type);
      if (typeObj) itemPrice = typeObj.price;
    }
    // Handle meat/cheese (for breakfast sandwich)
    // (No price change, but could be added if needed)
    total += itemPrice;
  });
  return total;
}

// Function to find the best matching intent using the knowledge base
function findBestIntent(message) {
  let bestMatch = { tag: null, score: 0 };
  const words = message.toLowerCase().split(' ');

  intents.forEach(intent => {
    let score = 0;
    intent.patterns.forEach(pattern => {
      const patternWords = pattern.toLowerCase().split(' ');
      patternWords.forEach(word => {
        if (words.includes(word)) {
          score += 1;
        }
      });
    });
    if (score > bestMatch.score) {
      bestMatch = { tag: intent.tag, score };
    }
  });
  return bestMatch.score > 0 ? bestMatch.tag : null;
}

function getFollowUpQuestions(context, intent) {
  const followUps = {
    menu: [
      "Would you like to know more about our seasonal specials?",
      "Have you tried our signature drinks?",
      "Would you like to see our food menu as well?"
    ],
    hours: [
      "Would you like to know about our holiday hours?",
      "Should I tell you about our busiest times?",
      "Would you like to make a reservation?"
    ],
    events: [
      "Would you like to register for any of these events?",
      "Should I tell you about our regular weekly events?",
      "Would you like to know about our community meetups?"
    ],
    default: [
      "Is there anything else you'd like to know?",
      "Would you like to see our menu?",
      "Should I tell you about our upcoming events?"
    ]
  };

  // Get user preferences from context
  const preferences = context.preferences || {};
  
  // Add personalized follow-ups based on preferences
  if (preferences.favoriteDrinks) {
    followUps.menu.push(`Would you like to try something similar to your favorite ${preferences.favoriteDrinks[0]}?`);
  }
  
  if (preferences.visitFrequency) {
    followUps.default.push(`Since you visit ${preferences.visitFrequency}, would you like to know about our loyalty program?`);
  }

  return followUps[intent] || followUps.default;
}

function updateContext(userId, message, intent) {
  if (!conversationContext.has(userId)) {
    conversationContext.set(userId, {
      messages: [],
      currentIntent: null,
      preferences: {},
      lastInteraction: new Date(),
      fallbackCount: 0,
      conversationHistory: [],
      lastFollowUp: null
    });
  }
  
  const context = conversationContext.get(userId);
  
  // Add message to history
  context.messages.push({
    message,
    intent,
    timestamp: new Date()
  });
  
  // Keep only last 10 messages
  if (context.messages.length > 10) {
    context.messages.shift();
  }
  
  // Update conversation history with intent patterns
  if (intent) {
    const intentData = intents.find(i => i.tag === intent);
    if (intentData) {
      context.conversationHistory.push({
        intent: intent,
        patterns: intentData.patterns,
        timestamp: new Date()
      });
    }
  }
  
  // Update preferences based on conversation
  if (message.toLowerCase().includes('favorite') || message.toLowerCase().includes('like')) {
    const menuItem = findMenuItemByName(message);
    if (menuItem) {
      if (!context.preferences.favoriteDrinks) {
        context.preferences.favoriteDrinks = [];
      }
      if (!context.preferences.favoriteDrinks.includes(menuItem)) {
        context.preferences.favoriteDrinks.push(menuItem);
      }
    }
  }
  
  context.currentIntent = intent;
  context.lastInteraction = new Date();
  
  return context;
}

// Function to get personalized response (now from knowledge base)
function getPersonalizedResponse(intentTag, context) {
  const intentData = intents.find(i => i.tag === intentTag);
  if (!intentData) return null;

  let responseText = intentData.responses[Math.floor(Math.random() * intentData.responses.length)];
  
  // Simple personalization (can be expanded)
  if (context.preferences.name) {
    responseText = responseText.replace(/^Hi/, `Hi ${context.preferences.name}`);
  }

  // Note: Quick replies are handled in the main /api/chat endpoint logic now
  return responseText; // Return just the text
}

// Function to handle fallback (can still use LLM here for a general response)
async function handleFallback(context, message) {
  try {
    // Build a comprehensive prompt with all relevant context
    const prompt = buildComprehensivePrompt(message, context, '');
    
    // Get response from local LLM
    const llmResponse = await generateWithLLM(prompt);
    
    // Generate quick replies based on the context
    const quickReplies = [
      "See Menu",
      "Check Hours",
      "View Events",
      "Contact Us"
    ];
    
     return {
      response: llmResponse,
      quickReplies
    };
  } catch (error) {
    console.error('Error in handleFallback:', error);
      return {
      response: "I apologize, but I'm having trouble understanding your request. Could you please try rephrasing it?",
      quickReplies: ["See Menu", "Contact Us"]
    };
  }
}

// Structured hours table for easy lookup
const hoursTable = knowledgeBase.storeInfo.hours;

// Helper to get today's hours and format the response
function getTodaysHoursResponse(showRest = false) {
  const days = Object.keys(hoursTable);
  const todayIdx = new Date().getDay(); // Sunday = 0
  const todayName = days[(todayIdx + 6) % 7]; // Map JS getDay to our table (Monday=0)
  let response = `Today (${todayName}): ${hoursTable[todayName]}`;
  if (showRest) {
    response += '\n\nOther days:';
    days.forEach(day => {
      if (day !== todayName) {
        response += `\n${day}: ${hoursTable[day]}`;
      } else if (!showRest) {
        // Don't repeat today's hours if only showing today
      }
    });
  }
  return response;
}

// Add these formatting utility functions
function formatResponse(text, type = 'general') {
  const sections = text.split('\n\n');
  let formattedText = '';
  
  sections.forEach(section => {
    if (section.includes(':')) {
      const [header, content] = section.split(':');
      formattedText += `${header}:\n`;
      
      // Split content by lines and format each line
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('-')) {
          formattedText += `  • ${line.trim().substring(1).trim()}\n`;
        } else if (line.trim().startsWith('*')) {
          formattedText += `    - ${line.trim().substring(1).trim()}\n`;
      } else {
          formattedText += `  ${line.trim()}\n`;
        }
      });
        } else {
      formattedText += `${section}\n`;
    }
    formattedText += '\n';
  });
  
  return formattedText.trim();
}

function formatQuickReplies(replies) {
  return replies.map(reply => reply.trim());
}

// Function to get response based on intent (primarily uses knowledge base)
function getResponse(intent, userId, context, message) {
  const intentData = knowledgeBase.intents.find(i => i.tag === intent);
  if (!intentData) return null;

  let responseText = intentData.responses[0];
  let quickReplies = [];

  // Format the response based on intent type
  switch (intent) {
    case 'greeting':
      responseText = formatResponse(`Hi there! 👋 I'm HazelBot — your virtual barista at Common Good Harlem.\n\nI can help you with:\n- Drinks and Food\n- Events and Specials\n- Hours and Location\n- Orders and Reservations\n\nWhat would you like to do?`);
      quickReplies = ["Menu", "Events", "Hours", "Location", "Contact Us", "Recommendations"];
      break;

    case 'hours':
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[dayOfWeek];
      
      let todayHours = '';
      switch(dayOfWeek) {
        case 0: // Sunday
          todayHours = '9:00am - 4:00pm';
          break;
        case 1: // Monday
          todayHours = '7:30am - 7:00pm';
          break;
        case 2: // Tuesday
        case 3: // Wednesday
          todayHours = '7:30am - 6:00pm';
          break;
        case 4: // Thursday
          todayHours = '7:30am - 7:00pm';
          break;
        case 5: // Friday
          todayHours = '7:30am - 10:00pm';
          break;
        case 6: // Saturday
          todayHours = '8:30am - 7:00pm';
          break;
      }

      responseText = formatResponse(`Here are our hours! 🕒\n\nToday (${todayName}):\n${todayHours}\n\nAll Hours:\nMonday: 7:30am - 7:00pm\nTuesday - Wednesday: 7:30am - 6:00pm\nThursday: 7:30am - 7:00pm\nFriday: 7:30am - 10:00pm\nSaturday: 8:30am - 7:00pm\nSunday: 9:00am - 4:00pm\n\nBusy Hours:\n• Weekdays: 8:00am - 11:00am\n• Weekends: 10:00am - 2:00pm\n\nWe're closed on major holidays.`);
      quickReplies = ["Today's Hours", "Holiday Hours", "Make Reservation"];
      break;

    case 'holiday_hours':
      responseText = formatResponse(`Holiday Hours 🎄\n\nWe are closed on the following holidays:\n• New Year's Day (January 1)\n• Memorial Day (Last Monday in May)\n• Independence Day (July 4)\n• Labor Day (First Monday in September)\n• Thanksgiving Day (Fourth Thursday in November)\n• Christmas Day (December 25)\n\nWe may have modified hours on:\n• Christmas Eve (December 24): 7:30am - 3:00pm\n• New Year's Eve (December 31): 7:30am - 5:00pm\n\nWould you like to know our regular hours?`);
      quickReplies = ["Regular Hours", "Today's Hours", "Make Reservation"];
      break;

    case 'location':
      responseText = formatResponse(`We're located at:\n\nAddress:\n2801 Frederick Douglass Boulevard\nNew York, NY 10039\n\nTransportation:\n• Subway: A, B, C, D trains to 125th St\n• Bus: M2, M3, M4, M10 to 125th St\n• Parking available nearby\n\nContact:\n• Phone: (917) 261-6996\n• Email: feedback@commongoodharlem.org\n\nWe're in the heart of Harlem, just a short walk from the 125th Street subway station.`);
      quickReplies = ["Hours", "Menu", "Make Reservation"];
      break;

    case 'menu':
      responseText = formatResponse(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           📋 COMMON GOOD MENU 📋           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃          ☕ HOT DRINKS           ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Coffee                          ┃  ┃
┃  ┃  • Small  $3.50  [Add]          ┃  ┃
┃  ┃  • Medium $4.00  [Add]          ┃  ┃
┃  ┃  • Large  $4.50  [Add]          ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Latte                           ┃  ┃
┃  ┃  • Small  $4.50  [Add]          ┃  ┃
┃  ┃  • Medium $5.50  [Add]          ┃  ┃
┃  ┃  • Large  $6.50  [Add]          ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Cappuccino                      ┃  ┃
┃  ┃  • Small  $4.00  [Add]          ┃  ┃
┃  ┃  • Medium $5.00  [Add]          ┃  ┃
┃  ┃  • Large  $6.00  [Add]          ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Matcha                          ┃  ┃
┃  ┃  • Small  $5.00  [Add]          ┃  ┃
┃  ┃  • Medium $6.00  [Add]          ┃  ┃
┃  ┃  • Large  $7.00  [Add]          ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃          🥤 COLD DRINKS          ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Iced Coffee                     ┃  ┃
┃  ┃  • Medium $4.00  [Add]          ┃  ┃
┃  ┃  • Large  $5.00  [Add]          ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Cold Brew                       ┃  ┃
┃  ┃  • Medium $4.50  [Add]          ┃  ┃
┃  ┃  • Large  $5.50  [Add]          ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃          🍽️ FOOD ITEMS           ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Croissant                       ┃  ┃
┃  ┃  • Plain     $3.50  [Add]       ┃  ┃
┃  ┃  • Chocolate $4.00  [Add]       ┃  ┃
┃  ┃  • Almond    $4.50  [Add]       ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Avocado Toast                   ┃  ┃
┃  ┃  • Base      $8.00  [Add]       ┃  ┃
┃  ┃  • + Egg     $2.00  [Add]       ┃  ┃
┃  ┃  • + Salmon  $3.00  [Add]       ┃  ┃
┃  ┃  • + Feta    $1.50  [Add]       ┃  ┃
┃  ┃                                  ┃  ┃
┃  ┃  Breakfast Sandwich              ┃  ┃
┃  ┃  • Price     $7.00  [Add]       ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃          💫 SPECIAL OFFERS       ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃  • Happy Hour (3-5 PM):          ┃  ┃
┃  ┃    20% off drinks                ┃  ┃
┃  ┃  • Student Discount:             ┃  ┃
┃  ┃    10% off with ID               ┃  ┃
┃  ┃  • Free Avocado Toast            ┃  ┃
┃  ┃    on Mondays!                   ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                        ┃
┃  📍 Full menu on DoorDash:              ┃
┃  https://www.doordash.com/store/        ┃
┃  common-good-harlem-new-york-24627565/  ┃
┃  58781546/                             ┃
┃                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
      quickReplies = ["Hot Drinks", "Cold Drinks", "Food Items", "Special Offers", "Start Order"];
      break;

    case 'events':
      responseText = formatResponse(`Upcoming Events 🎵\n\n🎷 Live Music Night\n• When: Every Friday, 7:00pm - 9:00pm\n• What: Jazz Night featuring local artists\n• Cost: Free entry with any drink purchase\n• Special: 20% off all drinks during the event\n\n📝 Poetry Night\n• When: Every Saturday, 6:00pm - 8:00pm\n• What: Open mic poetry reading\n• Cost: $5 entry fee (includes a free coffee)\n• Special: Sign up to perform by 5:30pm\n\n🤝 Community Meetup\n• When: Every Sunday, 2:00pm - 4:00pm\n• What: Networking and social gathering\n• Cost: Free entry\n• Special: 15% off all food and drinks\n\nWould you like to:\n• Register for an event\n• Learn more about a specific event\n• See our full events calendar`);
      quickReplies = ["Register for Event", "Learn More About Live Music", "Learn More About Poetry Night", "Community Meetup Info"];
      break;

    case 'specials':
      responseText = formatResponse(`Current Specials 🎉\n\nDaily Specials:\n• Happy Hour: 3:00pm - 5:00pm\n  - 20% off all drinks\n  - Buy one get one free on pastries\n  - $2 off all sandwiches\n\nWeekly Specials:\n• Monday: Free Avocado Toast with any drink purchase\n• Tuesday: 50% off all pastries\n• Wednesday: Buy one get one free on Cold Brew\n• Thursday: $1 off all hot drinks\n• Friday: Live Music Night (Free entry)\n• Weekend: Free coffee with any breakfast sandwich (9am - 2pm)\n\nStudent Discount: 10% off with valid ID\nBring Your Own Cup: $1 off any drink\n\nWould you like to know more about any of these offers?`);
      quickReplies = ["View Menu", "Make Reservation", "Order Now"];
      break;

    case 'catering':
      responseText = formatResponse(`Catering Services 🎉\n\nWe offer catering for:\n- Corporate meetings\n- Private parties\n- Community events\n\nOptions include:\n- Coffee & Pastry packages\n- Full breakfast/lunch spreads\n- Custom menu creation\n\nRequirements:\n- Minimum order: 10 people\n- Advance notice: 48 hours\n\nWould you like to request a catering quote?`);
      quickReplies = ["Request Quote", "View Catering Menu", "Contact Us"];
      break;

    case 'payment':
      responseText = formatResponse(`Payment Options 💳\n\nWe accept:\n- Credit/Debit Cards\n- Apple Pay\n- Google Pay\n- Cash\n- Venmo\n\nAll prices include tax. Would you like to proceed with payment?`);
      quickReplies = ["View Menu", "Start Order", "Contact Us"];
      break;

    case 'delivery':
      responseText = formatResponse(`Delivery Options 🚚\n\nWe partner with:\n- DoorDash\n- Uber Eats\n\nDelivery times:\n- 15-30 minutes within 2 miles\n- 30-45 minutes within 5 miles\n\nWould you like to place a delivery order?`);
      quickReplies = ["Order Now", "View Menu", "Contact Us"];
      break;

    case 'feedback':
      responseText = formatResponse(`We'd love to hear from you! 💖\n\nYou can provide feedback through:\n\n• Email: feedback@commongoodharlem.org\n• Phone: (917) 261-6996\n\nYour feedback helps us improve!`);
      quickReplies = ["Menu", "Hours", "Location"];
      break;

    case 'wifi':
      responseText = formatResponse(`We offer free Wi-Fi for all customers! 📶\n\nNetwork: CommonGood_Guest\nPassword: HarlemCoffee2024\n\nPlease note: Wi-Fi is available during business hours only.`);
      quickReplies = ["Hours", "Menu", "Contact Us"];
      break;

    case 'parking':
      responseText = formatResponse(`Parking Information 🚗\n\n- Street parking available on Frederick Douglass Blvd\n- Metered parking: $2.50/hour\n- Free parking on Sundays\n- Nearby parking garage: 125th St Garage (2 blocks away)\n\nNeed directions to the parking garage?`);
      quickReplies = ["Directions", "Hours", "Contact Us"];
      break;

    case 'pets':
      responseText = formatResponse(`Pet Policy 🐕\n\n- Service animals are always welcome\n- Well-behaved pets are allowed in our outdoor seating area\n- Please keep pets on a leash\n- Water bowls available upon request\n\nWould you like to know about our outdoor seating options?`);
      quickReplies = ["Outdoor Seating", "Hours", "Contact Us"];
      break;

    case 'seating':
      responseText = formatResponse(`Seating Options 🪑\n\nIndoor:\n- 12 tables (2-4 people)\n- 4 bar seats\n- 2 lounge areas\n\nOutdoor:\n- 8 tables (2-4 people)\n- Umbrella seating available\n- Pet-friendly area\n\nAll seating is first-come, first-served. Need to know our busiest times?`);
      quickReplies = ["Busy Hours", "Menu", "Contact Us"];
      break;

    case 'recommendations':
      const timeOfDay = new Date().getHours();
      let recommendations = '';
      
      if (timeOfDay >= 5 && timeOfDay < 11) {
        recommendations = '• Breakfast Sandwich with a Latte\n• Avocado Toast with Cold Brew\n• Croissant with Coffee';
      } else if (timeOfDay >= 11 && timeOfDay < 15) {
        recommendations = '• Avocado Toast with Iced Coffee\n• Breakfast Sandwich with Matcha\n• Croissant with Latte';
      } else {
        recommendations = '• Cold Brew with a Croissant\n• Iced Coffee with Avocado Toast\n• Matcha with Breakfast Sandwich';
      }
      
      responseText = formatResponse(`I'd be happy to recommend something! 🎯\n\nBased on your preferences and the time of day, here are some suggestions:\n\n${recommendations}\n\nWould you like to know more about any of these items?`);
      quickReplies = ["Menu", "Events", "Hours", "Location", "Contact Us"];
      break;

    default:
      responseText = formatResponse(responseText);
      quickReplies = getQuickReplies(intent, context);
  }

  return {
    response: responseText,
    quickReplies: formatQuickReplies(quickReplies)
  };
}

// Function to get quick replies based on intent
function getQuickReplies(intentData) {
  switch (intentData.tag) {
    case 'menu':
      return ["Hot Drinks", "Cold Drinks", "Food", "Full Menu"];
    case 'events':
      return knowledgeBase.events.map(event => event.name).concat(["Register for Event", "More Events"]);
    case 'specials':
      return [...knowledgeBase.specials.daily, ...knowledgeBase.specials.weekly].map(special => 
        special.split(':')[0].trim()
      ).concat(["More Specials"]);
    case 'catering':
      return knowledgeBase.catering.services.concat(["Request Quote", "More Info"]);
    case 'payment':
      return knowledgeBase.payment.methods.concat(["Proceed to Payment", "More Options"]);
    case 'delivery':
      return ["DoorDash", "Uber Eats", "More Options"];
    case 'add_to_order':
        return ["Add More Items", "Check Total", "Checkout"];
    case 'check_total':
        return ["Add More Items", "Checkout", "Ask about Payment"];
    case 'payment_info':
        return ["Proceed to Checkout", "Ask about Tip", "See Menu"];
     case 'feedback_request':
      return knowledgeBase.feedback.methods;
    default:
      // General quick replies based on knowledge base
      return ["Menu", "Events", "Hours", "Location", "Contact Us", "Recommendations"];
  }
}

// Training endpoint
app.post('/api/train', (req, res) => {
  try {
    const { tag, patterns, responses } = req.body;
    
    // Check if intent already exists
    const existingIntent = trainingData.intents.find(i => i.tag === tag);
    
    if (existingIntent) {
      // Update existing intent
      existingIntent.patterns = [...new Set([...existingIntent.patterns, ...patterns])];
      existingIntent.responses = [...new Set([...existingIntent.responses, ...responses])];
    } else {
      // Add new intent
      trainingData.intents.push({ tag, patterns, responses });
    }
    
    res.json({ success: true, message: 'Training data updated successfully' });
  } catch (error) {
    console.error('Error in training:', error);
    res.status(500).json({ error: 'Failed to update training data' });
  }
});

// Helper: Find menu item by name (case-insensitive, partial match)
function findMenuItemByName(message) {
  const menu = knowledgeBase.menu;
  const allItems = [
    ...menu.drinks.map(d => d.name),
    ...menu.coldDrinks.map(d => d.name),
    ...menu.food.map(f => f.name),
  ];
  const lowerMsg = message.toLowerCase();
  return allItems.find(item => lowerMsg.includes(item.toLowerCase()));
}

async function generateWithLLM(prompt) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
  try {
      console.log('Attempting to connect to local LLM...');
    const response = await axios.post(
        'http://model-runner.docker.internal/engines/llama.cpp/v1/chat/completions',
      {
          model: 'ai/mistral',
        messages: [
            {
              role: 'system',
              content: 'You are a friendly café assistant for Common Good Harlem. Answer questions using the provided knowledge base and maintain a warm, conversational tone. Use emojis occasionally to make responses more engaging.'
            },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
          timeout: 10000 // 10 second timeout
      }
    );

      if (response.data && response.data.choices && response.data.choices[0]) {
        console.log('Successfully received response from local LLM');
    return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from LLM');
      }
  } catch (err) {
      console.error(`LLM API error (attempt ${retryCount + 1}/${maxRetries}):`, err.message);
    if (err.response) {
      console.error('LLM API error details:', err.response.data);
    }
      
      retryCount++;
      if (retryCount === maxRetries) {
        // If all retries failed, return a fallback response
        return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    }
  }
}

function buildComprehensivePrompt(message, context, relevantInfo) {
  // Get recent conversation history
  const recentMessages = context.messages.slice(-3).map(m => m.message).join('\n');
  
  // Get relevant knowledge base sections
  const storeInfo = knowledgeBase.storeInfo;
  const menu = knowledgeBase.menu;
  const specials = knowledgeBase.specials;
  const events = knowledgeBase.events;
  
  // Build a comprehensive prompt that includes all relevant context
  const prompt = `You are a friendly café assistant for Common Good Harlem. Use the following information to answer questions:

STORE INFORMATION:
Location: ${storeInfo.location}
Hours: ${JSON.stringify(storeInfo.hours, null, 2)}
Contact: ${storeInfo.contact.phone}

MENU:
Hot Drinks:
${menu.drinks.map(d => `- ${d.name}: ${Object.entries(d.price).map(([size, price]) => `${size}: $${price}`).join(', ')}`).join('\n')}

Cold Drinks:
${menu.coldDrinks.map(d => `- ${d.name}: ${Object.entries(d.price).map(([size, price]) => `${size}: $${price}`).join(', ')}`).join('\n')}

Food Items:
${menu.food.map(f => `- ${f.name}: ${f.basePrice ? `$${f.basePrice}` : Object.entries(f.price).map(([type, price]) => `${type}: $${price}`).join(', ')}`).join('\n')}

CURRENT SPECIALS:
Daily:
${specials.daily.map(s => `- ${s}`).join('\n')}

Weekly:
${specials.weekly.map(s => `- ${s}`).join('\n')}

UPCOMING EVENTS:
${events.map(e => `- ${e.name}: ${e.day} ${e.time}`).join('\n')}

RECENT CONVERSATION:
${recentMessages}

ADDITIONAL CONTEXT:
${relevantInfo}

USER MESSAGE: ${message}

Please provide a helpful, friendly response that incorporates relevant information from the knowledge base. If the information isn't available in the knowledge base, use your general knowledge about coffee shops and customer service to provide a helpful response. Always maintain a warm, conversational tone and use emojis occasionally to make the response more engaging.`;

  return prompt;
}

// Add this function near the top with other utility functions
function getSignatureDrinks() {
  return {
    hot: knowledgeBase.menu.drinks.filter(d => ['Latte', 'Matcha'].includes(d.name)),
    cold: knowledgeBase.menu.coldDrinks.filter(d => ['Cold Brew'].includes(d.name))
  };
}

// Update the formatMenuResponse function to handle prices correctly
function formatMenuResponse(menu) {
  let response = "📋 Our Menu:\n\n";
  
  // Hot Drinks Section
  response += "☕ Hot Drinks:\n";
  menu.drinks.forEach(drink => {
    response += `  • ${drink.name}\n`;
    Object.entries(drink.price).forEach(([size, price]) => {
      response += `    - ${size}: $${price.toFixed(2)}\n`;
    });
  });
  
  // Cold Drinks Section
  response += "\n🥤 Cold Drinks:\n";
  menu.coldDrinks.forEach(drink => {
    response += `  • ${drink.name}\n`;
    Object.entries(drink.price).forEach(([size, price]) => {
      response += `    - ${size}: $${price.toFixed(2)}\n`;
    });
  });
  
  // Food Section
  response += "\n🍽️ Food Items:\n";
  menu.food.forEach(item => {
    response += `  • ${item.name}\n`;
    if (item.basePrice) {
      response += `    - Price: $${item.basePrice.toFixed(2)}\n`;
    } else if (item.price) {
      Object.entries(item.price).forEach(([type, price]) => {
        response += `    - ${type}: $${price.toFixed(2)}\n`;
      });
    }
    if (item.addons && item.addons.length > 0) {
      response += `    - Add-ons: ${item.addons.join(', ')}\n`;
    }
  });
  
  response += "\n📍 For our complete menu and special items, visit our DoorDash page:\n";
  response += "https://www.doordash.com/store/common-good-harlem-new-york-24627565/58781546/\n\n";
  response += "Would you like to start an order or know more about any specific item?";
  
  return response;
}

// Add these order management functions
function addItemToOrder(orderId, itemName, quantity = 1) {
  const order = activeOrders.get(orderId);
  if (!order) return null;

  const menu = knowledgeBase.menu;
  let itemData = menu.drinks.find(d => d.name.toLowerCase() === itemName.toLowerCase())
    || menu.coldDrinks.find(d => d.name.toLowerCase() === itemName.toLowerCase())
    || menu.food.find(f => f.name.toLowerCase() === itemName.toLowerCase());

  if (!itemData) return null;

  const existingItem = order.items.find(item => item.name === itemData.name);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    order.items.push({
      name: itemData.name,
      price: itemData.basePrice || Object.values(itemData.price)[0],
      quantity: quantity
    });
  }

  return order;
}

function formatOrderSummary(order) {
  const total = calculateOrderTotal(order);
  let summary = `Order #${order.id}\n\n`;
  
  order.items.forEach(item => {
    summary += `  • ${item.name}\n`;
    summary += `    - Quantity: ${item.quantity}\n`;
    summary += `    - Price: $${item.price.toFixed(2)} each\n`;
    summary += `    - Subtotal: $${(item.price * item.quantity).toFixed(2)}\n\n`;
  });
  
  summary += `Total: $${total.toFixed(2)}\n`;
  return summary;
}

// Update the chat endpoint to handle new orders properly
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Chat request received:', req.body);
    const { message, userId } = req.body;

    if (!message || !userId) {
      console.error('Validation error: Message or userId missing.');
      return res.status(400).json({ error: 'Message and userId are required' });
    }
    
    const context = updateContext(userId, message, null);
    const intent = findBestIntent(message);
    updateContext(userId, message, intent);
    let response;
    
    // Check for order-related keywords and actions
    const orderKeywords = ['order', 'buy', 'get', 'want', 'purchase'];
    const isOrderRequest = orderKeywords.some(keyword => message.toLowerCase().includes(keyword));
    const isAddItem = message.toLowerCase() === 'add another item' || message.toLowerCase() === 'add more items';
    const isCompleteOrder = message.toLowerCase() === 'complete order';
    const isCheckTotal = message.toLowerCase() === 'check total';
    const isCancelOrder = message.toLowerCase() === 'cancel order';
    const isSignatureDrinks = message.toLowerCase().includes('signature') && message.toLowerCase().includes('drink');
    
    // Get current order if it exists
    const currentOrder = Array.from(activeOrders.values()).find(order => order.userId === userId);
    
    if (isSignatureDrinks) {
      const signatureDrinks = getSignatureDrinks();
      let responseText = "Our signature drinks are:\n\n";
      
      if (signatureDrinks.hot.length > 0) {
        responseText += "☕ Hot Drinks:\n";
        signatureDrinks.hot.forEach(drink => {
          responseText += `- ${drink.name}: ${Object.entries(drink.price).map(([size, price]) => `${size}: $${price}`).join(', ')}\n`;
        });
      }
      
      if (signatureDrinks.cold.length > 0) {
        responseText += "\n🥤 Cold Drinks:\n";
        signatureDrinks.cold.forEach(drink => {
          responseText += `- ${drink.name}: ${Object.entries(drink.price).map(([size, price]) => `${size}: $${price}`).join(', ')}\n`;
        });
      }
      
      response = {
        response: responseText + "\nWould you like to try any of these?",
        quickReplies: [...signatureDrinks.hot.map(d => d.name), ...signatureDrinks.cold.map(d => d.name), "See Full Menu"]
      };
    } else if (isCompleteOrder && currentOrder) {
      const total = calculateOrderTotal(currentOrder);
      const orderDetails = currentOrder.items.map(item => 
        `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');
      
      response = {
        response: `Your order #${currentOrder.id} is complete!\n\nOrder Details:\n${orderDetails}\n\nTotal: $${total.toFixed(2)}\n\nYour order will be ready in approximately ${currentOrder.estimatedTime} minutes. Thank you for your order!`,
        quickReplies: ["Start New Order", "View Menu", "Check Hours"]
      };
      activeOrders.delete(currentOrder.id);
    } else if (isCancelOrder && currentOrder) {
      response = {
        response: `Order #${currentOrder.id} has been cancelled. Would you like to start a new order?`,
        quickReplies: ["Start New Order", "View Menu"]
      };
      activeOrders.delete(currentOrder.id);
    } else if (isCheckTotal && currentOrder) {
      const total = calculateOrderTotal(currentOrder);
      const orderDetails = currentOrder.items.map(item => 
        `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');
      
      response = {
        response: `Your current total is $${total.toFixed(2)}. Here's the breakdown:\n${orderDetails}\nWould you like to add anything else before completing your order?`,
        quickReplies: ["Add Another Item", "Complete Order", "Cancel Order"]
      };
    } else if (isAddItem && currentOrder) {
      response = {
        response: "What would you like to add to your order? You can say the name of any menu item.",
        quickReplies: ["Show Menu", "Complete Order", "Cancel Order"]
      };
    } else if (isOrderRequest) {
      // Handle new order request
      const menuItemName = findMenuItemByName(message);
      if (menuItemName) {
        const orderId = generateOrderId();
        const menu = knowledgeBase.menu;
        let itemData = menu.drinks.find(d => d.name.toLowerCase() === menuItemName.toLowerCase())
          || menu.coldDrinks.find(d => d.name.toLowerCase() === menuItemName.toLowerCase())
          || menu.food.find(f => f.name.toLowerCase() === menuItemName.toLowerCase());
        
        if (itemData) {
          const order = {
            id: orderId,
            userId: userId,
            items: [{
              name: itemData.name,
              price: itemData.basePrice || Object.values(itemData.price)[0],
              quantity: 1
            }],
            status: 'preparing',
            timestamp: new Date(),
            estimatedTime: 5 // minutes
          };
          
          activeOrders.set(orderId, order);
          const total = calculateOrderTotal(order);
          
          response = {
            response: `Great! I've started your order for ${itemData.name}. Your order number is #${orderId}. Current total: $${total.toFixed(2)}. Would you like to add anything else to your order?`,
            quickReplies: ["Add Another Item", "Complete Order", "Cancel Order"]
          };
        } else {
          response = {
            response: "I'm sorry, I couldn't find that item on our menu. Would you like to see our menu?",
            quickReplies: ["Show Menu", "Try Again"]
          };
        }
      } else {
        response = {
          response: "I'm not sure what you'd like to order. Would you like to see our menu?",
          quickReplies: ["Show Menu", "Try Again"]
        };
      }
    } else if (intent) {
      // If a specific intent is matched, use the knowledge base response via getResponse
      response = getResponse(intent, userId, context, message);
      context.fallbackCount = 0; // Reset fallback on successful intent match
    } else {
      // No intent matched: Try menu item lookup
      const menuItemName = findMenuItemByName(message);
      if (menuItemName) {
        // Found a menu item, construct response directly from KB data
        const menu = knowledgeBase.menu;
        let itemData = menu.drinks.find(d => d.name.toLowerCase() === menuItemName.toLowerCase())
          || menu.coldDrinks.find(d => d.name.toLowerCase() === menuItemName.toLowerCase())
          || menu.food.find(f => f.name.toLowerCase() === menuItemName.toLowerCase());
        
        let responseText = `${itemData.name} is available on our menu.`;
        if (itemData.basePrice) responseText += ` Price: $${itemData.basePrice}.`;
        if (itemData.price) responseText += ` Prices vary by size: ${Object.entries(itemData.price).map(([size, price]) => `${size}: $${price}`).join(', ')}.`;
        if (itemData.addons && itemData.addons.length > 0) responseText += ` Available add-ons include: ${itemData.addons.join(', ')}.`;
        if (itemData.types && itemData.types.length > 0) responseText += ` We offer different types like ${itemData.types.join(', ')}.`;
        if (itemData.sizes && itemData.sizes.length > 0) responseText += ` Available sizes are: ${itemData.sizes.join(', ')}.`;
        if (itemData.meat && itemData.meat.length > 0) responseText += ` Meat options include: ${itemData.meat.join(', ')}.`;
        if (itemData.cheese && itemData.cheese.length > 0) responseText += ` Cheese options include: ${itemData.cheese.join(', ')}.`;

        // Append a follow-up question
        const followUpQuestions = getFollowUpQuestions(context, 'menu');
        const selectedFollowUp = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
        responseText += ` ${selectedFollowUp}`;

        response = {
          response: responseText,
          quickReplies: ["See Menu", `Order ${menuItemName}`, "Ask about another item"]
        };
      } else {
        // Use the local LLM for a more natural response
        const relevantInfo = {
          currentIntent: intent,
          menuItems: Object.values(knowledgeBase.menu).flat(),
          specials: knowledgeBase.specials,
          events: knowledgeBase.events,
          storeInfo: knowledgeBase.storeInfo
        };
        
        // Build a comprehensive prompt with all relevant context
        const prompt = buildComprehensivePrompt(message, context, JSON.stringify(relevantInfo));
        
        // Get response from local LLM
        const llmResponse = await generateWithLLM(prompt);
        
        response = {
          response: formatResponse(llmResponse),
          quickReplies: formatQuickReplies(["Menu", "Events", "Hours", "Location", "Contact Us", "Recommendations"])
        };
      }
    }
    
    // Check for order-related actions
    const isNewOrder = message.toLowerCase().includes('start new order') || 
                      message.toLowerCase().includes('order') || 
                      message.toLowerCase().includes('buy') ||
                      message.toLowerCase().includes('get');
    const isAddToOrder = message.toLowerCase().includes('add') || message.toLowerCase().includes('+');
    const isCheckout = message.toLowerCase().includes('checkout') || message.toLowerCase().includes('pay');
    const isViewOrder = message.toLowerCase().includes('view order') || message.toLowerCase().includes('check order');
    
    if (isNewOrder) {
      const orderId = generateOrderId();
      const order = {
        id: orderId,
        userId: userId,
        items: [],
        status: 'created',
        timestamp: new Date(),
        estimatedTime: 0
      };
      
      activeOrders.set(orderId, order);
      
      response = {
        response: formatResponse(`Great! I've started a new order for you (Order #${orderId}).\n\nWhat would you like to add to your order?`),
        quickReplies: ["Show Menu", "Hot Drinks", "Cold Drinks", "Food", "Signature Drinks"]
      };
    } else if (isAddToOrder) {
      const currentOrder = Array.from(activeOrders.values()).find(order => order.userId === userId);
      if (!currentOrder) {
        response = {
          response: formatResponse("You don't have an active order. Would you like to start one?"),
          quickReplies: ["Start New Order", "View Menu"]
        };
      } else {
        const itemName = message.replace(/add|to order|\+|/gi, '').trim();
        const updatedOrder = addItemToOrder(currentOrder.id, itemName);
        if (updatedOrder) {
          response = {
            response: formatResponse(`Added ${itemName} to your order.\n\n${formatOrderSummary(updatedOrder)}\n\nWould you like to add anything else?`),
            quickReplies: ["Add Another Item", "Checkout", "View Order", "Cancel Order", "Show Menu"]
          };
        } else {
          response = {
            response: formatResponse(`I couldn't find "${itemName}" on our menu. Would you like to see our menu?`),
            quickReplies: ["Show Menu", "Try Again"]
          };
        }
      }
    } else if (isCheckout) {
      const currentOrder = Array.from(activeOrders.values()).find(order => order.userId === userId);
      if (!currentOrder) {
        response = {
          response: formatResponse("You don't have an active order to checkout. Would you like to start one?"),
          quickReplies: ["Start New Order", "View Menu"]
        };
      } else {
        const total = calculateOrderTotal(currentOrder);
        response = {
          response: formatResponse(`Ready to checkout!\n\n${formatOrderSummary(currentOrder)}\n\nPayment Options:\n- Credit/Debit Cards\n- Apple Pay\n- Google Pay\n- Cash\n- Venmo\n\nHow would you like to pay?`),
          quickReplies: ["Pay with Card", "Pay with Apple Pay", "Pay with Cash", "Cancel Order"]
        };
      }
    } else if (isViewOrder) {
      const currentOrder = Array.from(activeOrders.values()).find(order => order.userId === userId);
      if (!currentOrder) {
        response = {
          response: formatResponse("You don't have an active order. Would you like to start one?"),
          quickReplies: ["Start New Order", "View Menu"]
        };
      } else {
        response = {
          response: formatResponse(`Current Order:\n\n${formatOrderSummary(currentOrder)}\n\nWhat would you like to do?`),
          quickReplies: ["Add Another Item", "Checkout", "Cancel Order", "Show Menu"]
        };
      }
    } else if (message.toLowerCase().includes('menu') || message.toLowerCase().includes('show menu')) {
      const menuResponse = formatMenuResponse(knowledgeBase.menu);
      response = {
        response: menuResponse,
        quickReplies: ["Start New Order", "Hot Drinks", "Cold Drinks", "Food", "Signature Drinks", "Specials"]
      };
    } else if (message.toLowerCase().includes('signature') && message.toLowerCase().includes('drink')) {
      const signatureDrinks = getSignatureDrinks();
      let responseText = "🌟 Our Signature Drinks:\n\n";
      
      if (signatureDrinks.hot.length > 0) {
        responseText += "☕ Hot Signature Drinks:\n";
        signatureDrinks.hot.forEach(drink => {
          responseText += `  • ${drink.name}\n`;
          Object.entries(drink.price).forEach(([size, price]) => {
            responseText += `    - ${size}: $${price}\n`;
          });
        });
      }
      
      if (signatureDrinks.cold.length > 0) {
        responseText += "\n🥤 Cold Signature Drinks:\n";
        signatureDrinks.cold.forEach(drink => {
          responseText += `  • ${drink.name}\n`;
          Object.entries(drink.price).forEach(([size, price]) => {
            responseText += `    - ${size}: $${price}\n`;
          });
        });
      }
      
      responseText += "\nWould you like to try any of these signature drinks?";
      
      response = {
        response: formatResponse(responseText),
        quickReplies: formatQuickReplies([...signatureDrinks.hot.map(d => d.name), ...signatureDrinks.cold.map(d => d.name), "See Full Menu"])
      };
    } else if (intent) {
      response = getResponse(intent, userId, context, message);
    } else {
      // Use the local LLM for a more natural response
      const relevantInfo = {
        currentIntent: intent,
        menuItems: Object.values(knowledgeBase.menu).flat(),
        specials: knowledgeBase.specials,
        events: knowledgeBase.events,
        storeInfo: knowledgeBase.storeInfo
      };
      
      const prompt = buildComprehensivePrompt(message, context, JSON.stringify(relevantInfo));
      const llmResponse = await generateWithLLM(prompt);
      
      response = {
        response: formatResponse(llmResponse),
        quickReplies: formatQuickReplies(["Menu", "Events", "Hours", "Location", "Contact Us", "Recommendations"])
      };
    }
    
    const finalResponse = {
      response: response.response,
      quickReplies: response.quickReplies
    };
    
    // Update conversation history
    context.messages.push({
      message: message,
      response: finalResponse.response,
      timestamp: new Date()
    });
    
    res.json(finalResponse);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message', 
      details: error.message,
      response: formatResponse("I apologize, but I'm having trouble processing your request right now. Could you please try again?")
    });
  }
});

// Get training data endpoint
app.get('/api/training-data', (req, res) => {
  res.json(trainingData);
});

// Get menu data endpoint
app.get('/api/menu', (req, res) => {
  res.json(menuData);
});

// Order endpoint
app.post('/api/order', (req, res) => {
  try {
    console.log('Order request received:', req.body);
    const { items, customerInfo, paymentMethod } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid items array is required' });
    }
    
    // Generate order ID
    const orderId = generateOrderId();
    
    // Calculate total
    const total = calculateOrderTotal(items);
    
    // Create order object
    const order = {
      id: orderId,
      items,
      customerInfo,
      paymentMethod,
      total,
      status: 'preparing',
      timestamp: new Date(),
      estimatedTime: 5, // minutes
    };
    
    // Store order
    activeOrders.set(orderId, order);
    console.log('Order created:', order);
    
    // Simulate order preparation
    setTimeout(() => {
      order.status = 'ready';
      console.log('Order ready:', orderId);
    }, order.estimatedTime * 60 * 1000);
    
    res.json({
      success: true,
      orderId,
      total,
      estimatedTime: order.estimatedTime,
      message: `Order #${orderId} received! Your total is $${total.toFixed(2)}. Estimated preparation time: ${order.estimatedTime} minutes.`
    });
  } catch (error) {
    console.error('Error in order endpoint:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Order status endpoint
app.get('/api/order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = activeOrders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      orderId,
      status: order.status,
      estimatedTime: order.estimatedTime,
      total: order.total,
      items: order.items
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Payment endpoint
app.post('/api/payment', (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    const order = activeOrders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (amount !== order.total) {
      return res.status(400).json({ error: 'Payment amount does not match order total' });
    }
    
    // In a real system, this would integrate with a payment processor
    // For now, we'll just simulate a successful payment
    order.paymentStatus = 'completed';
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      orderId,
      amount
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Add context-related endpoints
app.post('/api/context/preferences', (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!conversationContext.has(userId)) {
      conversationContext.set(userId, {
        messages: [],
        currentIntent: null,
        preferences: {},
        lastInteraction: new Date(),
        fallbackCount: 0
      });
    }
    
    const context = conversationContext.get(userId);
    context.preferences = { ...context.preferences, ...preferences };
    
    res.json({ success: true, preferences: context.preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

app.get('/api/context/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const context = conversationContext.get(userId);
    
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json({
      messages: context.messages,
      currentIntent: context.currentIntent,
      preferences: context.preferences,
      lastInteraction: context.lastInteraction
    });
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

// Add new endpoints for dining experience
app.post('/api/dining/reserve', (req, res) => {
  try {
    const { partySize, customerName, phoneNumber, preference } = req.body;
    
    // Find available table
    const table = findAvailableTable(partySize);
    
    if (table) {
      // Assign table
      table.status = 'occupied';
      table.customerInfo = { name: customerName, phone: phoneNumber };
      table.startTime = new Date();
      
      // Store customer info
      customerInfo.set(phoneNumber, {
        name: customerName,
        tableId: table.id,
        orderHistory: []
      });
      
      res.json({
        success: true,
        message: `Table ${table.id} is ready for you! Please proceed to the host stand.`,
        tableId: table.id
      });
    } else {
      // Add to waitlist
      const waitTime = Math.floor(Math.random() * 30) + 15; // Random wait time between 15-45 minutes
      res.json({
        success: true,
        message: `We're currently at capacity. Estimated wait time is ${waitTime} minutes. Would you like to join the waitlist?`,
        waitTime,
        waitlist: true
      });
    }
  } catch (error) {
    console.error('Error processing reservation:', error);
    res.status(500).json({ error: 'Failed to process reservation' });
  }
});

app.post('/api/dining/order', (req, res) => {
  try {
    const { tableId, items } = req.body;
    const table = tableQueue.get(parseInt(tableId));
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Add items to table's order
    table.currentOrder.push(...items);
    
    // Calculate total
    const total = calculateOrderTotal(items);
    
    res.json({
      success: true,
      message: 'Order added successfully',
      total,
      order: table.currentOrder
    });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.get('/api/dining/table/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const table = tableQueue.get(parseInt(tableId));
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json({
      tableId: table.id,
      status: table.status,
      customerInfo: table.customerInfo,
      currentOrder: table.currentOrder,
      startTime: table.startTime
    });
  } catch (error) {
    console.error('Error fetching table info:', error);
    res.status(500).json({ error: 'Failed to fetch table info' });
  }
});

app.post('/api/dining/feedback', (req, res) => {
  try {
    const { tableId, rating, comments } = req.body;
    const table = tableQueue.get(parseInt(tableId));
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Store feedback
    const feedback = {
      tableId,
      customerInfo: table.customerInfo,
      rating,
      comments,
      timestamp: new Date()
    };
    
    // In a real system, this would be stored in a database
    console.log('Feedback received:', feedback);
    
    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
}

// Add error handling middleware at the top level
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode');
  } else {
    console.log('Running in development mode');
    console.log(`API available at http://localhost:${PORT}/api`);
  }
}); 