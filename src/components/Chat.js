import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Avatar, Button, Card, CardContent, Divider, Link as MuiLink, Stack } from '@mui/material';
import { Send as SendIcon, Coffee as CoffeeIcon, Link as LinkIcon } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import ChairIcon from '@mui/icons-material/Chair';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const ChatWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)',
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  overflow: 'hidden',
});

const MessagesArea = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
  minHeight: 0,
});

const QuickRepliesBar = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: '8px 16px',
  background: '#faf7f3',
  borderTop: '1px solid #eee',
});

const InputBar = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: 16,
  borderTop: '1px solid #eee',
  background: '#faf7f3',
  flexShrink: 0,
});

const MessageBubble = styled(Box, { shouldForwardProp: (prop) => prop !== '$isUser' })(
  ({ theme, $isUser }) => ({
    maxWidth: '80%',
    width: 'fit-content',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(2),
    backgroundColor: $isUser ? theme.palette.primary.main : '#d7ccc8',
    color: $isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  })
);

const QuickReplyButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: 20,
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: 'none',
  fontSize: '0.85rem',
  padding: '4px 12px',
  minWidth: 0,
  height: 32,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: 'none',
  },
}));

const QuickRepliesRow = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
});

const BaristaIntro = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  background: '#fff',
}));

const parseMenu = (menuStr) => {
  // Parse the menu string into sections and items
  const sections = {};
  let currentSection = null;
  menuStr.split('\n').forEach(line => {
    if (/Hot Drinks:/i.test(line)) currentSection = 'Hot Drinks';
    else if (/Cold Drinks:/i.test(line)) currentSection = 'Cold Drinks';
    else if (/Food Items:/i.test(line)) currentSection = 'Food';
    else if (/For our complete menu/i.test(line)) currentSection = 'Links';
    else if (currentSection && line.trim().startsWith('-')) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line.replace(/^\s*-\s*/, ''));
    } else if (currentSection === 'Links' && line.includes('doordash.com')) {
      if (!sections.Links) sections.Links = [];
      sections.Links.push(line.trim());
    }
  });
  return sections;
};

const parseMarkdownText = (text) => {
  const elements = [];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    let currentText = line.trim(); // Trim the line first to remove leading/trailing spaces
    let isListItem = false;

    // 1. Handle Headings
    if (currentText.startsWith('###')) {
      elements.push(<Typography key={index} variant="h6" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{currentText.replace(/###\s*/, '')}</Typography>);
      return; // Move to next line
    } else if (currentText.startsWith('##')) {
      elements.push(<Typography key={index} variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{currentText.replace(/##\s*/, '')}</Typography>);
      return;
    } else if (currentText.startsWith('#')) {
      elements.push(<Typography key={index} variant="h4" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{currentText.replace(/#\s*/, '')}</Typography>);
      return;
    }

    // 2. Handle List Items
    const listItemMatch = currentText.match(/^(?:\d+\.|[-*])\s*(.*)/);
    if (listItemMatch) {
      isListItem = true;
      currentText = listItemMatch[1].trim(); // Get content after list marker and trim it
    }

    // 3. Handle Bold Text and General Text
    const parts = currentText.split(/(\*\*[\s\S]*?\*\*)/g); // Split by bold markdown
    const formattedContent = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Typography key={i} component="span" sx={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Typography>;
      }
      return part;
    });

    // Aggressive final clean-up for remaining markdown symbols if any:
    const finalContent = formattedContent.map(item => {
      if (typeof item === 'string') {
        return item
          .replace(/\*/g, '') // Remove all asterisks (this might be redundant now but harmless)
          .replace(/^- /, '') // Remove leading hyphen and space
          .replace(/^\d+\.\s*/, ''); // Remove leading number and dot
      }
      return item;
    });

    if (isListItem) {
      elements.push(<ListItem key={index} disablePadding sx={{ py: 0.25, pl: 2 }} isListItem={true}><ListItemText primary={<Typography variant="body2">{finalContent}</Typography>} /></ListItem>);
    } else if (currentText !== '') { // Check if `currentText` (which is now `formattedContent`) is not empty
      elements.push(<Typography key={index} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-line' }}>{finalContent}</Typography>);
    }
  });

  // Wrap list items in a List component if there are any
  const finalElements = [];
  let currentList = [];
  let inList = false;

  elements.forEach(el => {
    if (el.props && el.props.isListItem) { // Ensure el.props exists
      if (!inList) {
        currentList = [];
        inList = true;
      }
      currentList.push(el);
    } else {
      if (inList) {
        finalElements.push(<List key={`list-${finalElements.length}`} dense sx={{ py: 0 }}>{currentList}</List>);
        currentList = [];
        inList = false;
      }
      finalElements.push(el);
    }
  });
  if (inList) {
    finalElements.push(<List key={`list-${finalElements.length}`} dense sx={{ py: 0 }}>{currentList}</List>);
  }

  return finalElements;
};

const parseProductDetails = (text) => {
  const details = {
    title: null,
    description: null,
    sizeOptions: [],
    price: [],
    footer: null
  };
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('###')) {
      details.title = line.replace(/###\s*/, '').trim();
    } else if (line.startsWith('- **Description**:')) {
      details.description = line.replace(/^- \*\*Description\*\*:\s*/, '').trim();
    } else if (line.startsWith('- **Size Options**:')) {
      details.sizeOptions = line.replace(/^- \*\*Size Options\*\*:\s*/, '').split(',').map(item => item.trim());
    } else if (line.startsWith('- **Price**:')) {
      currentSection = 'price';
    } else if (currentSection === 'price' && line.startsWith('-')) {
      details.price.push(line.replace(/^- \s*/, '').trim());
    } else if (line.includes('Would you like to try a slice') || line.includes('Need more information')) {
      details.footer = line.trim();
    } else if (!details.title && !details.description && !details.sizeOptions.length && !details.price.length) {
      // If no structured fields are found yet, treat it as part of the initial text
      if (!details.initialText) details.initialText = '';
      details.initialText += line + '\n';
    }
  }

  // Clean up initialText if it's only whitespace
  if (details.initialText) {
    details.initialText = details.initialText.trim();
    if (details.initialText === '') delete details.initialText;
  }

  // Determine if this text actually represents product details
  if (details.title || details.description || details.sizeOptions.length > 0 || details.price.length > 0) {
    return details;
  } else {
    return null;
  }
};

const MenuCard = ({ menu }) => {
  if (!menu) return null;
  const sections = parseMenu(menu);
  return (
    <Card sx={{ mb: 2, background: '#f3e5ab' }}>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          Menu
        </Typography>
        <List dense>
          {sections['Hot Drinks'] && (
            <>
              <ListSubheader>Hot Drinks</ListSubheader>
              {sections['Hot Drinks'].map((item, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </>
          )}
          {sections['Cold Drinks'] && (
            <>
              <ListSubheader>Cold Drinks</ListSubheader>
              {sections['Cold Drinks'].map((item, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </>
          )}
          {sections['Food'] && (
            <>
              <ListSubheader>Food</ListSubheader>
              {sections['Food'].map((item, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </>
          )}
        </List>
        {sections.Links && sections.Links.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkIcon />}
              href={sections.Links[0]}
              target="_blank"
              rel="noopener"
            >
              Browse Full Menu (DoorDash)
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const OrderSummaryCard = ({ summary }) => (
  <Card sx={{ mb: 2, background: '#ffe0b2' }}>
    <CardContent>
      <Typography variant="h6" color="primary" gutterBottom>
        Order Summary
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{summary}</Typography>
    </CardContent>
  </Card>
);

const LinksRow = ({ links }) => (
  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
    {links.map((link, idx) => (
      <MuiLink key={idx} href={link.url} target="_blank" rel="noopener" underline="none">
        <Button variant="outlined" startIcon={<LinkIcon />}>{link.label}</Button>
      </MuiLink>
    ))}
  </Stack>
);

const HoursCard = ({ text }) => (
  <Card sx={{ mb: 2, background: '#e3f2fd' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary">Hours</Typography>
      </Box>
      <List dense>
        {text.split('\n').filter(line => line && !line.toLowerCase().includes('here are our hours')).map((line, idx) => (
          <ListItem key={idx} disablePadding>
            <ListItemText primary={line} />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

const EventsCard = ({ text }) => (
  <Card sx={{ mb: 2, background: '#fff3e0' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <EventIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary">Upcoming Events</Typography>
      </Box>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{text}</Typography>
    </CardContent>
  </Card>
);

const ReservationCard = ({ text }) => (
  <Card sx={{ mb: 2, background: '#ede7f6' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ChairIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary">Reservation Info</Typography>
      </Box>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{text}</Typography>
    </CardContent>
  </Card>
);

const AICard = ({ text, options, handleQuickReplyClick }) => {
  const theme = useTheme();
  const productDetails = parseProductDetails(text);

  return (
    <Card sx={{ mb: 2, background: '#fce4ec' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <SmartToyIcon color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6" color="secondary">AI Assistant</Typography>
        </Box>
        {productDetails ? (
          <Box>
            {productDetails.initialText && (
              <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
                {productDetails.initialText}
              </Typography>
            )}
            {productDetails.title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>
                {productDetails.title}
              </Typography>
            )}
            {productDetails.description && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Description:</Typography> {productDetails.description}
              </Typography>
            )}
            {(productDetails.sizeOptions.length > 0 || productDetails.price.length > 0) && (
              <List dense sx={{ padding: 0 }}>
                {productDetails.sizeOptions.length > 0 && (
                  <ListItem disablePadding>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>Size Options:</Typography> {productDetails.sizeOptions.join(', ')}
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                {productDetails.price.length > 0 && (
                  <ListItem disablePadding>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>Price:</Typography>
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                {productDetails.price.map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ pl: 2 }}>
                    <ListItemText primary={<Typography variant="body2">{item}</Typography>} />
                  </ListItem>
                ))}
              </List>
            )}
            {productDetails.footer && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {productDetails.footer}
              </Typography>
            )}
          </Box>
        ) : (
          <Box>{parseMarkdownText(text)}</Box>
        )}
        {options && options.length > 0 && (
          <QuickRepliesRow>
            {options.map((option, index) => (
              <QuickReplyButton key={index} onClick={() => handleQuickReplyClick(option)}>
                {option}
              </QuickReplyButton>
            ))}
          </QuickRepliesRow>
        )}
      </CardContent>
    </Card>
  );
};

const StructuredBotCard = styled(Card)(({ theme }) => ({
  background: '#f5f5f5',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  maxWidth: '80%',
  width: 'fit-content',
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
}));

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    setMessages([
      {
        isUser: false,
        type: 'intro',
        title: 'Welcome!',
        text: "Hi! I'm Hazel, your virtual barista ☕\nHow can I help you today?",
        options: ["Menu", "Order", "Hours", "Location", "Events"]
      },
    ]);
    setQuickReplies(["Menu", "Order", "Hours", "Location", "Events"]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (msg) => {
    const text = typeof msg === 'string' ? msg : input;
    if (!text.trim()) return;

    const userMessage = {
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setQuickReplies([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      const botMessage = {
        isUser: false,
        ...data,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      if (data.options && Array.isArray(data.options)) {
        setQuickReplies(data.options);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        text: "Sorry, I'm having trouble thinking right now!",
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatWrapper>
      <BaristaIntro>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
          <CoffeeIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
          HazelBot
        </Typography>
      </BaristaIntro>
      <Divider sx={{ mb: 0 }} />
      <MessagesArea>
        {messages.map((message, index) => {
          const isLastBot =
            !message.isUser &&
            index === messages.length - 1 &&
            quickReplies.length > 0;
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              {message.isUser ? (
                <MessageBubble $isUser={true}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontSize: '1rem' }}>
                    {message.text}
                  </Typography>
                </MessageBubble>
              ) : message.type === 'hours' ? (
                <HoursCard text={message.text}>
                  {isLastBot && (
                    <QuickRepliesRow>
                      {quickReplies.map((reply, idx) => (
                        <QuickReplyButton key={idx} onClick={() => handleSend(reply)}>
                          {reply}
                        </QuickReplyButton>
                      ))}
                    </QuickRepliesRow>
                  )}
                </HoursCard>
              ) : message.type === 'events' || message.type === 'signature_drinks' ? (
                <EventsCard text={message.text}>
                  {isLastBot && (
                    <QuickRepliesRow>
                      {quickReplies.map((reply, idx) => (
                        <QuickReplyButton key={idx} onClick={() => handleSend(reply)}>
                          {reply}
                        </QuickReplyButton>
                      ))}
                    </QuickRepliesRow>
                  )}
                </EventsCard>
              ) : message.type === 'reservation' ? (
                <ReservationCard text={message.text}>
                  {isLastBot && (
                    <QuickRepliesRow>
                      {quickReplies.map((reply, idx) => (
                        <QuickReplyButton key={idx} onClick={() => handleSend(reply)}>
                          {reply}
                        </QuickReplyButton>
                      ))}
                    </QuickRepliesRow>
                  )}
                </ReservationCard>
              ) : message.type === 'llm' ? (
                <AICard text={message.text} options={message.options} handleQuickReplyClick={handleSend} />
              ) : (
                <StructuredBotCard>
                  {message.title && (
                    <Typography variant="h6" color="primary" gutterBottom sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontSize: '1.1rem' }}>
                      {message.title}
                    </Typography>
                  )}
                  {message.text && (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', mb: 1, fontSize: '0.97rem' }}>
                      {message.text}
                    </Typography>
                  )}
                  {message.menu && <MenuCard menu={message.menu} />}
                  {message.orderSummary && <OrderSummaryCard summary={message.orderSummary} />}
                  {message.links && message.links.length > 0 && <LinksRow links={message.links} />}
                  {isLastBot && (
                    <QuickRepliesRow>
                      {quickReplies.map((reply, idx) => (
                        <QuickReplyButton key={idx} onClick={() => handleSend(reply)}>
                          {reply}
                        </QuickReplyButton>
                      ))}
                    </QuickRepliesRow>
                  )}
                </StructuredBotCard>
              )}
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </MessagesArea>
      <InputBar>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
        />
        <IconButton
          color="primary"
          onClick={() => handleSend()}
          disabled={!input.trim()}
        >
          <SendIcon />
        </IconButton>
      </InputBar>
    </ChatWrapper>
  );
};

export default Chat; 