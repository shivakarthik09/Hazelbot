# Common Good Harlem Chatbot

A conversational AI chatbot for Common Good Harlem café, built with Node.js and React. The chatbot helps customers with menu information, ordering, reservations, and general inquiries about the café.

## 🌟 Features

### Menu & Ordering
- Interactive menu display with categories (Hot Drinks, Cold Drinks, Food Items)
- Real-time order management
- Add items to cart with size options
- Special add-ons for food items
- Price calculation and order total
- Order status tracking

### Café Information
- Operating hours with busy period indicators
- Location and directions
- Contact information
- Special offers and promotions
- Holiday hours

### Events & Activities
- Live Music Night (Fridays)
- Poetry Night (Saturdays)
- Community Meetup (Sundays)
- Event registration
- Special event discounts

### Additional Features
- Student discounts
- Happy hour specials
- DoorDash integration
- Reservation system
- Feedback collection

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd silicon-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
NODE_ENV=development
```

### Running the Application

1. Start the server:
```bash
npm run server
```
The server will start on http://localhost:3001

2. Start the frontend (in a new terminal):
```bash
npm start
```
The frontend will be available at http://localhost:3000

## 📁 Project Structure

```
silicon-chatbot/
├── server.js              # Main server file
├── knowledgeBase.json     # Chatbot knowledge and responses
├── package.json          # Project dependencies
├── public/               # Static files
├── src/                  # React frontend code
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── styles/          # CSS styles
│   └── App.js           # Main React component
└── README.md            # Project documentation
```

## 💬 Chatbot Commands

### Menu & Ordering
- "Show menu" - Display the complete menu
- "Start order" - Begin a new order
- "Add [item]" - Add an item to your order
- "Check total" - View order total
- "Complete order" - Finish and submit order

### Information
- "Hours" - View operating hours
- "Location" - Get café location and directions
- "Contact" - View contact information
- "Events" - See upcoming events
- "Specials" - View current promotions

## 🔧 Configuration

The chatbot's responses and knowledge base can be modified in `knowledgeBase.json`. This file contains:
- Menu items and prices
- Operating hours
- Event information
- Special offers
- Common responses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Common Good Harlem for the menu and information
- All contributors who have helped with the project 