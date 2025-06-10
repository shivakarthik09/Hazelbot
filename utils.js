// utils.js
function formatResponse(text, type = 'general') {
  return text;
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
  return followUps[intent] || followUps.default;
}

function formatQuickReplies(replies) {
  return replies.map(reply => reply.trim());
}

module.exports = {
  formatResponse,
  getFollowUpQuestions,
  formatQuickReplies
}; 