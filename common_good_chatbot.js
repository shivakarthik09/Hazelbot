// Common Good Harlem Chatbot - Complete Architecture
// Implements 4-tier response priority system with business-specific data

class CommonGoodHarlemChatbot {
  constructor() {
    this.businessInfo = this.initializeBusinessInfo();
    this.menu = this.initializeMenu();
    this.quickResponses = this.initializeQuickResponses();
    this.intents = this.initializeIntents();
    this.conversationContext = {};
    this.orderContext = {};
  }

  // TIER 1: QUICK MATCHERS (0-5ms)
  initializeQuickResponses() {
    return {
      // Greetings & Welcome
      greetings: {
        patterns: [
          /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
          /^(what's up|howdy|greetings)$/i
        ],
        responses: [
          "☕ Hey there! Welcome to Common Good Harlem! How can I help you today?",
          "Hello! Great to see you at Common Good! What can I get started for you?",
          "Hi! Welcome to your neighborhood coffee spot. What sounds good today?"
        ]
      },

      // Hours - Most common query
      hours: {
        patterns: [
          /^(hours|open|close|what time)$/i,
          /when (do you|are you) (open|close)/i,
          /what are your hours/i,
          /are you open/i
        ],
        response: `☕ Here are our hours:\n📅 Monday: 7:30am - 7:00pm\n📅 Tue-Wed: 7:30am - 6:00pm\n📅 Thursday: 7:30am - 7:00pm\n📅 Friday: 7:30am - 10:00pm\n📅 Saturday: 8:30am - 7:00pm\n📅 Sunday: 9:00am - 4:00pm`
      },

      // Location & Contact
      location: {
        patterns: [
          /^(address|location|where)$/i,
          /where are you located/i,
          /what's your address/i
        ],
        response: "📍 We're located at 2801 Frederick Douglass Blvd, New York, NY 10039 in beautiful Harlem! 📞 Call us at (917) 261-6996"
      },

      // Popular Menu Items
      coffee: {
        patterns: [
          /^(coffee|latte|cappuccino)$/i,
          /what coffee do you have/i
        ],
        response: "☕ Our most popular drinks:\n• Latte (SM $4.75, LG $5.25) ⭐ 97% rating\n• Cold Brew (SM $5.75, LG $6.50) ⭐ 100% rating\n• Cappuccino ($4.00)\n• Americano ($3.50)\n\nWould you like to see our full drink menu?"
      },

      // Quick Menu Access
      menu: {
        patterns: [
          /^(menu|food|drinks)$/i,
          /what do you have/i,
          /show me the menu/i
        ],
        response: "📋 Here's what we offer:\n☕ Coffee & Espresso Drinks\n🧊 Cold Brews & Iced Drinks\n🥐 Fresh Pastries & Breakfast\n🥗 Salads & Healthy Options\n🍺 Beer & Wine\n\nWhat category interests you most?"
      },

      // WiFi - Common for remote workers
      wifi: {
        patterns: [
          /^(wifi|internet|password)$/i,
          /do you have wifi/i,
          /what's the wifi password/i
        ],
        response: "📶 Yes! We have free WiFi for all customers - perfect for remote work! Ask any barista for the current password when you visit."
      }
    };
  }

  // TIER 2: INTENT DETECTION (5-20ms)
  initializeIntents() {
    return {
      // High Priority Intents
      GET_HOURS: {
        priority: 'high',
        patterns: [
          'what time do you open tomorrow',
          'are you open on sunday',
          'when do you close today',
          'holiday hours'
        ],
        handler: this.handleHoursQuery.bind(this)
      },

      PLACE_ORDER: {
        priority: 'high',
        patterns: [
          'i want to order',
          'can i get a latte',
          'id like a cappuccino',
          'order a sandwich'
        ],
        handler: this.handleOrderStart.bind(this)
      },

      MENU_LOOKUP: {
        priority: 'high',
        patterns: [
          'do you have matcha',
          'show me cold drinks',
          'what pastries do you have',
          'breakfast menu'
        ],
        handler: this.handleMenuLookup.bind(this)
      },

      PRICES: {
        priority: 'high',
        patterns: [
          'how much is a latte',
          'price of cold brew',
          'cost of sandwich',
          'menu prices'
        ],
        handler: this.handlePriceQuery.bind(this)
      },

      // Medium Priority Intents
      DIETARY_INFO: {
        priority: 'medium',
        patterns: [
          'vegan options',
          'dairy free',
          'gluten free',
          'allergen information'
        ],
        handler: this.handleDietaryQuery.bind(this)
      },

      EVENTS_INFO: {
        priority: 'medium',
        patterns: [
          'karaoke night',
          'events',
          'workshops',
          'live music'
        ],
        handler: this.handleEventsQuery.bind(this)
      },

      DELIVERY_INFO: {
        priority: 'medium',
        patterns: [
          'do you deliver',
          'uber eats',
          'doordash',
          'pickup or delivery'
        ],
        handler: this.handleDeliveryQuery.bind(this)
      },

      // Standard Priority
      AMENITIES: {
        priority: 'standard',
        patterns: [
          'parking',
          'seating',
          'can i bring my dog',
          'pet friendly'
        ],
        handler: this.handleAmenitiesQuery.bind(this)
      },

      FEEDBACK: {
        priority: 'standard',
        patterns: [
          'complaint',
          'feedback',
          'review',
          'problem with order'
        ],
        handler: this.handleFeedback.bind(this)
      }
    };
  }

  // TIER 3: KNOWLEDGE BASE (20-100ms)
  initializeBusinessInfo() {
    return {
      location: {
        address: "2801 Frederick Douglass Blvd, New York, NY 10039",
        neighborhood: "Harlem, Manhattan",
        phone: "(917) 261-6996",
        coordinates: { lat: 40.8176, lng: -73.9482 }
      },
      
      hours: {
        monday: "7:30am - 7:00pm",
        tuesday: "7:30am - 6:00pm", 
        wednesday: "7:30am - 6:00pm",
        thursday: "7:30am - 7:00pm",
        friday: "7:30am - 10:00pm",
        saturday: "8:30am - 7:00pm",
        sunday: "9:00am - 4:00pm"
      },

      kitchenHours: {
        mondayFriday: "7:30 AM - 4:00 PM",
        saturday: "8:30 AM - 4:00 PM",
        sunday: "9:00 AM - 2:00 PM"
      },

      services: [
        "Free WiFi",
        "Remote work friendly",
        "Karaoke Friday events",
        "Workshops and events",
        "Beer & wine service",
        "Online ordering (Uber Eats, DoorDash, Postmates)"
      ],

      specialFeatures: {
        wifi: "Free WiFi for all customers",
        karaoke: "Karaoke Friday nights",
        alcohol: "Beer & wine available",
        workspace: "Laptop-friendly coworking space",
        events: "Regular workshops and community events"
      },

      socialMedia: {
        instagram: "@commongoodharlem",
        facebook: "Common Good Harlem"
      },

      rating: "4.7/5 stars (330+ reviews)"
    };
  }

  initializeMenu() {
    return {
      hotBeverages: {
        coffee: [
          { name: "Drip Coffee", price: { sm: 2.75, lg: 3.25 } },
          { name: "Latte", price: { sm: 4.75, lg: 5.25 }, rating: "97%", popular: true },
          { name: "Cappuccino", price: 4.00 },
          { name: "Americano", price: 3.50, rating: "100%" },
          { name: "Espresso", price: 4.75 },
          { name: "Macchiato", price: 5.00 },
          { name: "Cortado", price: 5.00 },
          { name: "Mocha", price: { variable: true }, rating: "100%" }
        ],
        specialty: [
          { name: "Chai Latte", price: { variable: true }, rating: "100%" },
          { name: "Matcha Latte", price: { variable: true }, rating: "100%" },
          { name: "Turmeric Latte", price: { variable: true } },
          { name: "Nutella Latte", price: { variable: true } },
          { name: "Hot Chocolate", price: { variable: true }, rating: "100%" }
        ]
      },

      coldBeverages: [
        { name: "Cold Brew", price: { sm: 5.75, lg: 6.50 }, rating: "100%", popular: true },
        { name: "Iced Latte", price: { sm: 5.25, lg: 5.50 }, popular: true },
        { name: "Iced Mocha", price: { variable: true }, popular: true },
        { name: "Fresh Orange Juice", price: 7.00, popular: true },
        { name: "Green Juice", price: 5.75, popular: true, description: "Celery, spinach, kale, green apple, cucumber, lemon, ginger" }
      ],

      food: {
        breakfast: [
          { name: "Bacon, Egg & Cheese", price: 11.25, popular: true },
          { name: "Sausage, Egg and Cheese", price: 11.25, popular: true },
          { name: "Avocado Toast", price: 12.25, rating: "93%", description: "Cherry tomatoes, red onions, feta cheese" },
          { name: "Loaded Bagel", price: 12.75, rating: "100%", description: "Cream cheese, smoked salmon, tomato, onion" },
          { name: "Overnight Oats (Vegan)", price: 9.00, description: "Banana, almonds, cinnamon" }
        ],
        sandwiches: [
          { name: "Honey Turkey & Cheese", price: 9.75, description: "With coleslaw and honey mustard" },
          { name: "Grilled Cheese Panini & Chips", price: 11.25, rating: "90%" },
          { name: "Turkey and Cheese", price: 9.00 },
          { name: "Ham and Cheese", price: 9.00 }
        ],
        salads: [
          { name: "Caesar Salad", price: 10.00, description: "Romaine, Parmesan, croutons, Caesar dressing" },
          { name: "Chicken Caesar Salad", price: 12.00, description: "With grilled chicken" }
        ]
      },

      pastries: [
        { name: "Butter Croissant", price: 5.00, rating: "88%" },
        { name: "Almond Croissant", price: 5.75, rating: "87%" },
        { name: "Apple Turnover", price: 5.25, rating: "100%" },
        { name: "Brownie", price: 5.25, rating: "100%" },
        { name: "Cranberry Scone", price: 5.50, rating: "100%" }
      ],

      addOns: {
        milkAlternatives: { price: 0.75, options: ["Coconut", "Almond", "Soy", "Oat"] },
        extraShot: 1.25,
        flavors: 0.50,
        proteins: {
          bacon: 4.25,
          turkeyBacon: 4.00,
          sausage: 4.00,
          avocado: 4.25
        }
      },

      veganOptions: [
        "Overnight Oats",
        "Kale Shake",
        "Plant-based milk alternatives",
        "Various pastries (ask barista)"
      ]
    };
  }

  // MAIN RESPONSE HANDLER WITH PRIORITY SYSTEM
  async handleMessage(userMessage, userId = 'default') {
    const startTime = Date.now();
    console.log(`🤖 Processing message: "${userMessage}"`);

    try {
      // Initialize conversation context if needed
      if (!this.conversationContext[userId]) {
        this.conversationContext[userId] = {
          visitCount: 0,
          lastInteraction: null,
          preferences: {},
          currentOrder: null
        };
      }

      // Quick response for greetings
      if (/^(hi|hello|hey)$/i.test(userMessage)) {
        return "☕ Hi! Welcome to Common Good Harlem! How can I help you today?";
      }

      // Handle introductions
      if (/i am|my name is/i.test(userMessage)) {
        return "☕ Hi! How can I help you today?";
      }

      // Handle coffee requests
      if (/coffee|latte|cappuccino/i.test(userMessage)) {
        return "☕ **COFFEE OPTIONS:**\n• Latte: SM $4.75, LG $5.25\n• Cappuccino: $4.00\n• Americano: $3.50\n• Cold Brew: SM $5.75, LG $6.50\n\nWhich would you like?";
      }

      // Handle milk preferences
      if (/oat milk|almond milk|soy milk/i.test(userMessage)) {
        return "➕ Milk alternatives: +$0.75\n\nWould you like to proceed with your order?";
      }

      // Handle hours requests
      if (/hours|open|close/i.test(userMessage)) {
        return this.formatBusinessHours();
      }

      // Handle location requests
      if (/location|address|where/i.test(userMessage)) {
        return this.formatLocationInfo();
      }

      // Handle dine-in requests
      if (/dine|sit|table/i.test(userMessage)) {
        return "🪑 We have seating available! Our hours are:\n" + this.formatBusinessHours() + "\n\nWould you like to see our menu?";
      }

      const response = await this.handleResponseWithPriority(userMessage, userId);
      const totalTime = Date.now() - startTime;
      
      console.log(`⚡ Total response time: ${totalTime}ms`);
      
      // Update conversation context
      this.conversationContext[userId].lastInteraction = new Date();
      this.conversationContext[userId].visitCount++;

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I apologize, but I'm having trouble right now. Please try again or call us at (917) 261-6996 for immediate assistance!";
    }
  }

  async handleResponseWithPriority(message, userId) {
    const cleanMessage = message.toLowerCase().trim();

    // TIER 1: Quick Matchers (0-5ms)
    const quickStart = Date.now();
    const quickResponse = this.tryQuickMatch(cleanMessage);
    if (quickResponse) {
      console.log(`⚡ Quick match found in ${Date.now() - quickStart}ms`);
      return quickResponse;
    }

    // TIER 2: Intent Detection (5-20ms)
    const intentStart = Date.now();
    const intentResponse = await this.tryIntentMatch(message, userId);
    if (intentResponse) {
      console.log(`🎯 Intent match found in ${Date.now() - intentStart}ms`);
      return intentResponse;
    }

    // TIER 3: Knowledge Base Search (20-100ms)
    const kbStart = Date.now();
    const kbResponse = this.tryKnowledgeBaseSearch(cleanMessage);
    if (kbResponse) {
      console.log(`📚 Knowledge base match found in ${Date.now() - kbStart}ms`);
      return kbResponse;
    }

    // TIER 4: LLM Fallback (500-2000ms)
    const llmStart = Date.now();
    const llmResponse = await this.generateContextualResponse(message, userId);
    console.log(`🧠 LLM response generated in ${Date.now() - llmStart}ms`);
    return llmResponse;
  }

  // TIER 1 IMPLEMENTATION
  tryQuickMatch(message) {
    for (const [category, data] of Object.entries(this.quickResponses)) {
      if (data.patterns) {
        for (const pattern of data.patterns) {
          if (pattern.test(message)) {
            return Array.isArray(data.responses) 
              ? data.responses[Math.floor(Math.random() * data.responses.length)]
              : data.response;
          }
        }
      } else if (data.response && data.patterns) {
        // Single pattern check
        if (data.patterns.some(pattern => pattern.test(message))) {
          return data.response;
        }
      }
    }
    return null;
  }

  // TIER 2 IMPLEMENTATION
  async tryIntentMatch(message, userId) {
    const intent = this.findBestIntent(message);
    if (intent) {
      return await intent.handler(message, userId);
    }
    return null;
  }

  findBestIntent(message) {
    const words = message.toLowerCase().split(' ');
    let bestMatch = null;
    let bestScore = 0;

    for (const [intentName, intentData] of Object.entries(this.intents)) {
      let score = 0;
      
      for (const pattern of intentData.patterns) {
        const patternWords = pattern.toLowerCase().split(' ');
        const matchCount = patternWords.filter(word => 
          words.some(msgWord => msgWord.includes(word) || word.includes(msgWord))
        ).length;
        
        const patternScore = matchCount / patternWords.length;
        score = Math.max(score, patternScore);
      }

      // Priority weighting
      const priorityMultiplier = intentData.priority === 'high' ? 1.2 : 
                                intentData.priority === 'medium' ? 1.1 : 1.0;
      score *= priorityMultiplier;

      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = intentData;
      }
    }

    return bestMatch;
  }

  // INTENT HANDLERS
  async handleHoursQuery(message, userId) {
    return this.formatBusinessHours();
  }

  async handleOrderStart(message, userId) {
    if (!this.orderContext[userId]) {
      this.orderContext[userId] = {
        items: [],
        total: 0,
        stage: 'collecting'
      };
    }

    const extractedItems = this.extractMenuItems(message);
    if (extractedItems.length > 0) {
      return this.processOrderItems(extractedItems, userId);
    }

    return "☕ **POPULAR ITEMS:**\n• Latte: SM $4.75, LG $5.25\n• Cold Brew: SM $5.75, LG $6.50\n• Bacon, Egg & Cheese: $11.25\n\nWhat would you like to order?";
  }

  async handleMenuLookup(message, userId) {
    const category = this.extractMenuCategory(message);
    
    if (category === 'drinks' || category === 'coffee') {
      return this.formatDrinksMenu();
    } else if (category === 'food' || category === 'breakfast') {
      return this.formatFoodMenu();
    } else if (category === 'pastries') {
      return this.formatPastriesMenu();
    }

    return "📋 **MENU CATEGORIES:**\n• Hot Drinks\n• Cold Drinks\n• Food & Pastries\n• Beer & Wine\n\nWhich would you like to see?";
  }

  async handlePriceQuery(message, userId) {
    const item = this.extractSpecificItem(message);
    if (item) {
      return this.formatItemPrice(item);
    }

    return "💰 **POPULAR PRICES:**\n• Latte: SM $4.75, LG $5.25\n• Cold Brew: SM $5.75, LG $6.50\n• Bacon, Egg & Cheese: $11.25\n• Avocado Toast: $12.25\n\nWhat specific item would you like pricing for?";
  }

  async handleDietaryQuery(message, userId) {
    if (message.includes('vegan')) {
      return "🌱 **VEGAN OPTIONS:**\n• Overnight Oats: $9.00\n• Kale Shake: $10.25\n• Plant-based milk: +$0.75\n• Fresh juices";
    }

    if (message.includes('gluten')) {
      return "🌾 Please ask your barista about gluten-free options when ordering.";
    }

    return "🥗 **DIETARY OPTIONS:**\n• Vegan options available\n• Plant-based milk: +$0.75\n• Gluten-conscious choices\n\nPlease inform barista of any allergies.";
  }

  async handleEventsQuery(message, userId) {
    return "🎉 **EVENTS:**\n• Karaoke Fridays\n• Workshops\n• Community Events\n\n📱 Follow @commongoodharlem for updates";
  }

  async handleDeliveryQuery(message, userId) {
    return "🚚 **DELIVERY:**\n• Uber Eats\n• DoorDash\n• Postmates\n\n⏰ Order hours: 8am-3pm daily";
  }

  async handleAmenitiesQuery(message, userId) {
    return "🏪 **AMENITIES:**\n• Free WiFi\n• Laptop-friendly\n• Beer & wine\n• Street parking\n\n🐕 Pet policy: Ask barista";
  }

  async handleFeedback(message, userId) {
    return "📝 **CONTACT:**\n• Phone: (917) 261-6996\n• Social: @commongoodharlem\n• Google/Yelp reviews";
  }

  // TIER 3 IMPLEMENTATION
  tryKnowledgeBaseSearch(message) {
    // Search through structured data
    const searchTerms = message.split(' ');
    
    // Business hours search
    if (searchTerms.some(term => ['hour', 'open', 'close', 'time'].includes(term))) {
      return this.formatBusinessHours();
    }

    // Location search
    if (searchTerms.some(term => ['address', 'location', 'where', 'directions'].includes(term))) {
      return this.formatLocationInfo();
    }

    // Menu item search
    const menuItem = this.searchMenuItems(searchTerms);
    if (menuItem) {
      return this.formatMenuItemInfo(menuItem);
    }

    // Services search
    if (searchTerms.some(term => ['wifi', 'internet', 'work', 'laptop'].includes(term))) {
      return "📶 Yes! We have free WiFi and are very laptop/remote work friendly. Perfect spot to get work done with great coffee! ☕💻";
    }

    return null;
  }

  // TIER 4 IMPLEMENTATION
  async generateContextualResponse(message, userId) {
    const lowerMessage = message.toLowerCase();

    // High priority intents
    if (lowerMessage.includes('order') || lowerMessage.includes('get') || lowerMessage.includes('want')) {
      return "☕ **POPULAR ITEMS:**\n• Latte: SM $4.75, LG $5.25\n• Cold Brew: SM $5.75, LG $6.50\n• Bacon, Egg & Cheese: $11.25\n\nWhat would you like?";
    }

    if (lowerMessage.includes('menu')) {
      return "📋 **MENU:**\n• Hot Drinks\n• Cold Drinks\n• Food & Pastries\n• Beer & Wine\n\nWhich category?";
    }

    if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('close')) {
      return `☕ **HOURS:**\n📅 Mon: 7:30am-7:00pm\n📅 Tue-Wed: 7:30am-6:00pm\n📅 Thu: 7:30am-7:00pm\n📅 Fri: 7:30am-10:00pm\n📅 Sat: 8:30am-7:00pm\n📅 Sun: 9:00am-4:00pm`;
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
      return "📍 2801 Frederick Douglass Blvd, Harlem\n📞 (917) 261-6996";
    }

    // Medium priority intents
    if (lowerMessage.includes('vegan') || lowerMessage.includes('dairy') || lowerMessage.includes('gluten')) {
      return "🌱 **DIETARY:**\n• Vegan options available\n• Plant-based milk: +$0.75\n• Gluten-conscious choices\n\nAsk barista for details";
    }

    if (lowerMessage.includes('event') || lowerMessage.includes('karaoke') || lowerMessage.includes('workshop')) {
      return "🎉 **EVENTS:**\n• Karaoke Fridays\n• Workshops\n• Community Events\n\n📱 @commongoodharlem";
    }

    if (lowerMessage.includes('deliver') || lowerMessage.includes('uber') || lowerMessage.includes('doordash')) {
      return "🚚 **DELIVERY:**\n• Uber Eats\n• DoorDash\n• Postmates\n\n⏰ 8am-3pm daily";
    }

    // Standard priority intents
    if (lowerMessage.includes('wifi') || lowerMessage.includes('internet') || lowerMessage.includes('work')) {
      return "📶 Free WiFi available\n💻 Laptop-friendly space";
    }

    if (lowerMessage.includes('parking') || lowerMessage.includes('pet') || lowerMessage.includes('dog')) {
      return "🏪 **AMENITIES:**\n• Free WiFi\n• Laptop-friendly\n• Beer & wine\n• Street parking\n\n🐕 Pet policy: Ask barista";
    }

    if (lowerMessage.includes('feedback') || lowerMessage.includes('contact')) {
      return "📝 **CONTACT:**\n• Phone: (917) 261-6996\n• Social: @commongoodharlem\n• Google/Yelp reviews";
    }

    // Default response
    return "How can I help?\n• Menu & Prices\n• Place Order\n• Hours & Location\n• Events & Amenities";
  }

  // UTILITY METHODS
  extractDayFromMessage(message) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = ['today'];
    const tomorrow = ['tomorrow'];
    
    const words = message.toLowerCase().split(' ');
    
    for (const word of words) {
      if (days.includes(word)) return word;
    }
    
    // Handle today/tomorrow logic would require actual date handling
    return null;
  }

  extractMenuItems(message) {
    const items = [];
    const menuItems = [
      'latte', 'cappuccino', 'americano', 'espresso', 'cold brew',
      'bacon egg cheese', 'avocado toast', 'bagel', 'croissant'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    for (const item of menuItems) {
      if (lowerMessage.includes(item)) {
        items.push(item);
      }
    }
    
    return items;
  }

  extractMenuCategory(message) {
    const categories = {
      drinks: ['drink', 'coffee', 'beverage', 'latte', 'cold'],
      food: ['food', 'eat', 'breakfast', 'sandwich', 'bagel'],
      pastries: ['pastry', 'pastries', 'croissant', 'muffin', 'scone']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }

  formatDrinksMenu() {
    return "☕ **DRINKS:**\n• Latte: SM $4.75, LG $5.25\n• Cold Brew: SM $5.75, LG $6.50\n• Cappuccino: $4.00\n• Americano: $3.50\n\n🧊 **COLD:**\n• Iced Latte: SM $5.25, LG $5.50\n• Fresh Juice: $7.00\n\n➕ Milk: +$0.75";
  }

  formatFoodMenu() {
    return "🥐 **FOOD:**\n• Bacon, Egg & Cheese: $11.25\n• Avocado Toast: $12.25\n• Loaded Bagel: $12.75\n• Grilled Cheese: $11.25\n\n🥯 **PASTRIES:**\n• Croissant: $5.00\n• Almond Croissant: $5.75";
  }

  formatPastriesMenu() {
    return "🥐 **PASTRIES:**\n• Butter Croissant: $5.00\n• Almond Croissant: $5.75\n• Apple Turnover: $5.25\n• Brownie: $5.25\n• Cranberry Scone: $5.50";
  }

  formatItemPrice(item) {
    const menuItem = this.menu.hotBeverages.coffee.find(i => i.name.toLowerCase() === item.toLowerCase());
    if (menuItem) {
      return `☕ ${menuItem.name}: ${menuItem.price.sm} - ${menuItem.price.lg}`;
    }
    return "Sorry, I couldn't find that item in our menu.";
  }

  formatBusinessHours() {
    return `☕ **HOURS:**\n📅 Mon: 7:30am-7:00pm\n📅 Tue-Wed: 7:30am-6:00pm\n📅 Thu: 7:30am-7:00pm\n📅 Fri: 7:30am-10:00pm\n📅 Sat: 8:30am-7:00pm\n📅 Sun: 9:00am-4:00pm`;
  }

  formatLocationInfo() {
    return "📍 2801 Frederick Douglass Blvd, Harlem\n📞 (917) 261-6996";
  }

  formatMenuItemInfo(item) {
    const menuItem = this.menu.hotBeverages.coffee.find(i => i.name.toLowerCase() === item.toLowerCase());
    if (menuItem) {
      return `☕ ${menuItem.name}: ${menuItem.price.sm} - ${menuItem.price.lg}`;
    }
    return "Sorry, I couldn't find that item in our menu.";
  }

  searchMenuItems(terms) {
    const menuItems = [
      ...this.menu.hotBeverages.coffee,
      ...this.menu.coldBeverages,
      ...this.menu.food.breakfast,
      ...this.menu.food.sandwiches,
      ...this.menu.food.salads,
      ...this.menu.pastries,
      ...this.menu.hotBeverages.specialty
    ];

    for (const term of terms) {
      for (const item of menuItems) {
        if (item.name.toLowerCase().includes(term.toLowerCase())) {
          return item.name;
        }
      }
    }
    return null;
  }

  processOrderItems(items, userId) {
    const order = this.orderContext[userId];
    let response = "🛒 **ORDER:**\n";
    
    for (const item of items) {
      const menuItem = this.findMenuItem(item);
      if (menuItem) {
        order.items.push(menuItem);
        order.total += menuItem.price;
        response += `• ${menuItem.name}: $${menuItem.price}\n`;
      }
    }
    
    response += `\n💰 Total: $${order.total.toFixed(2)}\n\nAdd anything else?`;
    return response;
  }

  findMenuItem(itemName) {
    const allItems = [
      ...this.menu.hotBeverages.coffee,
      ...this.menu.coldBeverages,
      ...this.menu.food.breakfast,
      ...this.menu.food.sandwiches,
      ...this.menu.pastries
    ];
    
    return allItems.find(item => 
      item.name.toLowerCase().includes(itemName.toLowerCase())
    );
  }
}