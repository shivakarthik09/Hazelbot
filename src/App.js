import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  AppBar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import localforage from 'localforage';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#795548', // Coffee brown
    },
    secondary: {
      main: '#8d6e63', // Lighter brown
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://hazelbot-backend.onrender.com/api'
  : 'http://localhost:3001/api';

const MenuCarousel = ({ menuData }) => {
  if (!menuData) return null;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Our Menu 🍵
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(menuData.categories).map(([category, data]) => (
          <Grid item xs={12} key={category}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {data.name}
                </Typography>
                <Grid container spacing={1}>
                  {data.items.map((item) => (
                    <Grid item xs={12} key={item.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" color="primary">
                          ${item.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load messages from local storage on component mount
  useEffect(() => {
    localforage.getItem('chatMessages').then(savedMessages => {
      if (Array.isArray(savedMessages)) {
        setMessages(savedMessages);
      } else {
        setMessages([]);
      }
    }).catch(err => {
      console.error('Error loading messages from local storage:', err);
      setMessages([]);
    });
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    localforage.setItem('chatMessages', messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Ensure the API call uses the full absolute URL
      const response = await axios.post(API_URL + '/chat', { message: messageToProcess, userId: 'testuser123' }); // Added userId as per server expectations
      const botMessage = { text: response.data.response, sender: 'bot', quickReplies: response.data.quickReplies };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      setError('Failed to get response from the chatbot. Please try again.');
      console.error('Error sending message:', error);
      // Optionally add a message to the chat indicating the error
      setMessages(prevMessages => [...prevMessages, { text: "I'm currently having trouble connecting to my server. Please try again in a moment.", sender: 'bot' }]);
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
              {message.menuData && <MenuCarousel menuData={message.menuData} />}
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
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <ChatInterface />
      </Box>
    </ThemeProvider>
  );
};

export default App; 