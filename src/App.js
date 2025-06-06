import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import localforage from 'localforage';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513', // SaddleBrown, coffee color
    },
    secondary: {
      main: '#D2B48C', // Tan, lighter coffee color
    },
  },
});

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://hazelbot-backend.onrender.com/api' // Production backend API URL on Render
  : 'http://localhost:3001/api'; // Development backend API URL

// Log the API_URL to the console for debugging
console.log('API_URL:', API_URL);

const MenuCarousel = ({ menuData }) => {
  if (!menuData) return null; // Guard clause for empty menuData

  // Assuming menuData has sections like hotDrinks, coldDrinks, foodItems, specialOffers
  const sections = [
    { title: 'Hot Drinks', items: menuData.hotDrinks },
    { title: 'Cold Drinks', items: menuData.coldDrinks },
    { title: 'Food Items', items: menuData.foodItems },
    { title: 'Special Offers', items: menuData.specialOffers },
  ];

  return (
    <Box sx={{ my: 2, overflowX: 'auto' }}>
      {sections.map((section, sectionIndex) => (
        section.items && section.items.length > 0 && (
          <Box key={sectionIndex} sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>{section.title}</Typography>
            <Box sx={{ display: 'flex' }}>
              {section.items.map((item, itemIndex) => (
                <Paper key={itemIndex} sx={{ p: 2, mr: 2, minWidth: 150 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                  <Typography variant="body2">{item.description}</Typography>
                  {item.price && <Typography variant="body2">€{parseFloat(item.price).toFixed(2)}</Typography>}
                  {item.sizes && (
                    <Typography variant="body2">Sizes: {item.sizes.join(', ')}</Typography>
                  )}
                  {item.addOns && (
                    <Typography variant="body2">Add-ons: {item.addOns.join(', ')}</Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>
        )
      ))}
    </Box>
  );
};


const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load conversation history from local storage on initial load
    const loadHistory = async () => {
      try {
        const history = await localforage.getItem('chatHistory');
        if (history) {
          setMessages(history);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    // Save conversation history to local storage whenever messages state changes
    const saveHistory = async () => {
      try {
        await localforage.setItem('chatHistory', messages);
      } catch (err) {
        console.error('Error saving chat history:', err);
      }
    };

    saveHistory();
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageToSend) => {
    const messageToProcess = messageToSend !== undefined ? messageToSend : input;
    if (messageToProcess.trim() === '') return;

    const newMessage = { text: messageToProcess, sender: 'user' };
    setMessages([...messages, newMessage]);

    // Clear the input only if the message came from the input field
    if (messageToSend === undefined) {
      setInput('');
    }

    try {
      setIsTyping(true); // Indicate that the bot is typing
      // Send message to the backend API
      const response = await axios.post(API_URL + '/chat', { message: messageToProcess, userId: 'testuser123' }); // Added userId as per server expectations
      const botMessage = { text: response.data.response, sender: 'bot', quickReplies: response.data.quickReplies, menuData: response.data.menuData }; // Include menuData if returned
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      setError('Failed to get response from the chatbot. Please try again.');
      console.error('Error sending message:', error);
      // Optionally add a message to the chat indicating the error
      setMessages(prevMessages => [...prevMessages, { text: "I'm currently having trouble connecting to my server. Please try again in a moment.", sender: 'bot' }]);
    } finally {
      setIsTyping(false); // Stop typing indicator
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };


  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocalCafeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          HazelBot
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          mb: 2,
          overflow: 'auto',
          backgroundColor: '#f5f5f5'
        }}
      >
        <>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                {message.sender === 'bot' && (
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                    <SmartToyIcon />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 2,
                    display: message.sender === 'user' ? 'flex' : undefined,
                    width: message.sender === 'user' ? 'auto' : undefined,
                    maxWidth: '70%',
                    minWidth: message.sender === 'user' ? '80px' : undefined,
                    backgroundColor: message.sender === 'user' ? 'primary.main' : 'white',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    overflowWrap: 'normal',
                    wordBreak: message.sender === 'user' ? 'keep-all' : 'break-word',
                    textAlign: message.sender === 'user' ? 'center' : 'left',
                    alignItems: message.sender === 'user' ? 'center' : undefined,
                    justifyContent: message.sender === 'user' ? 'center' : undefined,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {/* Render message text, detecting and creating links for URLs */}
                    {message.sender === 'bot' && message.text && typeof message.text === 'string' ?
                      message.text.split(/(\bhttps?:\/\/\S+)/g).map((part, partIndex) => {
                        if (part.match(/^https?:\/\/\S+/)) {
                          // Ensure part is a string before using in a link
                          const linkText = typeof part === 'string' ? part : '';
                          return <a key={partIndex} href={linkText} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.dark, textDecoration: 'underline' }}>{linkText}</a>;
                        } else {
                          // Ensure part is a string before rendering
                          return typeof part === 'string' ? part : '';
                        }
                      })
                      : typeof message.text === 'string' ? message.text : '' // Render plain text if not bot or text is not a string
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                    {message.timestamp}
                  </Typography>
                </Paper>
              </Box>
               {message.menuData && <MenuCarousel menuData={message.menuData} />} {/* Render MenuCarousel if menuData exists */}
              {message.quickReplies && (
                <Box sx={{
                  mt: 1,
                  display: 'block',
                }}>
                  {message.quickReplies.map((reply, idx) => (
                    <div
                      key={idx}
                      className="quick-reply-chip"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </div>
                  ))}
                </Box>
              )}
            </Box>
          ))}
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                <SmartToyIcon />
              </Avatar>
              <Paper sx={{ p: 1 }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isTyping}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 25,
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => sendMessage()}
          endIcon={<SendIcon />}
          disabled={isTyping}
          sx={{ minWidth: 100 }}
        >
          Send
        </Button>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const App = () => {
  // We are removing react-router-dom routing for the TrainingPanel
  // since it's not included in this deployment setup.
  // If you add back the TrainingPanel and its route, uncomment the relevant code.

  return (
    <BrowserRouter basename="/Hazelbot"> {/* Wrap the app with BrowserRouter and specify basename */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Render your main component here */}
        <ChatInterface />
        {/* If you add back routing, use Routes and Route components here */}
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;