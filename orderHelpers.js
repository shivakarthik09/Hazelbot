// orderHelpers.js
const fs = require('fs');
const menu = JSON.parse(fs.readFileSync('./menu.json', 'utf-8'));

function generateOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function addItemToOrder(order, itemName, quantity = 1) {
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

function calculateOrderTotal(order) {
  let total = 0;
  order.items.forEach(item => {
    total += item.price * item.quantity;
  });
  return total;
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

module.exports = {
  generateOrderId,
  addItemToOrder,
  calculateOrderTotal,
  formatOrderSummary
}; 