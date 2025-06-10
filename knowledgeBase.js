const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Knowledge base for LLM responses and suggestions
const knowledgeBase = {
  // Menu categories and items with detailed information
  menu: {
    hotDrinks: {
      latte: {
        description: "Rich espresso with steamed milk and a light layer of foam",
        price: { small: 3.50, medium: 4.00, large: 4.50 },
        customizations: ["Vanilla", "Caramel", "Hazelnut", "Extra Shot"],
        popularPairings: ["Croissant", "Chocolate Chip Cookie"],
        suggestions: [
          "Would you like to try our seasonal latte flavors?",
          "Would you like to add any flavor syrups to your latte?",
          "Would you like to know about our milk alternatives?"
        ]
      },
      cappuccino: {
        description: "Equal parts espresso, steamed milk, and foam",
        price: { small: 3.00, medium: 3.50, large: 4.00 },
        customizations: ["Vanilla", "Caramel", "Extra Shot"],
        popularPairings: ["Almond Croissant", "Biscotti"],
        suggestions: [
          "Would you like to try our traditional Italian-style cappuccino?",
          "Would you like to know about our foam art options?",
          "Would you like to pair it with a pastry?"
        ]
      }
    },
    coldDrinks: {
      icedCoffee: {
        description: "Chilled coffee served over ice",
        price: { small: 3.00, medium: 3.50, large: 4.00 },
        customizations: ["Vanilla", "Caramel", "Extra Shot"],
        popularPairings: ["Chocolate Chip Cookie", "Sandwich"],
        suggestions: [
          "Would you like to try our cold brew instead?",
          "Would you like to add any flavor syrups?",
          "Would you like to know about our iced coffee brewing process?"
        ]
      },
      frappuccino: {
        description: "Blended ice drink with coffee and milk",
        price: { small: 4.00, medium: 4.50, large: 5.00 },
        customizations: ["Whipped Cream", "Extra Shot", "Caramel Drizzle"],
        popularPairings: ["Brownie", "Chocolate Chip Cookie"],
        suggestions: [
          "Would you like to try our seasonal frappuccino flavors?",
          "Would you like to add any toppings?",
          "Would you like to know about our dairy-free options?"
        ]
      }
    },
    food: {
      croissant: {
        description: "Buttery, flaky pastry",
        price: 2.50,
        varieties: ["Plain", "Chocolate", "Almond"],
        popularPairings: ["Latte", "Cappuccino"],
        suggestions: [
          "Would you like to try our chocolate or almond croissant?",
          "Would you like it warmed up?",
          "Would you like to pair it with a coffee?"
        ]
      },
      sandwich: {
        description: "Fresh sandwich with your choice of fillings",
        price: 5.00,
        options: {
          bread: ["Multigrain", "Sourdough", "Baguette"],
          fillings: ["Chicken", "Vegetarian", "Beef"],
          cheese: ["Cheddar", "Swiss", "Provolone"]
        },
        popularPairings: ["Iced Coffee", "Sparkling Water"],
        suggestions: [
          "Would you like to customize your sandwich?",
          "Would you like to know about our vegetarian options?",
          "Would you like to add a side or drink?"
        ]
      }
    }
  },

  // Frequently Asked Questions
  faqs: {
    general: [
      {
        question: "What are your opening hours?",
        answer: "We're open Monday to Friday from 7:00 AM to 7:00 PM, and Saturday to Sunday from 8:00 AM to 6:00 PM.",
        suggestions: [
          "Would you like to know about our holiday hours?",
          "Would you like to know about our busiest times?",
          "Would you like to make a reservation?"
        ]
      },
      {
        question: "Do you offer delivery?",
        answer: "Yes, we offer delivery through DoorDash and Uber Eats. Delivery times typically range from 15-30 minutes.",
        suggestions: [
          "Would you like to place a delivery order?",
          "Would you like to know about our delivery radius?",
          "Would you like to know about our delivery fees?"
        ]
      }
    ],
    menu: [
      {
        question: "Do you have dairy-free options?",
        answer: "Yes, we offer almond milk, oat milk, and soy milk as dairy alternatives for all our drinks.",
        suggestions: [
          "Would you like to know about our dairy-free menu items?",
          "Would you like to try our dairy-free specialty drinks?",
          "Would you like to know about our allergen information?"
        ]
      },
      {
        question: "What are your most popular items?",
        answer: "Our most popular items include our signature latte, chocolate croissant, and iced coffee. We also have seasonal specials that change regularly.",
        suggestions: [
          "Would you like to try our signature drinks?",
          "Would you like to know about our seasonal specials?",
          "Would you like to see our bestsellers?"
        ]
      }
    ],
    policies: [
      {
        question: "What is your return policy?",
        answer: "We accept returns of unopened food items within 24 hours of purchase. For drinks, we'll remake any drink that doesn't meet your expectations.",
        suggestions: [
          "Would you like to know about our quality guarantee?",
          "Would you like to know about our customer satisfaction policy?",
          "Would you like to provide feedback?"
        ]
      },
      {
        question: "Do you accept reservations?",
        answer: "Yes, we accept reservations for groups of 6 or more. Please call or use our online booking system at least 24 hours in advance.",
        suggestions: [
          "Would you like to make a reservation?",
          "Would you like to know about our group booking options?",
          "Would you like to know about our private event spaces?"
        ]
      }
    ]
  },

  // Intent-based responses and patterns
  intents: {
    greeting: {
      patterns: ["hi", "hello", "hey", "good morning", "good afternoon"],
      responses: [
        "Hi there! 👋 I'm your virtual barista. How can I help you today?",
        "Hello! Welcome to our coffee shop. What can I get for you?",
        "Hey there! Ready to explore our menu?"
      ],
      suggestions: [
        "Would you like to see our menu?",
        "Would you like to know about our specials?",
        "Would you like to place an order?"
      ]
    },
    menu: {
      patterns: ["menu", "drinks", "food", "what do you serve", "coffee", "latte", "cappuccino"],
      responses: [
        "Here's our menu! We have a variety of hot and cold drinks, plus delicious food items.",
        "I'd be happy to show you our menu. We offer both drinks and food items.",
        "Let me show you what we have available today."
      ],
      suggestions: [
        "Would you like to know about our seasonal specials?",
        "Would you like to customize your order?",
        "Would you like to know about our popular pairings?"
      ]
    },
    order: {
      patterns: ["order", "buy", "get", "want", "would like"],
      responses: [
        "Great! Let's start your order. What would you like?",
        "I'll help you place your order. What can I get for you?",
        "Ready to order! What would you like to try?"
      ],
      suggestions: [
        "Would you like to see our menu first?",
        "Would you like to know about our combo deals?",
        "Would you like to customize your order?"
      ]
    }
  },

  // PDF Information Storage
  pdfInfo: {
    // Store PDF content in chunks for better retrieval
    chunks: [],
    pdfPath: "C:\\silicon chatbot\\Knowledgebase.pdf",
    
    // Initialize PDF content
    async initialize() {
      try {
        if (fs.existsSync(this.pdfPath)) {
          console.log('Loading PDF content from:', this.pdfPath);
          const dataBuffer = fs.readFileSync(this.pdfPath);
          const data = await pdfParse(dataBuffer);
          
          // Split content into manageable chunks (e.g., by paragraphs)
          this.chunks = data.text
            .split(/\n\s*\n/)
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 0);
            
          console.log(`Successfully loaded ${this.chunks.length} chunks from PDF`);
          return true;
        } else {
          console.error('PDF file not found at:', this.pdfPath);
          return false;
        }
      } catch (error) {
        console.error('Error initializing PDF content:', error);
        return false;
      }
    },

    // Load PDF content from a different path
    async loadPDFContent(pdfPath) {
      try {
        if (fs.existsSync(pdfPath)) {
          this.pdfPath = pdfPath;
          const dataBuffer = fs.readFileSync(pdfPath);
          const data = await pdfParse(dataBuffer);
          
          // Split content into manageable chunks (e.g., by paragraphs)
          this.chunks = data.text
            .split(/\n\s*\n/)
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 0);
            
          console.log(`Successfully loaded ${this.chunks.length} chunks from PDF at ${pdfPath}`);
          return true;
        } else {
          console.error('PDF file not found at:', pdfPath);
          return false;
        }
      } catch (error) {
        console.error('Error loading PDF content:', error);
        return false;
      }
    },

    // Search PDF content with improved relevance
    searchPDFContent: function(query) {
      const lowerQuery = query.toLowerCase();
      const results = this.chunks
        .map(chunk => ({
          content: chunk,
          relevance: this.calculateRelevance(chunk, lowerQuery)
        }))
        .filter(result => result.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);

      return results.map(result => result.content);
    },

    // Calculate relevance score for search results
    calculateRelevance: function(chunk, query) {
      const lowerChunk = chunk.toLowerCase();
      const words = query.split(/\s+/);
      
      // Count exact matches
      const exactMatches = words.filter(word => lowerChunk.includes(word)).length;
      
      // Count partial matches
      const partialMatches = words.reduce((count, word) => {
        const regex = new RegExp(word, 'gi');
        const matches = (lowerChunk.match(regex) || []).length;
        return count + matches;
      }, 0);

      // Calculate relevance score
      return (exactMatches * 2) + partialMatches;
    },

    // Get PDF content status
    getStatus: function() {
      return {
        loaded: this.chunks.length > 0,
        path: this.pdfPath,
        chunksCount: this.chunks.length
      };
    }
  },

  // Helper functions to access the knowledge base
  getMenuSuggestions: function(category, item) {
    if (this.menu[category] && this.menu[category][item]) {
      return this.menu[category][item].suggestions;
    }
    return [];
  },

  getFAQAnswer: function(category, question) {
    const faq = this.faqs[category]?.find(f => 
      f.question.toLowerCase().includes(question.toLowerCase())
    );
    return faq ? { answer: faq.answer, suggestions: faq.suggestions } : null;
  },

  getItemDetails: function(category, item) {
    return this.menu[category]?.[item] || null;
  },

  getIntentResponse: function(intent, message) {
    const intentData = this.intents[intent];
    if (!intentData) return null;

    // Find matching pattern
    const matchingPattern = intentData.patterns.find(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );

    if (matchingPattern) {
      return {
        response: intentData.responses[Math.floor(Math.random() * intentData.responses.length)],
        suggestions: intentData.suggestions
      };
    }

    return null;
  },

  // Function to generate context-aware suggestions
  generateSuggestions: function(context, lastMessage, category) {
    const suggestions = [];
    
    // Add category-specific suggestions
    if (category === 'menu') {
      suggestions.push(
        "Would you like to know about our seasonal specials?",
        "Would you like to customize your order?",
        "Would you like to know about our popular pairings?"
      );
    } else if (category === 'faq') {
      suggestions.push(
        "Would you like to know more about our policies?",
        "Would you like to see our menu?",
        "Would you like to place an order?"
      );
    }

    // Add context-aware suggestions based on last message
    if (lastMessage.toLowerCase().includes('price')) {
      suggestions.push(
        "Would you like to know about our combo deals?",
        "Would you like to see our value menu?",
        "Would you like to know about our loyalty program?"
      );
    }

    return suggestions;
  },

  // Function to update intent responses
  updateIntentResponse: function(intent, newResponse) {
    if (this.intents[intent]) {
      this.intents[intent].responses.push(newResponse);
      return true;
    }
    return false;
  },

  // Function to add new intent
  addIntent: function(intent, patterns, responses, suggestions) {
    this.intents[intent] = {
      patterns,
      responses,
      suggestions
    };
  }
};

// Initialize PDF content when the module is loaded
(async () => {
  try {
    await knowledgeBase.pdfInfo.initialize();
  } catch (error) {
    console.error('Error during PDF initialization:', error);
  }
})();

module.exports = knowledgeBase; 