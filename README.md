# Common Good Harlem Chatbot

A sophisticated conversational AI chatbot for Common Good Harlem café, designed to handle customer interactions, orders, and inquiries in a natural, barista-like manner.

## Quick Start Guide

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn package manager
- OpenRouter API key (get it from [OpenRouter](https://openrouter.ai/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shivakarthik09/Chatbot_LLM.git
cd Chatbot_LLM
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create a .env file in the root directory
touch .env
```

4. Add the following to your .env file:
```
PORT=3001
NODE_ENV=development
LLM_API_KEY=your_openrouter_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Overview

This chatbot is built using a modern tech stack and implements a robust architecture for handling customer interactions, orders, and information requests. The system uses natural language processing through OpenRouter's LLM API and maintains context-aware conversations.

## System Architecture

### Core Components

1. **Server (server.js)**
   - Express.js backend server
   - Handles API routes and static file serving
   - Manages conversation context and user sessions
   - Implements order processing logic

2. **Chat Router (chatRouter.js)**
   - Manages chat endpoints and message handling
   - Processes user intents and generates responses
   - Handles conversation flow and context management

3. **Intent Engine (intentEngine.js)**
   - Processes natural language input
   - Matches user queries to predefined intents
   - Manages conversation flow and context

4. **Knowledge Base (knowledgeBase.json)**
   - Contains predefined responses and patterns
   - Stores business rules and conversation flows
   - Maintains menu and order information

### Data Management

- **Menu Data (menu.json)**
  - Complete menu items and categories
  - Pricing and availability information
  - Dietary and allergen information

- **Order Management (order.json)**
  - Order flow definitions
  - Payment processing rules
  - Order status tracking

- **Basic Replies (basic_replies.json)**
  - Common response templates
  - Error messages and fallbacks
  - System notifications

## Features

### 1. Natural Language Processing
- Context-aware conversations
- Intent recognition and matching
- Dynamic response generation
- Personality-consistent interactions

### 2. Order Management
- Real-time order processing
- Menu item lookup and validation
- Order customization
- Payment processing integration
- Order status tracking

### 3. Customer Experience
- Personalized interactions
- Progressive information disclosure
- Quick reply suggestions
- Context maintenance
- Error recovery

### 4. Information Services
- Menu browsing and search
- Store information access
- Hours and location details
- Special offers and promotions

## Technical Implementation

### Backend Stack
- Node.js with Express
- In-memory data storage
- RESTful API architecture
- WebSocket support for real-time updates

### Frontend Integration
- React-based user interface
- Material-UI components
- Responsive design
- Progressive Web App capabilities

### Security Features
- Rate limiting
- CORS protection
- Input validation
- Secure session management

## Setup and Installation

1. **Prerequisites**
   - Node.js >= 14.0.0
   - npm or yarn package manager

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Environment Variables**
   ```
   LLM_API_KEY=your_api_key
   PORT=3001
   NODE_ENV=development
   ```

4. **Running the Application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run prod

   # Server only
   npm run server
   ```

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Process chat messages
- `GET /api/context` - Get conversation context
- `POST /api/order` - Process orders
- `GET /api/menu` - Get menu information

### Order Endpoints
- `POST /api/order/create` - Create new order
- `PUT /api/order/update` - Update existing order
- `GET /api/order/status` - Get order status
- `POST /api/order/checkout` - Process checkout

## Development Guidelines

### Code Structure
- Follow modular architecture
- Maintain separation of concerns
- Use consistent naming conventions
- Document all major functions

### Testing
- Write unit tests for core functionality
- Implement integration tests
- Maintain test coverage
- Use Jest for testing

### Error Handling
- Implement proper error boundaries
- Use try-catch blocks
- Log errors appropriately
- Provide user-friendly error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Write/update tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or inquiries:
- Email: info@commongoodharlem.com
- Phone: (212) 567-8901
- GitHub Issues: [Repository Issues Page] 