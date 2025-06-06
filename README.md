# Common Good Harlem Chatbot

A conversational AI chatbot for Common Good Harlem café, providing information about menu items, hours, events, and handling reservations.

## Features

- **Menu & Ordering**
  - View complete menu with prices
  - Start new orders
  - View order history
  - Track order status
  - Special offers and promotions

- **Café Information**
  - Operating hours
  - Location and directions
  - Contact information
  - Special events
  - Reservation system

- **Events & Community**
  - Live music nights
  - Poetry readings
  - Community meetups
  - Event registration
  - Special event details

- **Additional Features**
  - Real-time order tracking
  - Reservation management
  - Special offers and discounts
  - Student discounts
  - Bring your own cup program

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shivakarthik09/Hazelbot.git
cd Hazelbot
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

1. Start the development server:
```bash
npm run server
```

2. In a separate terminal, start the React development server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

The application will be available at: https://shivakarthik09.github.io/Hazelbot

## Project Structure

```
Hazelbot/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Chat.js
│   │   ├── Menu.js
│   │   └── Events.js
│   ├── App.js
│   └── index.js
├── server.js
├── knowledgeBase.json
├── package.json
└── README.md
```

## Chatbot Commands

The chatbot understands various commands and intents:

- **Menu Related**
  - "Show menu"
  - "What's on the menu?"
  - "Start order"
  - "View order history"

- **Café Information**
  - "What are your hours?"
  - "Where are you located?"
  - "How can I contact you?"
  - "Tell me about your events"

- **Events & Reservations**
  - "Register for event"
  - "Show upcoming events"
  - "Make a reservation"
  - "Cancel reservation"

- **Special Offers**
  - "What are today's specials?"
  - "Tell me about happy hour"
  - "Student discount information"
  - "BYOC program details"

## Configuration

The chatbot's knowledge base can be modified in `knowledgeBase.json`. This file contains:
- Menu items and prices
- Operating hours
- Event information
- Special offers
- Reservation policies

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Shiva Karthik** - *Initial work* - [shivakarthik09](https://github.com/shivakarthik09)

## Acknowledgments

- Common Good Harlem café for providing the menu and information
- React.js community for the amazing framework
- All contributors who have helped improve the chatbot 