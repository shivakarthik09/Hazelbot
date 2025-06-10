// menuHelpers.js
const fs = require('fs');
const menu = JSON.parse(fs.readFileSync('./menu.json', 'utf-8'));

function findMenuItemByName(message) {
  const allItems = [
    ...menu.drinks.map(d => d.name),
    ...menu.coldDrinks.map(d => d.name),
    ...menu.food.map(f => f.name),
  ];
  const lowerMsg = message.toLowerCase();
  return allItems.find(item => lowerMsg.includes(item.toLowerCase()));
}

function getSignatureDrinks() {
  return {
    hot: menu.drinks.filter(d => ['Latte', 'Matcha'].includes(d.name)),
    cold: menu.coldDrinks.filter(d => ['Cold Brew'].includes(d.name))
  };
}

function formatMenuResponse(menuData) {
  let response = '';
  if (!menuData) menuData = menu;
  response += 'Hot Drinks:\n';
  menuData.drinks.forEach(item => {
    response += `  - ${item.name}: ${Object.entries(item.price).map(([size, price]) => `${size}: $${price}`).join(', ')}\n`;
  });
  response += '\nCold Drinks:\n';
  menuData.coldDrinks.forEach(item => {
    response += `  - ${item.name}: ${Object.entries(item.price).map(([size, price]) => `${size}: $${price}`).join(', ')}\n`;
  });
  response += '\nFood Items:\n';
  menuData.food.forEach(item => {
    response += `  - ${item.name}: ${item.basePrice ? `$${item.basePrice}` : Object.entries(item.price).map(([type, price]) => `${type}: $${price}`).join(', ')}\n`;
  });
  response += '\n📍 For our complete menu and special items, visit our DoorDash page:\n';
  response += 'https://www.doordash.com/store/common-good-harlem-new-york-24627565/58781546/\n\n';
  response += 'Would you like to start an order or know more about any specific item?';
  return response;
}

module.exports = {
  findMenuItemByName,
  getSignatureDrinks,
  formatMenuResponse
}; 